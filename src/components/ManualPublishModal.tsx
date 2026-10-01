'use client';

import React, { useState } from 'react';
import { PlatformPost } from '@/types';
import { mockRepo } from '@/lib/mockStore';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import { Button, Modal } from './ui';

interface ManualPublishModalProps {
  post: PlatformPost | null;
  onClose: () => void;
  onMarkPublished: () => void;
}

export function ManualPublishModal({ post, onClose, onMarkPublished }: ManualPublishModalProps) {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${post.text}\n\n${post.cta}\n${post.hashtags?.join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlatformUrl = () => {
    switch (post.platform) {
      case 'linkedin':
        return 'https://linkedin.com/feed';
      case 'x':
        return 'https://x.com/compose/post';
      case 'instagram':
        return 'https://instagram.com';
      case 'facebook':
        return 'https://facebook.com';
    }
  };

  const PlatformIcon = { linkedin: Linkedin, x: Twitter, instagram: Instagram, facebook: Facebook }[post.platform];
  const platformName = post.platform === 'x' ? 'X' : post.platform.charAt(0).toUpperCase() + post.platform.slice(1);
  const actionTile =
    'p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-xs font-medium text-neutral-800 flex flex-col items-center justify-center gap-1.5 transition-colors';

  return (
    <Modal
      onClose={onClose}
      icon={<PlatformIcon className="w-5 h-5" />}
      title={`Manual publishing (${platformName})`}
      subtitle="Copy the post text and media to publish manually on the platform"
    >
      <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-2 max-h-48 overflow-y-auto">
        <div className="text-xs text-neutral-800 whitespace-pre-wrap">{post.text}</div>
        <div className="text-xs text-neutral-700 font-medium">{post.hashtags?.join(' ')}</div>
        <div className="text-xs text-neutral-700 font-medium">{post.cta}</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={handleCopy} className={actionTile}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy post'}</span>
        </button>

        <a href={post.media_urls?.[0] || '/logo.png'} download target="_blank" rel="noreferrer" className={actionTile}>
          <Download className="w-4 h-4" />
          <span>Download image</span>
        </a>

        <a href={getPlatformUrl()} target="_blank" rel="noreferrer" className={actionTile}>
          <ExternalLink className="w-4 h-4" />
          <span>Open platform</span>
        </a>
      </div>

      <Button
        variant="primary"
        size="lg"
        block
        onClick={() => {
          mockRepo.updatePostStatus(post.content_item_id, post.platform, 'PUBLISHED');
          onMarkPublished();
          onClose();
        }}
      >
        <CheckCircle2 className="w-4 h-4" /> Mark as published
      </Button>
    </Modal>
  );
}
