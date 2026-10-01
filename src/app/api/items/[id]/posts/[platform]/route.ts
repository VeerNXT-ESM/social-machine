import { NextResponse } from 'next/server';
import { updatePost, PostPatch } from '@/lib/db/items';
import { badRequest, isPlatform, isStatus, notFound, serverError } from '@/lib/db/http';

/** Update the text, status or schedule of one platform post. Returns the whole updated item. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; platform: string }> }) {
  try {
    const { id, platform } = await params;
    if (!isPlatform(platform)) return badRequest('Unknown platform');

    const body = await req.json();
    const patch: PostPatch = {};

    if ('text' in body) {
      if (typeof body.text !== 'string') return badRequest('text must be a string');
      patch.text = body.text;
    }
    if ('status' in body) {
      if (!isStatus(body.status)) return badRequest('Invalid status');
      patch.status = body.status;
    }
    if ('scheduled_at' in body) {
      if (body.scheduled_at !== null && Number.isNaN(Date.parse(body.scheduled_at))) {
        return badRequest('scheduled_at must be a valid date');
      }
      patch.scheduled_at = body.scheduled_at;
    }
    if (Object.keys(patch).length === 0) return badRequest('Nothing to update');

    const item = await updatePost(id, platform, patch);
    return item ? NextResponse.json({ item }) : notFound('Post');
  } catch (err) {
    return serverError('PATCH /api/items/[id]/posts/[platform]', err);
  }
}
