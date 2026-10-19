import 'server-only';
import { PlatformPost, Platform } from '@/types';
import { PublishingProvider, PublishResult } from './types';
import { makePublishJpeg } from '@/lib/db/media';
import { xLength } from '@/lib/xText';

const ENDPOINT = 'https://api.buffer.com';

/** Buffer service name for each of our channels. Facebook and Instagram are not connected yet. */
const SERVICE: Partial<Record<Platform, string>> = { linkedin: 'linkedin', x: 'twitter' };

const X_LIMIT = 280;

interface BufferChannel {
  id: string;
  name: string;
  service: string;
  isDisconnected: boolean;
  isLocked: boolean;
}

class BufferError extends Error {}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const key = process.env.BUFFER_API_KEY;
  if (!key) throw new BufferError('The Buffer API key is not set. Add BUFFER_API_KEY to the server settings.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 429) {
    const wait = res.headers.get('Retry-After');
    throw new BufferError(`Buffer is limiting requests. Please try again${wait ? ` in ${wait} seconds` : ' shortly'}.`);
  }
  if (res.status === 401 || res.status === 403) throw new BufferError('Buffer did not accept the API key. Check BUFFER_API_KEY.');
  const json = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string }[] } | null;
  if (!json) throw new BufferError(`Buffer returned an unexpected response (${res.status}).`);
  if (json.errors?.length) throw new BufferError(`Buffer: ${json.errors[0].message}`);
  return json.data as T;
}

let cached: { at: number; channels: BufferChannel[] } | null = null;

/** The channels connected in Buffer (cached for a minute so a burst of posts makes one lookup). */
async function getChannels(): Promise<BufferChannel[]> {
  if (cached && Date.now() - cached.at < 60_000) return cached.channels;
  const orgs = await gql<{ account: { organizations: { id: string }[] } }>('query { account { organizations { id } } }');
  const channels: BufferChannel[] = [];
  for (const org of orgs.account.organizations) {
    const data = await gql<{ channels: BufferChannel[] }>(
      'query($org: OrganizationId!) { channels(input: { organizationId: $org }) { id name service isDisconnected isLocked } }',
      { org: org.id }
    );
    channels.push(...data.channels);
  }
  cached = { at: Date.now(), channels };
  return channels;
}

/** The text exactly as the editor's copy button composes it: post, call to action, then hashtags. */
export function composePostText(post: PlatformPost): string {
  return [post.text?.trim(), post.cta?.trim(), post.hashtags?.length ? post.hashtags.join(' ') : '']
    .filter(Boolean)
    .join('\n\n');
}

const CREATE_POST = `
mutation($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id status dueAt externalLink } }
    ... on MutationError { message }
  }
}`;

type CreateResult = {
  createPost: { post?: { id: string; status: string; dueAt?: string; externalLink?: string }; message?: string };
};

/** Buffer post ids are 24 hex characters; sandbox ids start with "mock-". */
export const isBufferId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{24}$/.test(id);

export interface BufferPostState {
  /** What Buffer says now. "gone" means the post no longer exists in Buffer (deleted there). */
  state: 'scheduled' | 'sending' | 'published' | 'failed' | 'gone';
  externalUrl?: string;
  sentAt?: string;
  error?: string;
}

/** Ask Buffer what happened to a post we sent. */
export async function getBufferPostState(id: string): Promise<BufferPostState> {
  try {
    const data = await gql<{ post: { status: string; sentAt?: string; externalLink?: string; error?: { message?: string } | null } }>(
      'query($id: PostId!) { post(input: { id: $id }) { status sentAt externalLink error { message } } }',
      { id }
    );
    const p = data.post;
    if (p.status === 'sent') return { state: 'published', externalUrl: p.externalLink || undefined, sentAt: p.sentAt };
    if (p.status === 'error') return { state: 'failed', error: p.error?.message || 'Buffer could not publish this post.' };
    if (p.status === 'sending') return { state: 'sending' };
    if (p.status === 'scheduled') return { state: 'scheduled' };
    return { state: 'gone' }; // draft or needs approval: no longer a scheduled post
  } catch (err) {
    if (err instanceof BufferError && /not found/i.test(err.message)) return { state: 'gone' };
    throw err;
  }
}

/** Remove a scheduled post from Buffer. A post already removed counts as success. */
export async function deleteBufferPost(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await gql<{ deletePost: { message?: string } | null }>(
      'mutation($id: PostId!) { deletePost(input: { id: $id }) { ... on VoidMutationError { message } } }',
      { id }
    );
    const msg = data.deletePost?.message;
    if (msg && !/not found/i.test(msg)) return { ok: false, error: `Buffer would not cancel the post: ${msg}` };
    return { ok: true };
  } catch (err) {
    if (err instanceof BufferError && /not found/i.test(err.message)) return { ok: true };
    return { ok: false, error: err instanceof BufferError ? err.message : 'Could not reach Buffer. Please try again.' };
  }
}

export class BufferProvider implements PublishingProvider {
  name = 'Buffer API';

  private async send(post: PlatformPost, when: string | null): Promise<PublishResult> {
    try {
      const service = SERVICE[post.platform];
      if (!service) return { success: false, error: `${post.platform} is not connected to Buffer yet. Only LinkedIn and X are live.` };

      const text = composePostText(post);
      if (!text) return { success: false, error: 'The post has no text.' };
      if (post.platform === 'x' && xLength(text) > X_LIMIT) {
        return { success: false, error: `This post is ${xLength(text)} characters; X allows ${X_LIMIT}. Shorten it first.` };
      }

      const channel = (await getChannels()).find((c) => c.service === service && !c.isDisconnected && !c.isLocked);
      if (!channel) return { success: false, error: `No connected ${post.platform === 'x' ? 'X' : 'LinkedIn'} channel was found in Buffer.` };

      const input: Record<string, unknown> = {
        channelId: channel.id,
        text,
        schedulingType: 'automatic',
        mode: when ? 'customScheduled' : 'shareNow',
        needsApproval: false,
        source: 'veernxt-social',
        assets: [],
      };
      if (when) input.dueAt = new Date(when).toISOString();

      // Pictures are sent as JPEG: the most widely accepted format across LinkedIn and X.
      const imageUrl = post.media_urls?.[0];
      if (imageUrl) {
        try {
          input.assets = [{ image: { url: await makePublishJpeg(imageUrl) } }];
        } catch (err) {
          console.error('Preparing the post image failed:', err);
          return { success: false, error: 'The post picture could not be prepared for publishing. Try removing it or choosing another picture.' };
        }
      }

      const data = await gql<CreateResult>(CREATE_POST, { input });
      const result = data.createPost;
      if (!result?.post) return { success: false, error: `Buffer refused the post: ${result?.message ?? 'unknown reason'}` };
      return { success: true, external_id: result.post.id, external_url: result.post.externalLink || undefined };
    } catch (err) {
      console.error('Buffer publish failed:', err);
      return { success: false, error: err instanceof BufferError ? err.message : 'Something went wrong while sending the post to Buffer. Check the server log for details.' };
    }
  }

  publishPost(post: PlatformPost): Promise<PublishResult> {
    return this.send(post, null);
  }

  schedulePost(post: PlatformPost, scheduledAt: string): Promise<PublishResult> {
    return this.send(post, scheduledAt);
  }
}
