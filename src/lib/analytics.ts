import 'server-only';
import { gql } from '@/lib/publishing/buffer';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Platform } from '@/types';

import type { AnalyticsReport, MetricType, PostFigures } from '@/types/analytics';

const SERVICE_TO_PLATFORM: Record<string, Platform> = { linkedin: 'linkedin', twitter: 'x', instagram: 'instagram', facebook: 'facebook' };
// Rates and averages cannot be added up; they are averaged instead.
const AVERAGED = new Set(['engagementRate', 'averageTimeWatched']);

interface RawPost {
  id: string;
  text: string | null;
  sentAt: string | null;
  channelService: string | null;
  externalLink: string | null;
  metrics: { type: string; value: number }[] | null;
  metricsUpdatedAt: string | null;
}

async function fetchSentPosts(): Promise<RawPost[]> {
  const orgs = await gql<{ account: { organizations: { id: string }[] } }>('query { account { organizations { id } } }');
  const out: RawPost[] = [];
  for (const org of orgs.account.organizations) {
    let after: string | null = null;
    for (let page = 0; page < 3; page++) {
      const data: { posts: { edges: { node: RawPost }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } = await gql(
        `query($org: OrganizationId!, $after: String) {
          posts(first: 100, after: $after, input: { organizationId: $org, filter: { status: [sent] } }) {
            edges { node { id text sentAt channelService externalLink metrics { type value } metricsUpdatedAt } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { org: org.id, after }
      );
      out.push(...data.posts.edges.map((e) => e.node));
      if (!data.posts.pageInfo.hasNextPage) break;
      after = data.posts.pageInfo.endCursor;
    }
  }
  return out;
}

function combine(list: Record<MetricType, number>[]): Record<MetricType, number> {
  const sums: Record<MetricType, { total: number; n: number }> = {};
  for (const m of list) {
    for (const [type, value] of Object.entries(m)) {
      const s = (sums[type] ??= { total: 0, n: 0 });
      s.total += value;
      s.n += 1;
    }
  }
  return Object.fromEntries(Object.entries(sums).map(([t, s]) => [t, AVERAGED.has(t) ? s.total / s.n : s.total]));
}

export async function buildAnalytics(): Promise<AnalyticsReport> {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase.from('platform_posts').select('status');
  if (error) throw new Error(error.message);
  const by_status: Record<string, number> = {};
  for (const r of rows ?? []) by_status[r.status] = (by_status[r.status] ?? 0) + 1;

  const report: AnalyticsReport = {
    buffer_ok: true,
    posts: [],
    totals: {},
    by_channel: {},
    app_counts: { total: rows?.length ?? 0, by_status },
    fetched_at: new Date().toISOString(),
  };

  try {
    const raw = await fetchSentPosts();
    report.posts = raw
      .map((p) => ({
        id: p.id,
        platform: SERVICE_TO_PLATFORM[p.channelService ?? ''] ?? null,
        text: (p.text ?? '').trim(),
        sentAt: p.sentAt,
        link: p.externalLink,
        metrics: Object.fromEntries((p.metrics ?? []).map((m) => [m.type, m.value])),
        metricsUpdatedAt: p.metricsUpdatedAt,
      }))
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));

    report.totals = combine(report.posts.map((p) => p.metrics));
    for (const platform of ['linkedin', 'x', 'instagram', 'facebook'] as Platform[]) {
      const mine = report.posts.filter((p) => p.platform === platform);
      if (mine.length) report.by_channel[platform] = { posts: mine.length, totals: combine(mine.map((p) => p.metrics)) };
    }
  } catch (err) {
    report.buffer_ok = false;
    report.buffer_error = err instanceof Error ? err.message : 'Buffer could not be reached.';
  }
  return report;
}
