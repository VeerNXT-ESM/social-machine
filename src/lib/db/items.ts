import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceUserId } from './workspace';
import { ContentItem, Platform, PlatformPost, PostStatus } from '@/types';
import { withSourceLink } from '@/lib/sourceLink';

const ITEM_SELECT = '*, campaigns(title), platform_posts(*)';

type DbPost = Omit<PlatformPost, 'hashtags' | 'media_urls'> & {
  hashtags: string[] | null;
  media_urls: string[] | null;
  cta: string | null;
};

type DbItem = Omit<ContentItem, 'posts' | 'campaign_name'> & {
  campaigns: { title: string } | null;
  platform_posts: DbPost[] | null;
};

function toPost(r: DbPost): PlatformPost {
  return {
    ...r,
    hashtags: r.hashtags ?? [],
    media_urls: r.media_urls ?? [],
    cta: r.cta ?? '',
  } as PlatformPost;
}

function toItem(r: DbItem): ContentItem {
  const posts: Partial<Record<Platform, PlatformPost>> = {};
  (r.platform_posts ?? []).forEach((p) => {
    posts[p.platform] = toPost(p);
  });
  const { campaigns, platform_posts, ...rest } = r;
  void platform_posts;
  return {
    ...rest,
    campaign_name: campaigns?.title ?? undefined,
    posts: posts as ContentItem['posts'],
  } as ContentItem;
}

/** Overall item status derived from its platform posts. */
function rollupStatus(statuses: PostStatus[], current: PostStatus): PostStatus {
  if (statuses.length === 0) return current;
  if (statuses.every((s) => s === 'PUBLISHED')) return 'PUBLISHED';
  if (statuses.some((s) => s === 'SCHEDULED' || s === 'PUBLISHED')) return 'SCHEDULED';
  if (statuses.every((s) => s === 'APPROVED')) return 'APPROVED';
  if (statuses.some((s) => s === 'REVIEW')) return 'REVIEW';
  return current;
}

export async function listItems(): Promise<ContentItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('content_items')
    .select(ITEM_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as DbItem[]).map(toItem);
}

export async function getItem(id: string): Promise<ContentItem | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('content_items').select(ITEM_SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toItem(data as unknown as DbItem) : null;
}

export type NewPost = Pick<PlatformPost, 'platform' | 'text' | 'hashtags' | 'cta' | 'status'> &
  Partial<Pick<PlatformPost, 'provider' | 'media_urls'>>;

export interface NewItem {
  title: string;
  source_type: ContentItem['source_type'];
  source_content: string;
  source_url?: string;
  master_idea?: string;
  content_type: ContentItem['content_type'];
  campaign_name?: string;
  status: PostStatus;
  selected_platforms: Platform[];
  visual_direction?: ContentItem['visual_direction'];
  posts: NewPost[];
}

async function campaignIdFor(userId: string, name?: string): Promise<string | null> {
  if (!name?.trim()) return null;
  const supabase = createAdminClient();
  const title = name.trim();
  const { data: found } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .eq('title', title)
    .limit(1)
    .maybeSingle();
  if (found) return found.id;
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ user_id: userId, title, status: 'ACTIVE', start_date: new Date().toISOString() })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

/** Create a content item and its platform posts. Cleans up the item if the posts cannot be saved. */
export async function createItem(input: NewItem): Promise<ContentItem> {
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();
  const campaign_id = await campaignIdFor(userId, input.campaign_name);

  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      user_id: userId,
      campaign_id,
      title: input.title,
      source_type: input.source_type,
      source_content: input.source_content,
      source_url: input.source_url ?? null,
      master_idea: input.master_idea ?? null,
      content_type: input.content_type,
      status: input.status,
      selected_platforms: input.selected_platforms,
      visual_direction: input.visual_direction ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  if (input.posts.length > 0) {
    const { error: postsError } = await supabase.from('platform_posts').insert(
      input.posts.map((p) => ({
        content_item_id: item.id,
        platform: p.platform,
        provider: p.provider ?? 'mock',
        text: p.text,
        hashtags: p.hashtags ?? [],
        cta: p.cta,
        media_urls: p.media_urls ?? [],
        status: p.status,
      }))
    );
    if (postsError) {
      await supabase.from('content_items').delete().eq('id', item.id);
      throw new Error(postsError.message);
    }
  }

  const saved = await getItem(item.id);
  if (!saved) throw new Error('Item was created but could not be read back');
  return saved;
}

export type PostPatch = Partial<
  Pick<PlatformPost, 'text' | 'status' | 'scheduled_at' | 'published_at' | 'external_post_id' | 'external_url' | 'error_message' | 'hashtags' | 'cta' | 'media_urls'>
>;

/** Update one platform post, then refresh the overall item status. Returns the updated item. */
export async function updatePost(itemId: string, platform: Platform, patch: PostPatch): Promise<ContentItem | null> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const update: Record<string, unknown> = { ...patch, updated_at: now };
  if (patch.status === 'PUBLISHED' && !patch.published_at) update.published_at = now;

  const { data, error } = await supabase
    .from('platform_posts')
    .update(update)
    .eq('content_item_id', itemId)
    .eq('platform', platform)
    .select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const item = await getItem(itemId);
  if (!item) return null;

  const status = rollupStatus(
    Object.values(item.posts ?? {}).map((p) => p.status),
    item.status
  );
  if (status !== item.status) {
    await supabase.from('content_items').update({ status, updated_at: now }).eq('id', itemId);
    item.status = status;
  } else {
    await supabase.from('content_items').update({ updated_at: now }).eq('id', itemId);
  }
  return item;
}

/** Set the same image on every post of an item with a single update. */
export async function setItemMedia(itemId: string, urls: string[]): Promise<ContentItem | null> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('platform_posts').update({ media_urls: urls, updated_at: now }).eq('content_item_id', itemId);
  if (error) throw new Error(error.message);
  await supabase.from('content_items').update({ updated_at: now }).eq('id', itemId);
  return getItem(itemId);
}

/** Approve every post of an item that is not already scheduled or published. */
export async function approveItem(itemId: string, platforms?: Platform[]): Promise<ContentItem | null> {
  const item = await getItem(itemId);
  if (!item) return null;
  let latest: ContentItem | null = item;
  for (const [platform, post] of Object.entries(item.posts ?? {}) as [Platform, PlatformPost][]) {
    if (platforms && !platforms.includes(platform)) continue;
    if (post.status === 'PUBLISHED' || post.status === 'SCHEDULED') continue;
    latest = await updatePost(itemId, platform, { status: 'APPROVED' });
  }
  return latest;
}

export async function getPost(itemId: string, platform: Platform): Promise<PlatformPost | null> {
  const item = await getItem(itemId);
  return item?.posts?.[platform] ?? null;
}

export async function deleteItem(itemId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('content_items').delete().eq('id', itemId);
  if (error) throw new Error(error.message);
}

/** Make sure every post of an item ends with the article's address. Returns the updated item. */
export async function addSourceLink(itemId: string, url: string): Promise<ContentItem | null> {
  const item = await getItem(itemId);
  if (!item) return null;
  const supabase = createAdminClient();
  for (const [platform, post] of Object.entries(item.posts ?? {}) as [Platform, PlatformPost][]) {
    const text = withSourceLink(platform, post.text ?? '', url);
    if (text === post.text) continue;
    const { error } = await supabase
      .from('platform_posts')
      .update({ text, updated_at: new Date().toISOString() })
      .eq('content_item_id', itemId)
      .eq('platform', platform);
    if (error) throw new Error(error.message);
  }
  return getItem(itemId);
}
