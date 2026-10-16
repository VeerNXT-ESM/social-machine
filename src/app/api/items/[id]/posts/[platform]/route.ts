import { NextResponse } from 'next/server';
import { setItemMedia, updatePost, PostPatch } from '@/lib/db/items';
import { isOwnMediaUrl } from '@/lib/db/media';
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
    if ('media_urls' in body) {
      // One image per post, and only from our own storage (an upload or a library image).
      const urls = body.media_urls;
      if (!Array.isArray(urls) || urls.length > 1 || !urls.every(isOwnMediaUrl)) {
        return badRequest('The image must be one uploaded through this app.');
      }
      patch.media_urls = urls;
    }
    if (Object.keys(patch).length === 0) return badRequest('Nothing to update');

    // "all_channels" applies an image change to every channel of the item (used by "Use on all channels")
    if (body.all_channels === true && 'media_urls' in patch) {
      const item = await setItemMedia(id, patch.media_urls ?? []);
      return item ? NextResponse.json({ item }) : notFound('Item');
    }

    const item = await updatePost(id, platform, patch);
    return item ? NextResponse.json({ item }) : notFound('Post');
  } catch (err) {
    return serverError('PATCH /api/items/[id]/posts/[platform]', err);
  }
}
