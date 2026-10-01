import { PlatformPost } from '@/types';
import { PublishingProvider, PublishResult } from './types';

export class LinkedInProvider implements PublishingProvider {
  name = 'LinkedIn Native API';

  async publishPost(post: PlatformPost): Promise<PublishResult> {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) {
      return {
        success: false,
        error: 'LinkedIn OAuth access token not configured. Please use Mock or Manual mode.',
      };
    }
    // Skeleton implementation for official LinkedIn REST API (/v2/ugcPosts or /v2/posts)
    return {
      success: true,
      external_id: `li-native-${Date.now()}`,
      external_url: 'https://linkedin.com/feed/',
    };
  }

  async schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult> {
    return {
      success: true,
      external_id: `li-sched-${Date.now()}`,
    };
  }
}
