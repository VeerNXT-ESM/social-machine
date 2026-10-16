import 'server-only';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceUserId } from './workspace';
import type { MediaItem } from '@/types';

export const MEDIA_BUCKET = 'media';
/** The largest file a person may upload. What is stored is much smaller (see optimizeImage). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Every stored picture is converted to WebP within these limits.
const MAX_EDGE = 2048; // longest side in pixels; smaller pictures are never enlarged
const TARGET_BYTES = 600 * 1024; // quality is lowered step by step until the file is about this size
const START_QUALITY = 82;
const MIN_QUALITY = 55;
const MAX_INPUT_PIXELS = 50_000_000; // refuse "decompression bombs": tiny files that expand to enormous images
const THUMB_SIZE = 480;

let bucketReady = false;

type Sharp = typeof import('sharp').default;
let sharpModule: Promise<Sharp> | null = null;
/**
 * sharp is a native module. It is loaded at run time (not bundled) because the bundler cannot link
 * native packages on drives that do not support junction points, such as this project's K: drive.
 */
function loadSharp(): Promise<Sharp> {
  sharpModule ??= import(/* turbopackIgnore: true */ /* webpackIgnore: true */ 'sharp').then((m) => m.default);
  return sharpModule;
}

/**
 * Create the public `media` bucket if it does not exist yet. The bucket is public because social
 * platforms must be able to fetch the image URL; only the server (secret key) can write to it.
 */
