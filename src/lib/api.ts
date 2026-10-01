import { ContentItem, Platform, PostStatus } from '@/types';

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

export const api = {
  async listItems(): Promise<ContentItem[]> {
    return (await request<{ items: ContentItem[] }>('/api/items')).items;
  },

  async getItem(id: string): Promise<ContentItem> {
    return (await request<{ item: ContentItem }>(`/api/items/${id}`)).item;
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
      body: JSON.stringify({ contentItemId: id, platform, action: 'publish_now', mode: 'mock' }),
    });
    if (!data.item) throw new Error('Published, but the updated post could not be loaded');
    return data.item;
  },

  /** Schedule one approved post. */
  async schedule(id: string, platform: Platform, scheduledAtIso: string): Promise<ContentItem> {
    const data = await request<{ item: ContentItem | null }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ contentItemId: id, platform, action: 'schedule', scheduledAt: scheduledAtIso, mode: 'mock' }),
    });
    if (!data.item) throw new Error('Scheduled, but the updated post could not be loaded');
    return data.item;
  },
};
