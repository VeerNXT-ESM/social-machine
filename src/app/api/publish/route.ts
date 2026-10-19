import { NextResponse } from 'next/server';
import { getPublishingProvider } from '@/lib/publishing';
import { getPost, updatePost } from '@/lib/db/items';
import { deleteBufferPost, isBufferId } from '@/lib/publishing/buffer';
import { getBrandSettings } from '@/lib/db/brand';
import { findProhibited, postReadableText } from '@/lib/prohibited';
import { badRequest, isPlatform, notFound, serverError } from '@/lib/db/http';

/**
 * Publish or schedule one platform post. The post is read from the database (never trusted from the
 * browser) and its new status is saved there, so the response carries the updated item.
 */
export async function POST(req: Request) {
  try {
    const { contentItemId, platform, action, scheduledAt, mode = 'mock' } = await req.json();

    if (!contentItemId || !platform || !action) {
      return badRequest('Missing contentItemId, platform, or action');
    }
    if (!isPlatform(platform)) return badRequest('Unknown platform');

    const post = await getPost(contentItemId, platform);
    if (!post) return notFound('Post');

    // Cancel a scheduled post: remove it from Buffer (if it was sent there) and return it to Approved
    if (action === 'cancel') {
      if (post.status !== 'SCHEDULED') return badRequest('Only a scheduled post can be cancelled.');
      if (isBufferId(post.external_post_id)) {
        const removed = await deleteBufferPost(post.external_post_id);
        if (!removed.ok) return NextResponse.json({ error: removed.error }, { status: 502 });
      }
      const item = await updatePost(contentItemId, platform, { status: 'APPROVED', scheduled_at: null, external_post_id: null } as never);
      return NextResponse.json({ success: true, status: 'APPROVED', item });
    }

    // Whatever its route here, a post with a prohibited word is never sent out
    if (action === 'publish_now' || action === 'schedule') {
      const { words_to_avoid } = await getBrandSettings();
      const found = findProhibited(postReadableText(post), words_to_avoid);
      if (found.length > 0) {
        return badRequest(`This post contains a prohibited word or phrase (${found.join(', ')}). Edit the post to remove it, then try again.`);
      }
    }

    // Only approved posts may be scheduled or published
    if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED' && post.status !== 'PUBLISHED') {
      return badRequest('Only APPROVED posts can be scheduled or published.');
    }

    const provider = getPublishingProvider(mode, platform);

    if (action === 'publish_now') {
      const result = await provider.publishPost(post);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Publishing failed' }, { status: 500 });
      }
      const item = await updatePost(contentItemId, platform, {
        status: 'PUBLISHED',
        external_post_id: result.external_id,
        external_url: result.external_url,
      });
      return NextResponse.json({
        success: true,
        status: 'PUBLISHED',
        external_id: result.external_id,
        external_url: result.external_url,
        item,
      });
    }

    if (action === 'schedule') {
      if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
        return badRequest('A valid scheduledAt timestamp is required');
      }
      const result = await provider.schedulePost(post, scheduledAt);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Scheduling failed' }, { status: 500 });
      }
      const item = await updatePost(contentItemId, platform, {
        status: 'SCHEDULED',
        scheduled_at: new Date(scheduledAt).toISOString(),
        external_post_id: result.external_id,
      });
      return NextResponse.json({
        success: true,
        status: 'SCHEDULED',
        scheduled_at: scheduledAt,
        external_id: result.external_id,
        item,
      });
    }

    return badRequest('Invalid action');
  } catch (err) {
    return serverError('POST /api/publish', err);
  }
}
