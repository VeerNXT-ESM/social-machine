'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Eye, ThumbsUp, MessageSquare, Share2, MousePointer, Bookmark, RefreshCw, ExternalLink } from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import { api } from '@/lib/api';
import type { Platform } from '@/types';
import type { AnalyticsReport } from '@/types/analytics';
import { Button, Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard } from './ui';

const CHANNELS: { id: Platform; name: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'linkedin', name: 'LinkedIn', Icon: Linkedin },
  { id: 'x', name: 'X', Icon: Twitter },
  { id: 'instagram', name: 'Instagram', Icon: Instagram },
  { id: 'facebook', name: 'Facebook', Icon: Facebook },
];

/** The figures shown as tiles. A tile appears only when a platform has actually reported that figure. */
const TILES: { keys: string[]; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { keys: ['impressions', 'views'], label: 'Impressions', Icon: Eye },
  { keys: ['likes', 'reactions'], label: 'Likes', Icon: ThumbsUp },
  { keys: ['comments'], label: 'Comments', Icon: MessageSquare },
  { keys: ['shares', 'reposts', 'quotes'], label: 'Shares', Icon: Share2 },
  { keys: ['clicks'], label: 'Clicks', Icon: MousePointer },
  { keys: ['saves'], label: 'Saves', Icon: Bookmark },
];

const n = (v: number) => Math.round(v).toLocaleString();

/** Add up the figures present for a tile, or null when none was reported. */
function pick(totals: Record<string, number>, keys: string[]): number | null {
  const found = keys.filter((k) => totals[k] !== undefined);
  return found.length ? found.reduce((sum, k) => sum + totals[k], 0) : null;
}

export function AnalyticsView() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await api.getAnalytics());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the figures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // First load. (Refresh uses load(); this version never updates state before the response arrives.)
    let active = true;
    api
      .getAnalytics()
      .then((r) => active && setReport(r))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Could not load the figures.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const tiles = report ? TILES.map((t) => ({ ...t, value: pick(report.totals, t.keys) })).filter((t) => t.value !== null) : [];
  const status = report?.app_counts.by_status ?? {};

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Analytics"
        description="Real figures from Buffer for the posts that have been published."
        actions={
          <Button onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> {loading ? 'Loading...' : 'Refresh'}
          </Button>
        }
      />

      {error && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm" role="alert">
          {error}
        </div>
      )}
      {report && !report.buffer_ok && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm" role="alert">
          Buffer could not be asked for figures: {report.buffer_error}
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Published" value={n(report.posts.length)} />
            <StatCard label="Scheduled" value={n(status.SCHEDULED ?? 0)} />
            <StatCard label="Approved, waiting" value={n(status.APPROVED ?? 0)} />
            <StatCard label="In review" value={n(status.REVIEW ?? 0)} />
          </div>

          {tiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {tiles.map(({ label, Icon, value }) => (
                <StatCard key={label} label={label} icon={<Icon className="w-3.5 h-3.5" />} value={n(value as number)} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                title={report.posts.length ? 'No figures reported yet' : 'No published posts yet'}
                description={
                  report.posts.length
                    ? 'Platforms usually report impressions and engagement some hours after a post goes out. Press Refresh later.'
                    : 'Once a post has been published through Buffer, its figures appear here.'
                }
              />
            </Card>
          )}

          {report.posts.length > 0 && (
            <>
              <Card>
                <CardHeader title="By channel" />
                <CardBody className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {CHANNELS.map(({ id, name, Icon }) => {
                    const c = report.by_channel[id];
                    const impressions = c ? pick(c.totals, ['impressions', 'views']) : null;
                    const rate = c?.totals.engagementRate;
                    return (
                      <div key={id} className="bg-neutral-50 border border-neutral-200 p-4 space-y-2">
                        <span className="font-medium text-sm text-neutral-800 flex items-center gap-1.5">
                          <Icon className="w-4 h-4" /> {name}
                        </span>
                        {c ? (
                          <>
                            <div className="text-xl font-semibold text-neutral-900">{impressions === null ? '-' : n(impressions)}</div>
                            <div className="text-xs text-neutral-600">
                              {impressions === null ? 'No impressions reported yet' : 'impressions'}
                              {' - '}
                              {c.posts} post{c.posts === 1 ? '' : 's'}
                              {rate !== undefined ? ` - ${rate.toFixed(1)}% engagement` : ''}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-neutral-500">No published posts</div>
                        )}
                      </div>
                    );
                  })}
                </CardBody>
              </Card>

              <Card className="overflow-x-auto">
                <CardHeader title="Published posts" />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-left text-xs text-neutral-600 border-y border-neutral-200">
                      <th className="px-4 py-2 font-medium">Post</th>
                      <th className="px-4 py-2 font-medium">Channel</th>
                      <th className="px-4 py-2 font-medium">Published</th>
                      {TILES.map((t) => (
                        <th key={t.label} className="px-3 py-2 font-medium text-right">
                          {t.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.posts.map((p) => {
                      const ch = CHANNELS.find((c) => c.id === p.platform);
                      return (
                        <tr key={p.id} className="border-b border-neutral-200 align-top">
                          <td className="px-4 py-3 max-w-md">
                            <div className="line-clamp-2 text-neutral-900">{p.text || '(no text)'}</div>
                            {p.link && (
                              <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-neutral-700 underline inline-flex items-center gap-1 mt-1">
                                View post <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-neutral-700">{ch?.name ?? 'Other'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{p.sentAt ? format(new Date(p.sentAt), 'd MMM yyyy, h:mm a') : '-'}</td>
                          {TILES.map((t) => {
                            const v = pick(p.metrics, t.keys);
                            return (
                              <td key={t.label} className="px-3 py-3 text-right text-neutral-900 tabular-nums">
                                {v === null ? '-' : n(v)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          <p className="text-xs text-neutral-500">
            Updated {format(new Date(report.fetched_at), 'd MMM yyyy, h:mm a')}. A dash means the platform has not reported that figure.
          </p>
        </>
      )}

      {!report && loading && (
        <Card>
          <div className="p-10 text-center text-sm text-neutral-600">Loading...</div>
        </Card>
      )}
    </div>
  );
}
