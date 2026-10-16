import 'server-only';
import { randomUUID } from 'crypto';
import { imageSize } from 'image-size';
import { Jimp } from 'jimp';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceUserId } from './workspace';
import type { MediaItem } from '@/types';

export const MEDIA_BUCKET = 'media';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const THUMB_SIZE = 480;

let bucketReady = false;

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

/**
 * A small square JPEG copy for lists and pickers. Pure JavaScript on purpose: native image libraries
 * cannot be linked by the dev server on every drive type, and this works the same everywhere.
 * WebP uploads are not supported by this library, so they simply have no thumbnail and lists use the original.
 */
export async function makeThumbnail(bytes: Buffer): Promise<Buffer> {
  const image = await Jimp.read(bytes);
  image.cover({ w: THUMB_SIZE, h: THUMB_SIZE });
  return Buffer.from(await image.getBuffer('image/jpeg', { quality: 72 }));
}

export interface SaveImageInput {
  bytes: Buffer;
  mimeType?: string;
  width?: number;
  height?: number;
  /** Folder inside the bucket, for example "generated" or "uploads". */
  folder?: string;
  /** Shown in the media library; defaults to the stored file name. */
  filename?: string;
}

/** Upload an image to storage and record it in the `media` table. Returns the stored record. */
export async function storeImage({
  bytes,
  mimeType = 'image/png',
  width,
  height,
  folder = 'generated',
  filename,
}: SaveImageInput): Promise<MediaItem> {
  await ensureMediaBucket();
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
  const now = new Date();
  const id = randomUUID();
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, { contentType: mimeType, cacheControl: '31536000', upsert: false });
  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

  // Thumbnail: best effort. If it cannot be made, the original still works and lists fall back to it.
  let thumbPath: string | null = null;
  let thumbUrl: string | null = null;
  try {
    const candidate = `thumbs/${id}.jpg`;
    const { error: thumbError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(candidate, await makeThumbnail(bytes), { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
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
      filename: filename ?? path.split('/').pop(),
      type: 'image',
      mime_type: mimeType,
      size_bytes: bytes.length,
      width: width ?? null,
      height: height ?? null,
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
  return data as MediaItem;
}

/** Upload an image and return only its public URL (used for AI-generated images). */
export async function saveImage(input: SaveImageInput): Promise<string> {
  return (await storeImage(input)).public_url;
}

export class UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Validate a file chosen by a person and store it. Throws UploadError with a readable message. */
export async function saveUpload(file: { bytes: Buffer; name: string }): Promise<MediaItem> {
  if (file.bytes.length === 0) throw new UploadError('That file is empty.');
  if (file.bytes.length > MAX_UPLOAD_BYTES) throw new UploadError('That image is larger than 10 MB. Please use a smaller file.', 413);

  const mime = sniffImage(file.bytes);
  if (!mime) throw new UploadError('Only PNG, JPEG or WebP images can be uploaded.', 415);

  let width: number | undefined;
  let height: number | undefined;
  try {
    const dims = imageSize(file.bytes);
    width = dims.width;
    height = dims.height;
  } catch {
    throw new UploadError('That file could not be read as an image.');
  }

  // Display name only: strip any path and odd characters. The stored file name is always a random id.
  const safeName = file.name.split(/[\\/]/).pop()!.replace(/[^\w .()-]/g, '_').slice(0, 120) || 'upload';
  return storeImage({ bytes: file.bytes, mimeType: mime, width, height, folder: 'uploads', filename: safeName });
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
  const { error: delError } = await supabase.from('media').delete().eq('id', id);
  if (delError) throw new Error(delError.message);
  return { deleted: true, usedBy: 0 };
}
