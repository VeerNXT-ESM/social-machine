import { PlatformPost, PostStatus } from '@/types';

export interface PublishResult {
  success: boolean;
  external_id?: string;
  external_url?: string;
  error?: string;
}

export interface PublishingProvider {
  name: string;
  publishPost(post: PlatformPost): Promise<PublishResult>;
  schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult>;
  uploadMedia?(file: File | Blob): Promise<{ success: boolean; url?: string; error?: string }>;
  getPostStatus?(externalId: string): Promise<PostStatus>;
  deleteScheduledPost?(externalId: string): Promise<boolean>;
}
