'use client';

import React from 'react';
import { MOCK_ANALYTICS } from '@/lib/mockStore';
import { Eye, ThumbsUp, MessageSquare, Share2, MousePointer, Bookmark, Info } from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from './ui';

const CHANNELS = [
  { id: 'linkedin', name: 'LinkedIn', Icon: Linkedin },
  { id: 'x', name: 'X', Icon: Twitter },
  { id: 'instagram', name: 'Instagram', Icon: Instagram },
  { id: 'facebook', name: 'Facebook', Icon: Facebook },
] as const;

export function AnalyticsView() {
  const data = MOCK_ANALYTICS;
  const n = (v: number) => v.toLocaleString();
  const icon = (I: React.ComponentType<{ className?: string }>) => <I className="w-3.5 h-3.5" />;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Analytics"
        description="Aggregated engagement across channels."
        actions={
          <span className="px-3 py-1.5 bg-neutral-50 border border-neutral-300 text-xs font-medium text-neutral-700 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Sample data. Live metrics need platform API access.
          </span>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Impressions" icon={icon(Eye)} value={n(data.total_impressions)} />
        <StatCard label="Likes" icon={icon(ThumbsUp)} value={n(data.total_likes)} />
        <StatCard label="Comments" icon={icon(MessageSquare)} value={n(data.total_comments)} />
        <StatCard label="Shares" icon={icon(Share2)} value={n(data.total_shares)} />
        <StatCard label="Clicks" icon={icon(MousePointer)} value={n(data.total_clicks)} />
        <StatCard label="Saves" icon={icon(Bookmark)} value={n(data.total_saves)} />
      </div>

      <Card>
        <CardHeader title="Performance by channel" />
        <CardBody className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {CHANNELS.map(({ id, name, Icon }) => {
            const d = data.by_platform[id];
            return (
              <div key={id} className="bg-neutral-50 border border-neutral-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-neutral-800 flex items-center gap-1.5">
                    <Icon className="w-4 h-4" /> {name}
                  </span>
                  <span className="text-xs text-neutral-600">{d.engagement}% engagement</span>
                </div>
                <div className="text-xl font-semibold text-neutral-900">{n(d.impressions)}</div>
                <div className="text-xs text-neutral-500">{d.posts_count} posts published</div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
