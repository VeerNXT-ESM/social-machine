'use client';

import React from 'react';
import { ContentItem, Platform } from '@/types';
import { NavTab } from './Sidebar';
import { PlusCircle, Calendar, ArrowRight } from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import { Button, Card, EmptyState, PageHeader, StatCard, StatusLabel } from './ui';

interface DashboardViewProps {
  items: ContentItem[];
  setActiveTab: (tab: NavTab) => void;
  onSelectItem: (item: ContentItem) => void;
}

const PLATFORM_ICONS: Record<Platform, { name: string; Icon: React.ComponentType<{ className?: string }> }> = {
  linkedin: { name: 'LinkedIn', Icon: Linkedin },
  x: { name: 'X', Icon: Twitter },
  instagram: { name: 'Instagram', Icon: Instagram },
  facebook: { name: 'Facebook', Icon: Facebook },
};

export function DashboardView({ items, setActiveTab, onSelectItem }: DashboardViewProps) {
  const count = (status: string) => items.filter((i) => i.status === status).length;

  const renderPlatformIcons = (platforms: Platform[]) => (
    <div className="flex items-center gap-1.5">
      {platforms.map((p) => {
        const { name, Icon } = PLATFORM_ICONS[p];
        return (
          <span key={p} className="p-1 bg-neutral-100 text-neutral-700 border border-neutral-300" title={name}>
            <Icon className="w-3.5 h-3.5" />
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Overview"
        description="Content status across LinkedIn, X, Instagram and Facebook."
        actions={
          <>
            <Button onClick={() => setActiveTab('calendar')}>
              <Calendar className="w-4 h-4" />
              View calendar
            </Button>
            <Button variant="primary" onClick={() => setActiveTab('create')}>
              <PlusCircle className="w-4 h-4" />
              Create content
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Drafts" value={count('DRAFT')} note="In creation" />
        <StatCard label="In review" value={count('REVIEW')} note="Requires approval" />
        <StatCard label="Approved" value={count('APPROVED')} note="Ready to schedule" />
        <StatCard label="Scheduled" value={count('SCHEDULED')} note="Queued for posting" />
        <StatCard label="Published" value={count('PUBLISHED')} note="Live on channels" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Recent content</h2>
            <p className="text-xs text-neutral-600">Review, edit, and schedule multi-platform posts</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('content')}>
            View all ({items.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <Card>
            <EmptyState
              title="No content yet"
              description="Add an article or an idea to generate tailored posts for each channel."
              action={
                <Button variant="primary" onClick={() => setActiveTab('create')}>
                  Create first content
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-5 space-y-4 cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
                        {item.content_type || 'Announcement'}
                      </span>
                      {item.campaign_name && (
                        <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300 truncate">
                          {item.campaign_name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 text-base line-clamp-1">{item.title}</h3>
                  </div>
                  <StatusLabel status={item.status} />
                </div>

                <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">{item.source_content}</p>

                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <span>Channels</span>
                    {renderPlatformIcons(item.selected_platforms || ['linkedin', 'x', 'instagram', 'facebook'])}
                  </div>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
