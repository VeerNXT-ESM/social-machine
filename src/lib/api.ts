import { Campaign, ContentItem, MediaItem, Platform, PostStatus } from '@/types';
import type { AnalyticsReport } from '@/types/analytics';
import type { LinkRow, LinkStatus, ScanSummary, SourceKind, SourceRow } from '@/types/sources';

/** Thin browser client for the app's own API routes. Every call throws an Error with a readable message. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response; handled below
  }
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(message || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface PostPatch {
  text?: string;
  status?: PostStatus;
  scheduled_at?: string | null;
}

/** 'mock' rehearses only; 'buffer' really publishes through Buffer. Follows the Sandbox / Live switch in the header. */
let publishMode: 'mock' | 'buffer' = 'mock';
export function setPublishMode(mode: 'mock' | 'buffer') {
  publishMode = mode;
}
export const isLiveMode = () => publishMode === 'buffer';

export const api = {
  async listItems(): Promise<ContentItem[]> {
    return (await request<{ items: ContentItem[] }>('/api/items')).items;
  },

  async getItem(id: string): Promise<ContentItem> {
    return (await request<{ item: ContentItem }>(`/api/items/${id}`)).item;
  },

  async listCampaigns(): Promise<Campaign[]> {
    return (await request<{ campaigns: Campaign[] }>('/api/campaigns')).campaigns;
  },

  async getAnalytics(): Promise<AnalyticsReport> {
    return request<AnalyticsReport>('/api/analytics');
  },

  async deleteItem(id: string): Promise<void> {
    await request(`/api/items/${id}`, { method: 'DELETE' });
  },

  async updatePost(id: string, platform: Platform, patch: PostPatch): Promise<ContentItem> {
    return (
      await request<{ item: ContentItem }>(`/api/items/${id}/posts/${platform}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    ).item;
  },

  /** Approve all posts of an item, or only the listed platforms. */
  async approve(id: string, platforms?: Platform[]): Promise<ContentItem> {
    return (
      await request<{ item: ContentItem }>(`/api/items/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(platforms ? { platforms } : {}),
      })
    ).item;
  },

  /** Publish one approved post through the mock provider. */
  async publish(id: string, platform: Platform): Promise<ContentItem> {
    const data = await request<{ item: ContentItem | null }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ contentItemId: id, platform, action: 'publish_now', mode: publishMode }),
    });
    if (!data.item) throw new Error('Published, but the updated post could not be loaded');
    return data.item;
  },

  /** Cancel a scheduled post (also removes it from Buffer). */
  async cancelSchedule(id: string, platform: Platform): Promise<ContentItem> {
    const data = await request<{ item: ContentItem | null }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ contentItemId: id, platform, action: 'cancel' }),
    });
    if (!data.item) throw new Error('Cancelled, but the updated post could not be loaded');
    return data.item;
  },

  /** Ask Buffer what happened to scheduled posts; returns how many changed. */
  async syncPublishing(): Promise<{ checked: number; changed: number }> {
    return request('/api/publish/sync', { method: 'POST' });
  },

  /** Schedule one approved post. */
  async schedule(id: string, platform: Platform, scheduledAtIso: string): Promise<ContentItem> {
    const data = await request<{ item: ContentItem | null }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ contentItemId: id, platform, action: 'schedule', scheduledAt: scheduledAtIso, mode: publishMode }),
    });
    if (!data.item) throw new Error('Scheduled, but the updated post could not be loaded');
    return data.item;
  },

  // ---------------------------------------------------------------- content sources and links

  async listSources(): Promise<SourceRow[]> {
    return (await request<{ sources: SourceRow[] }>('/api/sources')).sources;
  },

  async addSuggestedSources(): Promise<{ added: number; sources: SourceRow[] }> {
    return request('/api/sources/seed', { method: 'POST' });
  },

  /** Tests the address first; throws a readable error if it does not work. */
  async addSource(input: { name: string; url: string; kind: SourceKind; note?: string }) {
    return request<{ source: SourceRow; scan: ScanSummary }>('/api/sources', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async setSourceEnabled(id: string, enabled: boolean): Promise<void> {
    await request(`/api/sources/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
  },

  async deleteSource(id: string): Promise<void> {
    await request(`/api/sources/${id}`, { method: 'DELETE' });
  },

  /** Scan one source, or every enabled source when no id is given. */
  async scan(sourceId?: string): Promise<{ summaries: ScanSummary[]; added: number }> {
    return request('/api/sources/scan', { method: 'POST', body: JSON.stringify(sourceId ? { sourceId } : {}) });
  },

  async listLinks(filter: {
    status?: LinkStatus | 'all';
    source?: string;
    minRelevance?: number;
    q?: string;
  } = {}): Promise<LinkRow[]> {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.source) params.set('source', filter.source);
    if (filter.minRelevance) params.set('minRelevance', String(filter.minRelevance));
    if (filter.q) params.set('q', filter.q);
    return (await request<{ links: LinkRow[] }>(`/api/links?${params.toString()}`)).links;
  },

  async setLinkStatus(id: string, status: LinkStatus): Promise<void> {
    await request(`/api/links/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  // ---------------------------------------------------------------- images

  async listMedia(): Promise<MediaItem[]> {
    return (await request<{ media: MediaItem[] }>('/api/media')).media;
  },

  /** Save a picture from a web address (for example an article's own picture) as WebP in the library. */
  async importImage(url: string): Promise<MediaItem> {
    const res = await fetch('/api/media/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data: { media?: MediaItem; error?: string } = await res.json().catch(() => ({}));
    if (!res.ok || !data.media) throw new Error(data.error || 'The picture could not be saved.');
    return data.media;
  },

  /** Upload a picture chosen on this computer. Throws a readable error if it is not allowed. */
  async uploadImage(file: File): Promise<MediaItem> {
    const form = new FormData();
    form.append('file', file);
    // No JSON content type here: the browser sets the multipart boundary itself.
    const res = await fetch('/api/media', { method: 'POST', body: form });
    let data: { media?: MediaItem; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // non-JSON response
    }
    if (!res.ok || !data.media) throw new Error(data.error || `Upload failed (${res.status})`);
    return data.media;
  },

  async deleteMedia(id: string): Promise<void> {
    await request(`/api/media/${id}`, { method: 'DELETE' });
  },

  /** Set (or clear, with null) the image of one post, or of every channel of the item. */
  async setPostImage(id: string, platform: Platform, url: string | null, allChannels = false): Promise<ContentItem> {
    return (
      await request<{ item: ContentItem }>(`/api/items/${id}/posts/${platform}`, {
        method: 'PATCH',
        body: JSON.stringify({ media_urls: url ? [url] : [], all_channels: allChannels }),
      })
    ).item;
  },
};
