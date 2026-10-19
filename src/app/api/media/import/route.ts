import { NextResponse } from 'next/server';
import { saveUpload, UploadError } from '@/lib/db/media';
import { assertPublicUrl, fetchImageBytes } from '@/lib/scraper/safeFetch';
import { badRequest, serverError } from '@/lib/db/http';

/** Save a picture from a public web address (for example an article's picture) into the media library as WebP. */
export async function POST(req: Request) {
  try {
    const { url } = await req.json().catch(() => ({}));
    if (typeof url !== 'string' || !url) return badRequest('A picture address is required.');

    let host: string;
    try {
      host = (await assertPublicUrl(url)).hostname.replace(/^www\./, '');
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'That address is not allowed.');
    }

    let bytes: Buffer;
    try {
      bytes = await fetchImageBytes(url);
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'The picture could not be downloaded.');
    }

    const media = await saveUpload({ bytes, name: `Article picture from ${host}` });
    return NextResponse.json({ media });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    return serverError('POST /api/media/import', err);
  }
}
