import 'server-only';
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceUserId } from './workspace';
import { DEFAULT_SOURCES } from '@/lib/scraper/defaults';
import { scanSource } from '@/lib/scraper/scan';
import type { LinkRow, LinkStatus, ScanSummary, SourceKind, SourceRow } from '@/types/sources';

export type { LinkStatus, SourceRow, LinkRow, ScanSummary } from '@/types/sources';

const hashUrl = (url: string) => createHash('sha256').update(url).digest('hex');

// ------------------------------------------------------------------ sources

export async function listSources(): Promise<SourceRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('content_sources').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  const { data: fresh, error: countError } = await supabase.from('source_links').select('source_id').eq('status', 'new');
  if (countError) throw new Error(countError.message);
  const counts = new Map<string, number>();
  (fresh ?? []).forEach((r) => counts.set(r.source_id, (counts.get(r.source_id) ?? 0) + 1));

  return (data as SourceRow[]).map((s) => ({ ...s, new_count: counts.get(s.id) ?? 0 }));
}

export interface NewSource {
  name: string;
  siteUrl: string;
  feedUrl?: string | null;
  kind: SourceKind;
  note?: string | null;
}

export async function addSource(input: NewSource): Promise<SourceRow> {
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();
  const { data, error } = await supabase
    .from('content_sources')
    .insert({
      user_id: userId,
      name: input.name,
      site_url: input.siteUrl,
      feed_url: input.feedUrl ?? null,
      kind: input.kind,
      note: input.note ?? null,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('That source has already been added.');
    throw new Error(error.message);
  }
  return data as SourceRow;
}

/** Add the suggested starting sources that are not already present. Returns how many were added. */
export async function addSuggestedSources(): Promise<number> {
  const existing = await listSources();
  const have = new Set(existing.map((s) => `${s.site_url}|${s.feed_url ?? ''}`));
  let added = 0;
  for (const d of DEFAULT_SOURCES) {
    if (have.has(`${d.siteUrl}|${d.feedUrl ?? ''}`)) continue;
    await addSource({ name: d.name, siteUrl: d.siteUrl, feedUrl: d.feedUrl, kind: d.kind, note: d.note });
    added += 1;
  }
  return added;
}

export async function updateSource(id: string, patch: { enabled?: boolean; name?: string }): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('content_sources').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSource(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('content_sources').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------ scanning

/** Read one source, store links that are not already known, and record the outcome on the source. */
export async function scanAndSave(source: SourceRow): Promise<ScanSummary> {
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();

  const result = await scanSource({
    name: source.name,
    siteUrl: source.site_url,
    feedUrl: source.feed_url,
    kind: source.kind,
  });

  let added = 0;
  let error = result.error ?? null;

  if (!error && result.links.length > 0) {
    const rows = result.links.map((l) => ({ link: l, hash: hashUrl(l.url) }));
    const { data: known, error: readError } = await supabase
      .from('source_links')
      .select('id, url_hash, relevance, matched_keywords, mentions_restricted_term')
      .eq('user_id', userId)
      .in('url_hash', rows.map((r) => r.hash));
    if (readError) {
      error = readError.message;
    } else {
      const have = new Map((known ?? []).map((k) => [k.url_hash as string, k]));

      // Links we already have: refresh their score if the scoring rules have changed since.
      for (const { link, hash } of rows) {
        const existing = have.get(hash);
        if (!existing) continue;
        const changed =
          existing.relevance !== link.relevance ||
          existing.mentions_restricted_term !== link.mentionsRestrictedTerm ||
          JSON.stringify(existing.matched_keywords ?? []) !== JSON.stringify(link.matchedKeywords);
        if (changed) {
          await supabase
            .from('source_links')
            .update({
              relevance: link.relevance,
              matched_keywords: link.matchedKeywords,
              mentions_restricted_term: link.mentionsRestrictedTerm,
            })
            .eq('id', existing.id);
        }
      }

      const fresh = rows.filter((r) => !have.has(r.hash));
      if (fresh.length > 0) {
        const { error: insertError } = await supabase.from('source_links').insert(
          fresh.map(({ link, hash }) => ({
            user_id: userId,
            source_id: source.id,
            url: link.url,
            url_hash: hash,
            title: link.title,
            summary: link.summary || null,
            author: link.author ?? null,
            published_at: link.publishedAt ?? null,
            image_url: link.imageUrl ?? null,
            relevance: link.relevance,
            matched_keywords: link.matchedKeywords,
            mentions_restricted_term: link.mentionsRestrictedTerm,
          }))
        );
        if (insertError) error = insertError.message;
        else added = fresh.length;
      }
    }
  }

  await supabase
    .from('content_sources')
    .update({
      last_checked_at: new Date().toISOString(),
      last_status: error ? 'error' : 'ok',
      last_error: error,
      last_found: result.links.length,
      last_new: added,
    })
    .eq('id', source.id);

  return { sourceId: source.id, name: source.name, found: result.links.length, added, error, skipped: result.skipped ?? null };
}

/** Scan one source, or every enabled source one after another (each site is also rate limited). */
export async function scanSources(sourceId?: string): Promise<ScanSummary[]> {
  const all = await listSources();
  const targets = sourceId ? all.filter((s) => s.id === sourceId) : all.filter((s) => s.enabled);
  const summaries: ScanSummary[] = [];
  for (const source of targets) summaries.push(await scanAndSave(source));
  return summaries;
}

// ------------------------------------------------------------------ links

export interface LinkFilter {
  status?: LinkStatus | 'all';
  sourceId?: string;
  minRelevance?: number;
  q?: string;
  limit?: number;
}

export async function listLinks(filter: LinkFilter = {}): Promise<LinkRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('source_links')
    .select('*, content_sources(name)')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('discovered_at', { ascending: false })
    .limit(Math.min(filter.limit ?? 200, 500));

  if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status);
  if (filter.sourceId) query = query.eq('source_id', filter.sourceId);
  if (filter.minRelevance && filter.minRelevance > 0) query = query.gte('relevance', filter.minRelevance);
  if (filter.q?.trim()) {
    // strip characters that have meaning in the filter syntax before using the text in a search
    const term = filter.q.trim().replace(/[%,()*]/g, ' ');
    query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  type Joined = Omit<LinkRow, 'source_name'> & { content_sources: { name: string } | null };
  return (data as unknown as Joined[]).map(({ content_sources, ...rest }) => ({
    ...rest,
    source_name: content_sources?.name ?? 'Unknown source',
  }));
}

export async function updateLink(id: string, patch: { status?: LinkStatus; content_item_id?: string | null }): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('source_links').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Name of the source an item was made from (via the link it was created from), if any. */
export async function getSourceNameForItem(itemId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('source_links')
    .select('content_sources(name)')
    .eq('content_item_id', itemId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const joined = data as unknown as { content_sources: { name: string } | null } | null;
  return joined?.content_sources?.name ?? null;
}

/** When content made from an article is deleted, put the article back in the "new" list. */
export async function releaseLinksForItem(itemId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('source_links').update({ status: 'new', content_item_id: null }).eq('content_item_id', itemId);
  if (error) throw new Error(error.message);
}
