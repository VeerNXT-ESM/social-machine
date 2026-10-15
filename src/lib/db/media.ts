import 'server-only';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceUserId } from './workspace';

export const MEDIA_BUCKET = 'media';

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

export interface SaveImageInput {
  bytes: Buffer;
  mimeType?: string;
  width?: number;
  height?: number;
  /** Folder inside the bucket, for example "generated". */
  folder?: string;
  /** Shown in the media library; defaults to the stored file name. */
  filename?: string;
}

/**
 * Upload an image to storage and record it in the `media` table.
 * Returns the permanent public URL.
 */
export async function saveImage({
  bytes,
  mimeType = 'image/png',
  width,
  height,
  folder = 'generated',
  filename,
}: SaveImageInput): Promise<string> {
  await ensureMediaBucket();
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
  const now = new Date();
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, { contentType: mimeType, cacheControl: '31536000', upsert: false });
  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

  const { error: rowError } = await supabase.from('media').insert({
    user_id: userId,
    filename: filename ?? path.split('/').pop(),
    type: 'image',
    mime_type: mimeType,
    size_bytes: bytes.length,
    width: width ?? null,
    height: height ?? null,
    storage_path: path,
    public_url: publicUrl,
  });
  if (rowError) {
    // Keep storage and the table consistent: do not leave an unrecorded file behind.
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw new Error(`Could not record the image: ${rowError.message}`);
  }

  return publicUrl;
}