export async function ensureMediaBucket(): Promise<void> {
  if (bucketReady) return;
  const supabase = createAdminClient();

  const { data: existing } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!existing) {
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'video/mp4'],
    });
    if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create bucket: ${error.message}`);
  }
  bucketReady = true;
}

function publicBase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not set');
  return `${url.replace(/\/$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/`;
}

/** True only for addresses inside our own media bucket, so a post cannot be pointed at an outside site. */
export function isOwnMediaUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith(publicBase()) && !url.includes('..');
}

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

/** Identify an image from its first bytes. The browser-supplied type is never trusted. */
export function sniffImage(bytes: Buffer): ImageMime | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export class UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface OptimizedImage {
  bytes: Buffer;
  width: number;
  height: number;
}

/**
 * Convert any PNG, JPEG or WebP to a compact WebP:
 *  - the longest side is limited to 2048 px (never enlarged),
 *  - camera orientation is applied, then all metadata (including GPS location) is dropped,
 *  - quality starts at 82 and is lowered in steps until the file is around 600 KB.
 */
export async function optimizeImage(input: Buffer): Promise<OptimizedImage> {
  const sharp = await loadSharp();
  const render = (quality: number) =>
    sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });

  try {
    let quality = START_QUALITY;
    let out = await render(quality);
    while (out.data.length > TARGET_BYTES && quality > MIN_QUALITY) {
      quality -= 9;
      out = await render(quality);
    }
    return { bytes: out.data, width: out.info.width, height: out.info.height };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (/pixel limit/i.test(message)) throw new UploadError('That picture is too large in pixels to process. Please use a smaller one.', 413);
    throw new UploadError('That file could not be read as an image.');
  }
}

/** A small square WebP copy for lists and pickers. */
async function makeThumbnail(webp: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  return sharp(webp).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).webp({ quality: 70 }).toBuffer();
}

interface StoreInput {
  image: OptimizedImage;
  /** Folder inside the bucket, for example "generated" or "uploads". */
  folder: string;
  /** Shown in the media library; defaults to the stored file name. */
  filename?: string;
  /** Size of the file before compression, reported back to the caller. */
  originalBytes: number;
}

async function storeOptimized({ image, folder, filename, originalBytes }: StoreInput): Promise<MediaItem> {
  await ensureMediaBucket();
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();

  const id = randomUUID();
  const now = new Date();
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${id}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, image.bytes, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

  // Thumbnail: best effort. If it cannot be made, the original still works and lists fall back to it.
  let thumbPath: string | null = null;
  let thumbUrl: string | null = null;
  try {
    const candidate = `thumbs/${id}.webp`;
    const { error: thumbError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(candidate, await makeThumbnail(image.bytes), { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (!thumbError) {
      thumbPath = candidate;
      thumbUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(candidate).data.publicUrl;
    }
  } catch (err) {
    console.error('Thumbnail could not be created:', err);
  }

  const { data, error: rowError } = await supabase
    .from('media')
    .insert({
      user_id: userId,
      filename: filename ?? `${id}.webp`,
      type: 'image',
      mime_type: 'image/webp',
      size_bytes: image.bytes.length,
      width: image.width,
      height: image.height,
      storage_path: path,
      public_url: publicUrl,
      thumb_url: thumbUrl,
      thumb_path: thumbPath,
    })
    .select('*')
    .single();
  if (rowError || !data) {
    // Keep storage and the table consistent: do not leave an unrecorded file behind.
    await supabase.storage.from(MEDIA_BUCKET).remove([path, ...(thumbPath ? [thumbPath] : [])]);
    throw new Error(`Could not record the image: ${rowError?.message}`);
  }
  return { ...(data as MediaItem), original_bytes: originalBytes };
}

export interface SaveImageInput {
  bytes: Buffer;
  folder?: string;
  filename?: string;
}

/** Compress an image to WebP, store it with a thumbnail, and return the stored record. */
export async function storeImage({ bytes, folder = 'generated', filename }: SaveImageInput): Promise<MediaItem> {
  const image = await optimizeImage(bytes);
  return storeOptimized({ image, folder, filename, originalBytes: bytes.length });
}

/** Same as storeImage but returns only the public address (used for AI-generated images). */
export async function saveImage(input: SaveImageInput): Promise<string> {
  return (await storeImage(input)).public_url;
}

/** Validate a file chosen by a person, compress it to WebP and store it. Throws UploadError with a readable message. */
export async function saveUpload(file: { bytes: Buffer; name: string }): Promise<MediaItem> {
  if (file.bytes.length === 0) throw new UploadError('That file is empty.');
  if (file.bytes.length > MAX_UPLOAD_BYTES) throw new UploadError('That image is larger than 10 MB. Please use a smaller file.', 413);
  if (!sniffImage(file.bytes)) throw new UploadError('Only PNG, JPEG or WebP images can be uploaded.', 415);

  const image = await optimizeImage(file.bytes);

  // Display name only: strip any path and odd characters, and show the real format now stored.
  const base = file.name.split(/[\\/]/).pop()!.replace(/\.[^.]*$/, '').replace(/[^\w .()-]/g, '_').slice(0, 110) || 'upload';
  return storeOptimized({ image, folder: 'uploads', filename: `${base}.webp`, originalBytes: file.bytes.length });
}

export async function listMedia(limit = 100): Promise<MediaItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 300));
  if (error) throw new Error(error.message);
  return data as MediaItem[];
}

/** Delete an image, but refuse if any post still uses it. Returns how many posts use it when refused. */
export async function deleteMedia(id: string): Promise<{ deleted: boolean; usedBy: number }> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase.from('media').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return { deleted: false, usedBy: 0 };

  const { data: used, error: usedError } = await supabase
    .from('platform_posts')
    .select('id')
    // media_urls is a JSON list, so the containment test needs a JSON value
    .filter('media_urls', 'cs', JSON.stringify([row.public_url]));
  if (usedError) throw new Error(usedError.message);
  if ((used ?? []).length > 0) return { deleted: false, usedBy: used!.length };

  await supabase.storage.from(MEDIA_BUCKET).remove([row.storage_path, ...(row.thumb_path ? [row.thumb_path] : [])]);
  const { error: delError } = await supabase.from('media').delete().eq('id', row.id);
  if (delError) throw new Error(delError.message);
  return { deleted: true, usedBy: 0 };
}
