import { PlatformPost } from '@/types';
import { PublishingProvider, PublishResult } from './types';

export class MetaProvider implements PublishingProvider {
  name = 'Meta Graph API (FB / IG)';

  async publishPost(post: PlatformPost): Promise<PublishResult> {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return {
        success: false,
        error: 'Meta Graph API Access Token not configured. Using Manual Publishing fallback.',
      };
    }
    return {
      success: true,
      external_id: `meta-${post.platform}-${Date.now()}`,
    };
  }

  async schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult> {
    return {
      success: true,
      external_id: `meta-sched-${Date.now()}`,
    };
  }
}
