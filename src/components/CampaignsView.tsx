'use client';

import React, { useState } from 'react';
import { Campaign } from '@/types';
import { INITIAL_CAMPAIGNS } from '@/lib/mockStore';
import { Wand2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, PageHeader, Textarea } from './ui';

interface CampaignsViewProps {
  onGenerateCampaign: (prompt: string) => void;
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Active', PLANNED: 'Planned', COMPLETED: 'Completed' };

export function CampaignsView({}: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [showGenerator, setShowGenerator] = useState(false);
  const [articleText, setArticleText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  const handleCreate2WeekCampaign = () => {
    if (!articleText.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const newCamp: Campaign = {
        id: `camp-${Date.now()}`,
        title: '2-Week Transition Awareness Series',
        description: 'Multi-post campaign exploring Ex-Service Men skills, corporate integration, and VeerNXT programs.',
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        post_count: 5,
        created_at: new Date().toISOString(),
      };

      setCampaigns([newCamp, ...campaigns]);
      setIsGenerating(false);
      setShowGenerator(false);
      setArticleText('');
      setCreatedMessage('Campaign created. Five sequential posts were added to the review queue.');

      setTimeout(() => setCreatedMessage(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Campaigns"
        description="Group multi-post content series around strategic VeerNXT themes."
        actions={
          <Button variant="primary" onClick={() => setShowGenerator(!showGenerator)}>
            <Wand2 className="w-4 h-4" /> Turn an article into a 2-week campaign
          </Button>
        }
      />

      {createdMessage && (
        <div className="p-3 bg-white border border-neutral-400 text-neutral-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {createdMessage}
        </div>
      )}

      {showGenerator && (
        <Card>
          <CardHeader
            title="Turn an article into a 2-week campaign"
            description="Paste source material. A 5-part sequence is created: introduce the issue, why it matters, insight, VeerNXT solution, call to action."
          />
          <CardBody className="space-y-4">
            <Textarea
              rows={4}
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste article or announcement text..."
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowGenerator(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleCreate2WeekCampaign}
                disabled={isGenerating || !articleText.trim()}
              >
                {isGenerating ? 'Generating posts...' : 'Generate campaign'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaigns.map((camp) => (
          <Card key={camp.id} className="p-5 space-y-4 hover:border-neutral-400 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
                {STATUS_LABEL[camp.status] ?? camp.status}
              </span>
              <span className="text-xs text-neutral-600">{camp.post_count || 4} posts</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-neutral-900 text-base">{camp.title}</h3>
              <p className="text-sm text-neutral-600 line-clamp-2">{camp.description}</p>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span>Created {new Date(camp.created_at).toLocaleDateString()}</span>
              <span className="text-neutral-800 font-medium flex items-center gap-1 cursor-pointer hover:underline">
                View series <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
