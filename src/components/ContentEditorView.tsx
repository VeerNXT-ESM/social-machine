'use client';

import React, { useState } from 'react';
import { ContentItem, Platform, PlatformPost } from '@/types';
import { PlatformPreviews } from './PlatformPreviews';
import { mockRepo } from '@/lib/mockStore';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Wand2,
  Eye,
  Edit3,
  Image as ImageIcon,
  Copy,
  Check,
  Scissors,
  Maximize2,
  Flame,
  ShieldCheck,
  Smile,
  ArrowRight,
  RotateCcw,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  SegmentedControl,
  Tabs,
  Textarea,
} from './ui';
import { statusText } from './ui/StatusLabel';

interface ContentEditorViewProps {
  item: ContentItem;
  onUpdateItem: (updated: ContentItem) => void;
  onOpenManualPublish: (post: PlatformPost) => void;
}

type RefineAction = 'shorten' | 'expand' | 'hook' | 'professional' | 'conversational' | 'cta' | 'regenerate';

const PLATFORM_META: Record<Platform, { name: string; Icon: React.ComponentType<{ className?: string }> }> = {
  linkedin: { name: 'LinkedIn', Icon: Linkedin },
  x: { name: 'X', Icon: Twitter },
  instagram: { name: 'Instagram', Icon: Instagram },
  facebook: { name: 'Facebook', Icon: Facebook },
};

const REFINEMENTS: { action: RefineAction; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { action: 'shorten', label: 'Shorten', Icon: Scissors },
  { action: 'expand', label: 'Expand', Icon: Maximize2 },
  { action: 'hook', label: 'Change hook', Icon: Flame },
  { action: 'professional', label: 'Professional', Icon: ShieldCheck },
  { action: 'conversational', label: 'Conversational', Icon: Smile },
  { action: 'cta', label: 'Improve CTA', Icon: ArrowRight },
  { action: 'regenerate', label: 'Regenerate', Icon: RotateCcw },
];

const defaultSlot = () => new Date(Date.now() + 86400000).toISOString().slice(0, 16);

