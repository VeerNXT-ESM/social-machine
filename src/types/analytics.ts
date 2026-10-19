import type { Platform } from '@/types';

export type MetricType = string;

export interface PostFigures {
  id: string;
  platform: Platform | null;
  text: string;
  sentAt: string | null;
  link: string | null;
  metrics: Record<MetricType, number>;
  metricsUpdatedAt: string | null;
}

export interface AnalyticsReport {
  /** True when figures came from Buffer; false when Buffer could not be asked (see `buffer_error`). */
  buffer_ok: boolean;
  buffer_error?: string;
  /** Posts Buffer has published, newest first, with the figures each platform has reported. */
  posts: PostFigures[];
  /** Sum of each figure over those posts. A figure is absent when no post has reported it. */
  totals: Record<MetricType, number>;
  by_channel: Partial<Record<Platform, { posts: number; totals: Record<MetricType, number> }>>;
  /** Counts from this app's own records. */
  app_counts: { total: number; by_status: Record<string, number> };
  fetched_at: string;
}
