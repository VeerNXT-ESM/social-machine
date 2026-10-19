'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import type { Campaign } from '@/types';
import { Card, EmptyState, PageHeader } from './ui';

interface CampaignsViewProps {
  onGenerateCampaign?: (prompt: string) => void;
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Active', PLANNED: 'Planned', COMPLETED: 'Completed' };

/** The campaigns that exist in the database. A campaign is created by naming it when creating content. */
export function CampaignsView({}: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listCampaigns()
      .then((c) => active && setCampaigns(c))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Could not load campaigns.'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Campaigns"
        description="Content grouped under a campaign name. Name a campaign when you create content and it appears here."
      />

      {error && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm" role="alert">
          {error}
        </div>
      )}
      {!error && campaigns === null && <div className="text-sm text-neutral-600">Loading...</div>}

      {campaigns !== null && campaigns.length === 0 && (
        <Card>
          <EmptyState title="No campaigns yet" description="Type a campaign name in the Details box when you create content, and it is listed here." />
        </Card>
      )}

      {campaigns !== null && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.map((camp) => (
            <Card key={camp.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
                  {STATUS_LABEL[camp.status] ?? camp.status}
                </span>
                <span className="text-xs text-neutral-600">
                  {camp.post_count ?? 0} content item{camp.post_count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-neutral-900 text-base">{camp.title}</h3>
                {camp.description && <p className="text-sm text-neutral-600 line-clamp-2">{camp.description}</p>}
              </div>
              <div className="pt-3 border-t border-neutral-200 text-xs text-neutral-500">Created {format(new Date(camp.created_at), 'd MMM yyyy')}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