export function ContentEditorView({ item, onUpdateItem, onOpenManualPublish }: ContentEditorViewProps) {
  const selectedPlatforms = item.selected_platforms || ['linkedin', 'x', 'instagram', 'facebook'];
  const [activePlatform, setActivePlatform] = useState<Platform>(selectedPlatforms[0] || 'linkedin');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [refining, setRefining] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(defaultSlot());
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentPost: PlatformPost | undefined = item.posts?.[activePlatform];
  const platformName = PLATFORM_META[activePlatform].name;

  const notify = (message: string) => {
    setErrorMessage(null);
    setActionMessage(message);
    setTimeout(() => setActionMessage(null), 3000);
  };
  const fail = (message: string) => {
    setActionMessage(null);
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const updatePostText = (text: string) => {
    if (!currentPost) return;
    const updatedPost = { ...currentPost, text, updated_at: new Date().toISOString() };
    const updatedPosts = { ...item.posts, [activePlatform]: updatedPost } as ContentItem['posts'];
    onUpdateItem(mockRepo.saveItem({ ...item, posts: updatedPosts }));
  };

  const handleApproveCurrent = () => {
    if (!currentPost) return;
    const updated = mockRepo.updatePostStatus(item.id, activePlatform, 'APPROVED');
    if (updated) onUpdateItem(updated);
  };

  const handleApproveAll = () => {
    let updatedItem = { ...item };
    selectedPlatforms.forEach((p) => {
      const res = mockRepo.updatePostStatus(item.id, p, 'APPROVED');
      if (res) updatedItem = res;
    });
    onUpdateItem(updatedItem);
    notify('All channel posts approved.');
  };

  const handleRefineAction = async (action: RefineAction) => {
    if (!currentPost) return;
    setRefining(true);

    try {
      const res = await fetch('/api/content/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: activePlatform,
          currentText: currentPost.text,
          action,
          sourceContent: item.source_content,
        }),
      });

      const data = await res.json();
      if (data.success && data.post?.text) {
        updatePostText(data.post.text);
        notify(`Applied "${action}" to the ${platformName} post.`);
      } else {
        fail(data.error || 'The refinement did not return any text.');
      }
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Refinement failed.');
    } finally {
      setRefining(false);
    }
  };

  /**
   * The API runs on the server and cannot read browser storage, so the post is
   * sent along with the request and the status is saved here afterwards.
   * The server only accepts approved posts, so the post is approved first.
   */
  const callPublishApi = async (action: 'publish_now' | 'schedule', scheduledAt?: string) => {
    if (!currentPost) return null;
    mockRepo.updatePostStatus(item.id, activePlatform, 'APPROVED');
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentItemId: item.id,
        platform: activePlatform,
        action,
        scheduledAt,
        mode: 'mock',
        post: { ...currentPost, status: 'APPROVED' },
      }),
    });
    return res.json();
  };

  const handlePublishNow = async () => {
    try {
      const data = await callPublishApi('publish_now');
      if (data?.success) {
        const updated = mockRepo.updatePostStatus(item.id, activePlatform, 'PUBLISHED');
        if (updated) onUpdateItem(updated);
        notify(`Published to ${platformName} (sandbox).`);
      } else {
        fail(`Publishing failed: ${data?.error ?? 'unknown error'}`);
      }
    } catch (err) {
      fail(`Publishing error: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  };

  const handleConfirmSchedule = async () => {
    setScheduleModalOpen(false);
    const iso = new Date(scheduledDate).toISOString();
    try {
      const data = await callPublishApi('schedule', iso);
      if (data?.success) {
        const updated = mockRepo.updatePostStatus(item.id, activePlatform, 'SCHEDULED', iso);
        if (updated) onUpdateItem(updated);
        notify(`Post scheduled for ${new Date(scheduledDate).toLocaleString()}.`);
      } else {
        fail(`Scheduling failed: ${data?.error ?? 'unknown error'}`);
      }
    } catch (err) {
      fail(`Scheduling error: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  };

  const handleCopyText = () => {
    if (!currentPost) return;
    navigator.clipboard.writeText(`${currentPost.text}\n\n${currentPost.cta}\n${currentPost.hashtags?.join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platformTabs = selectedPlatforms.map((p) => {
    const { name, Icon } = PLATFORM_META[p];
    return {
      id: p,
      icon: <Icon className="w-4 h-4" />,
      label: (
        <span className="flex items-center gap-2">
          {name}
          <span className="text-xs font-normal text-neutral-500">
            {statusText(item.posts?.[p]?.status || 'DRAFT')}
          </span>
        </span>
      ),
    };
  });

  const ActiveIcon = PLATFORM_META[activePlatform].Icon;

  return (
    <div className="space-y-4 pb-16">
      <Card className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
              {item.content_type}
            </span>
            {item.campaign_name && (
              <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
                Campaign: {item.campaign_name}
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 truncate">{item.title}</h1>
        </div>
        <Button variant="primary" onClick={handleApproveAll}>
          <CheckCircle2 className="w-4 h-4" /> Approve all channels
        </Button>
      </Card>

      {actionMessage && (
        <div className="p-3 bg-white border border-neutral-400 text-neutral-900 text-sm flex items-center gap-2" role="status">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader title="Core message" icon={<Sparkles className="w-4 h-4" />} />
          <CardBody className="space-y-2">
            <p className="text-sm font-medium text-neutral-900">{item.master_idea || item.title}</p>
            <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">{item.source_content}</p>
          </CardBody>
        </Card>

        {item.visual_direction && (
          <Card>
            <CardHeader title="Visual concept" icon={<ImageIcon className="w-4 h-4" />} />
            <CardBody className="space-y-2">
              <p className="text-sm text-neutral-800">{item.visual_direction.concept}</p>
              <div className="text-xs text-neutral-500 italic bg-neutral-50 p-2 border border-neutral-200">
                Prompt: {item.visual_direction.image_prompt}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-neutral-200">
        <Tabs options={platformTabs} value={activePlatform} onChange={setActivePlatform} className="border-b-0 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" />
        <SegmentedControl
          className="pb-2 shrink-0"
          options={[
            { id: 'editor', label: 'Editor', icon: <Edit3 className="w-3.5 h-3.5" /> },
            { id: 'preview', label: 'Preview', icon: <Eye className="w-3.5 h-3.5" /> },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {viewMode === 'preview' ? (
        <div className="py-6">
          {currentPost ? (
            <PlatformPreviews platform={activePlatform} post={currentPost} visualConcept={item.visual_direction} />
          ) : (
            <EmptyState title="No post content available" />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader
                title={`${platformName} post copy`}
                icon={<ActiveIcon className="w-4 h-4" />}
                actions={<span className="text-xs text-neutral-600">{currentPost?.text.length || 0} characters</span>}
              />
              <CardBody className="space-y-4">
                <Textarea
                  rows={10}
                  value={currentPost?.text || ''}
                  onChange={(e) => updatePostText(e.target.value)}
                  placeholder={`Write the ${platformName} post...`}
                  aria-label={`${platformName} post copy`}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-neutral-50 p-3 border border-neutral-200 space-y-1">
                    <div className="text-xs font-medium text-neutral-600">Hashtags</div>
                    <div className="text-sm text-neutral-800">
                      {currentPost?.hashtags?.join(' ') || '#VeerNXT #ExServiceMen'}
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-3 border border-neutral-200 space-y-1">
                    <div className="text-xs font-medium text-neutral-600">Call to action</div>
                    <div className="text-sm text-neutral-800">{currentPost?.cta || 'Visit https://veernxt.com'}</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="AI refinements"
                icon={<Wand2 className="w-4 h-4" />}
                description={`Applies to the ${platformName} post only.`}
                actions={refining && <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />}
              />
              <CardBody className="flex flex-wrap items-center gap-2">
                {REFINEMENTS.map(({ action, label, Icon }) => (
                  <Button key={action} size="sm" disabled={refining} onClick={() => handleRefineAction(action)}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </Button>
                ))}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Actions" />
            <CardBody className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between text-sm">
                <span className="text-neutral-600">Status</span>
                <span className="font-medium text-neutral-900">{statusText(currentPost?.status || 'REVIEW')}</span>
              </div>

              <div className="space-y-2">
                <Button variant="primary" block onClick={handleApproveCurrent}>
                  <CheckCircle2 className="w-4 h-4" /> Approve {platformName}
                </Button>
                <Button block disabled={currentPost?.status === 'PUBLISHED'} onClick={() => setScheduleModalOpen(true)}>
                  <Clock className="w-4 h-4" /> Schedule post
                </Button>
                <Button variant="primary" block disabled={currentPost?.status === 'PUBLISHED'} onClick={handlePublishNow}>
                  <Send className="w-4 h-4" /> Publish now (sandbox)
                </Button>
              </div>

              <div className="pt-3 border-t border-neutral-200 space-y-2">
                <Button block onClick={() => currentPost && onOpenManualPublish(currentPost)}>
                  <Copy className="w-4 h-4" /> Manual publishing
                </Button>
                <Button variant="ghost" block onClick={handleCopyText}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to clipboard' : 'Copy full text'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        icon={<Calendar className="w-5 h-5" />}
        title="Schedule post"
        subtitle={`Choose when the ${platformName} post goes out. Times are stored in UTC.`}
      >
        <Field label="Date and time">
          <Input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </Field>
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmSchedule} disabled={!scheduledDate}>
            Confirm schedule
          </Button>
        </div>
      </Modal>
    </div>
  );
}
