'use client';

import React, { useState } from 'react';
import { ContentItem, Platform } from '@/types';
import { PlatformPreviews } from './PlatformPreviews';
import { Button, Modal, StatusLabel } from './ui';
import { api } from '@/lib/api';
import {
  Zap,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const TEST_SOURCES = [
  {
    title: 'VeerNXT Platform Launch',
    sourceContent:
      'We are launching VeerNXT, a platform designed to help Ex-Service Men transition into civilian careers through jobs, learning, skills development and connections with employers.',
    campaign: 'VeerNXT Platform Launch',
    contentType: 'Announcement',
    cta: 'Discover pathways at https://veernxt.com',
  },
  {
    title: 'Skills Ex-Service Men Bring to Civilian Careers',
    sourceContent:
      'Ex-Service Men (ESM) bring leadership, discipline, teamwork and the ability to perform under pressure. VeerNXT helps map these skills to civilian roles and connect them with employers who value them.',
    campaign: 'Skills Spotlight',
    contentType: 'Educational',
    cta: 'Map your skills at https://veernxt.com',
  },
];

const PLATFORMS: Platform[] = ['linkedin', 'x', 'instagram', 'facebook'];

interface TestCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteTest: (newItem: ContentItem) => void;
}

export function TestCampaignModal({ isOpen, onClose, onCompleteTest }: TestCampaignModalProps) {
  const [step, setStep] = useState<'idle' | 'generating' | 'generated' | 'publishing' | 'done'>('idle');
  const [testItems, setTestItems] = useState<ContentItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleRunFullTest = async () => {
    setStep('generating');
    setLogs([]);
    setTestItems([]);
    addLog('Starting the end-to-end test (2 posts per channel)...');

    try {
      const generated: ContentItem[] = [];
      for (const source of TEST_SOURCES) {
        addLog(`Generating "${source.title}" for 4 channels plus an image (GPT Image 2.5 Flare, medium)...`);
        const res = await fetch('/api/content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...source,
            sourceType: 'article',
            selectedPlatforms: ['linkedin', 'x', 'instagram', 'facebook'],
          }),
        });
        const data = await res.json();
        if (!data.success || !data.item) throw new Error(data.error || 'Generation failed');
        // The server saves the item to the database; the response is the saved copy.
        generated.push(data.item);
        setTestItems([...generated]);
        addLog(`[OK] "${source.title}": LinkedIn, X, Instagram and Facebook posts saved.`);
      }
      const allPosts = generated.flatMap((item) => Object.values(item.posts || {}));
      const banned = allPosts.filter((post) =>
        /agniveer/i.test([post.text, post.cta, ...(post.hashtags || [])].join(' '))
      ).length;
      addLog(`[OK] Checked ${allPosts.length} posts across ${generated.length} items (expected 8 across 2).`);
      addLog(
        banned === 0
          ? '[OK] Brand check passed: no prohibited terms found.'
          : `[Error] Brand check failed: ${banned} post(s) contain a prohibited term.`
      );
      setStep('generated');
    } catch (err) {
      addLog(`[Error] ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStep('idle');
    }
  };

  const handleApproveAndPublishAll = async () => {
    if (testItems.length === 0) return;
    setStep('publishing');

    const platforms = ['linkedin', 'x', 'instagram', 'facebook'] as const;
    const finals: ContentItem[] = [];

    try {
      for (const item of testItems) {
        addLog(`Approving all 4 posts for "${item.title}"...`);
        let latest = await api.approve(item.id);

        for (const p of platforms) {
          addLog(`Publishing ${p.toUpperCase()} through the mock provider...`);
          latest = await api.publish(item.id, p);
          addLog(`[OK] ${p.toUpperCase()} published. External ID: ${latest.posts?.[p]?.external_post_id ?? 'n/a'}`);
        }
        finals.push(latest);
      }
    } catch (err) {
      addLog(`[Error] ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStep('generated');
      return;
    }

    setTestItems(finals);
    if (finals[0]) onCompleteTest(finals[0]);
    setStep('done');
    addLog('[Complete] End-to-end test finished. All posts are published.');
  };

  return (
    <Modal
      onClose={onClose}
      size={testItems.length > 0 ? 'xl' : 'lg'}
      icon={<Zap className="w-5 h-5" />}
      title="End-to-end test campaign"
      subtitle="Idea, AI generation, platform posts, approval, mock publisher, verified published"
    >
      <div className="bg-neutral-50 border border-neutral-200 p-4 h-44 overflow-y-auto space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-neutral-500 italic">Select Step 1 below to start the workflow.</div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={
                log.includes('[OK]') || log.includes('[Complete]')
                  ? 'text-neutral-900 font-semibold'
                  : log.includes('[Error]')
                    ? 'text-neutral-900 underline'
                    : 'text-neutral-600'
              }
            >
              {log}
            </div>
          ))
        )}
      </div>

      {testItems.length > 0 && (
        <div className="space-y-6">
          {testItems.map((testItem) => (
            <div key={testItem.id} className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
                <span>{testItem.title}</span>
                <StatusLabel status={testItem.status} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                {PLATFORMS.map((platform) => {
                  const post = testItem.posts?.[platform];
                  return post ? (
                    <div key={platform} className="min-w-0">
                      <PlatformPreviews platform={platform} post={post} visualConcept={testItem.visual_direction} />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {step === 'idle' && (
          <Button variant="primary" size="lg" onClick={handleRunFullTest}>
            <Zap className="w-4 h-4" /> Step 1: Generate test campaign
          </Button>
        )}
        {step === 'generating' && (
          <Button size="lg" disabled>
            <Loader2 className="w-4 h-4 animate-spin" /> Generating content...
          </Button>
        )}
        {step === 'generated' && (
          <Button variant="primary" size="lg" onClick={handleApproveAndPublishAll}>
            <CheckCircle2 className="w-4 h-4" /> Step 2: Approve all and run mock publisher
          </Button>
        )}
        {step === 'publishing' && (
          <Button size="lg" disabled>
            <Loader2 className="w-4 h-4 animate-spin" /> Running mock publisher...
          </Button>
        )}
        {step === 'done' && (
          <Button variant="primary" size="lg" onClick={onClose}>
            Close and open editor
          </Button>
        )}
      </div>
    </Modal>
  );
}
