import { NextResponse } from 'next/server';
import { listMedia, saveUpload, UploadError } from '@/lib/db/media';
import { badRequest, serverError } from '@/lib/db/http';

export async function GET() {
  try {
    return NextResponse.json({ media: await listMedia() });
  } catch (err) {
    return serverError('GET /api/media', err);
  }
}

/** Upload one image (multipart form field "file"). The type is checked from the file contents. */
export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return badRequest('Choose an image file to upload.');
    }
    const file = form.get('file');
    if (!(file instanceof File)) return badRequest('Choose an image file to upload.');

    const media = await saveUpload({ bytes: Buffer.from(await file.arrayBuffer()), name: file.name });
    return NextResponse.json({ media });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    return serverError('POST /api/media', err);
  }
}
