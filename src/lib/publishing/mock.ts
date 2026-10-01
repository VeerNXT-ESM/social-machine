import { PlatformPost, PostStatus } from '@/types';
import { PublishingProvider, PublishResult } from './types';

export class MockPublishingProvider implements PublishingProvider {
  name = 'Mock Publishing Provider';

  async publishPost(post: PlatformPost): Promise<PublishResult> {
    // Simulate network call
    await new Promise((res) => setTimeout(res, 800));

    const mockId = `mock-${post.platform}-${Date.now().toString(36)}`;
    let mockUrl = '';

    switch (post.platform) {
      case 'linkedin':
        mockUrl = `https://linkedin.com/feed/update/urn:li:activity:${mockId}`;
        break;
      case 'x':
        mockUrl = `https://x.com/VeerNXT/status/${mockId}`;
        break;
      case 'instagram':
        mockUrl = `https://instagram.com/p/${mockId}`;
        break;
      case 'facebook':
        mockUrl = `https://facebook.com/veernxt/posts/${mockId}`;
        break;
    }

    return {
      success: true,
      external_id: mockId,
      external_url: mockUrl,
    };
  }

  async schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult> {
    await new Promise((res) => setTimeout(res, 600));

    const mockId = `mock-sched-${post.platform}-${Date.now().toString(36)}`;
    return {
      success: true,
      external_id: mockId,
    };
  }

  async getPostStatus(externalId: string): Promise<PostStatus> {
    return 'PUBLISHED';
  }

  async deleteScheduledPost(externalId: string): Promise<boolean> {
    return true;
  }
}
