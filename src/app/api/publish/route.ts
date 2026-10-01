import { NextResponse } from 'next/server';
import { getPublishingProvider } from '@/lib/publishing';
import { mockRepo } from '@/lib/mockStore';
import { PlatformPost } from '@/types';

export async function POST(req: Request) {
  try {
    const { contentItemId, platform, action, scheduledAt, mode = 'mock', post: clientPost } = await req.json();

    if (!contentItemId || !platform || !action) {
      return NextResponse.json({ error: 'Missing contentItemId, platform, or action' }, { status: 400 });
    }

    // The store lives in the browser's localStorage, so the client sends the post along.
    const item = mockRepo.getItemById(contentItemId);
    const post: PlatformPost | undefined =
      clientPost ?? item?.posts?.[platform as keyof typeof item.posts];
    if (!post) {
      return NextResponse.json({ error: 'Post not found for given platform' }, { status: 404 });
    }

    // Check approval status guard: Only APPROVED posts can be scheduled or published
    if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED' && post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Only APPROVED posts can be scheduled or published.' },
        { status: 400 }
      );
    }

    const provider = getPublishingProvider(mode, platform);

    if (action === 'publish_now') {
      const result = await provider.publishPost(post);
      if (result.success) {
        mockRepo.updatePostStatus(contentItemId, platform, 'PUBLISHED');
        return NextResponse.json({
          success: true,
          status: 'PUBLISHED',
          external_id: result.external_id,
          external_url: result.external_url,
        });
      } else {
        return NextResponse.json({ error: result.error || 'Publishing failed' }, { status: 500 });
      }
    }

    if (action === 'schedule') {
      if (!scheduledAt) {
        return NextResponse.json({ error: 'scheduledAt timestamp is required' }, { status: 400 });
      }
      const result = await provider.schedulePost(post, scheduledAt);
      if (result.success) {
        mockRepo.updatePostStatus(contentItemId, platform, 'SCHEDULED', scheduledAt);
        return NextResponse.json({
          success: true,
          status: 'SCHEDULED',
          scheduled_at: scheduledAt,
          external_id: result.external_id,
        });
      } else {
        return NextResponse.json({ error: result.error || 'Scheduling failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('API /api/publish error:', err);
    return NextResponse.json({ error: err.message || 'Publish operation failed' }, { status: 500 });
  }
}
