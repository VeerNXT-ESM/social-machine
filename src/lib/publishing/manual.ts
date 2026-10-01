import { PlatformPost, PostStatus } from '@/types';
import { PublishingProvider, PublishResult } from './types';

export class ManualPublishingProvider implements PublishingProvider {
  name = 'Manual Publishing';

  async publishPost(post: PlatformPost): Promise<PublishResult> {
    return {
      success: true,
      external_id: `manual-${Date.now()}`,
    };
  }

  async schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult> {
    return {
      success: true,
      external_id: `manual-sched-${Date.now()}`,
    };
  }

  async deleteScheduledPost(externalId: string): Promise<boolean> {
    return true;
  }
}
