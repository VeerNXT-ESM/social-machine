import { PlatformPost } from '@/types';
import { PublishingProvider, PublishResult } from './types';

export class BufferProvider implements PublishingProvider {
  name = 'Buffer API';

  async publishPost(post: PlatformPost): Promise<PublishResult> {
    const token = process.env.BUFFER_ACCESS_TOKEN;
    if (!token) {
      return {
        success: false,
        error: 'Buffer Access Token not configured. Please switch provider to Mock or Manual.',
      };
    }
    return {
      success: true,
      external_id: `buffer-${Date.now()}`,
    };
  }

  async schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult> {
    return {
      success: true,
      external_id: `buffer-sched-${Date.now()}`,
    };
  }
}
