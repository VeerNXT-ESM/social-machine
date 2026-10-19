import { NextResponse } from 'next/server';
import { deleteItem, getItem } from '@/lib/db/items';
import { releaseLinksForItem } from '@/lib/db/sources';
import { deleteBufferPost, isBufferId } from '@/lib/publishing/buffer';
import { notFound, serverError } from '@/lib/db/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await getItem(id);
    return item ? NextResponse.json({ item }) : notFound();
  } catch (err) {
    return serverError('GET /api/items/[id]', err);
  }
}

/**
 * Delete a content item and all its channel posts.
 * Posts still waiting in Buffer are cancelled there first, so nothing is published after deletion.
 * Posts that were already published stay on the social network: only the app's copy is removed.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await getItem(id);
    if (!item) return notFound();

    for (const post of Object.values(item.posts ?? {})) {
      if (post.status === 'SCHEDULED' && isBufferId(post.external_post_id)) {
        const removed = await deleteBufferPost(post.external_post_id);
        if (!removed.ok) {
          return NextResponse.json({ error: removed.error ?? 'A scheduled post could not be cancelled in Buffer, so nothing was deleted.' }, { status: 502 });
        }
      }
    }

    await releaseLinksForItem(id); // the source article becomes available again
    await deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError('DELETE /api/items/[id]', err);
  }
}
