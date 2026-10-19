'use client';

import React from 'react';
import Image from 'next/image';
import { PlatformPost, Platform } from '@/types';
import {
  ThumbsUp,
  Lightbulb,
  MessageSquare,
  Share2,
  Send,
  Heart,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';

interface PlatformPreviewsProps {
  platform: Platform;
  post: PlatformPost;
  visualConcept?: unknown;
}

export function PlatformPreviews({ platform, post, visualConcept }: PlatformPreviewsProps) {
  const mediaUrl = post.media_urls?.[0] || '/logo.png';

  if (platform === 'linkedin') {
    return (
      <div className="bg-white border border-neutral-300 p-4 md:p-6 space-y-4 max-w-lg mx-auto shadow-md text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-50 border border-neutral-300 p-1 shrink-0 flex items-center justify-center">
              <Image src="/logo.png" alt="VeerNXT" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1 font-bold text-sm text-neutral-900">
                VeerNXT <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 fill-neutral-700" />
              </div>
              <div className="text-[11px] text-neutral-600">Ex-Service Men Career Transition Platform</div>
              <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                Just now • <Globe className="w-2.5 h-2.5 inline" />
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-neutral-600" />
        </div>

        {/* Text Body */}
        <div className="text-xs md:text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
          {post.text}
          {post.hashtags?.length > 0 && (
            <div className="mt-2 text-neutral-700 font-medium">
              {post.hashtags.join(' ')}
            </div>
          )}
        </div>

        {/* Media / Image Attachment */}
        <div className="relative overflow-hidden border border-neutral-200 bg-neutral-50 aspect-video flex items-center justify-center">
          <img
            src={mediaUrl}
            alt="VeerNXT Media Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-neutral-900/60 text-[10px] text-neutral-700">
            veernxt.in
          </div>
        </div>

        {/* Engagement Counter */}
        <div className="flex items-center justify-between text-[11px] text-neutral-600 border-b border-neutral-200 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 bg-neutral-800 text-white flex items-center justify-center text-[8px]"><ThumbsUp className="w-2.5 h-2.5" /></span>
            <span className="w-4 h-4 bg-neutral-800 text-white flex items-center justify-center text-[8px]"><Lightbulb className="w-2.5 h-2.5" /></span>
            <span>VeerNXT & 48 others</span>
          </div>
          <div>12 comments • 6 reposts</div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-1 text-xs text-neutral-600 font-semibold pt-1">
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
            <ThumbsUp className="w-4 h-4" /> Like
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
            <MessageSquare className="w-4 h-4" /> Comment
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
            <Repeat2 className="w-4 h-4" /> Repost
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    );
  }

  if (platform === 'x') {
    return (
      <div className="bg-white border border-neutral-200 p-4 md:p-6 space-y-4 max-w-lg mx-auto shadow-md text-neutral-900 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-50 border border-neutral-200 p-1 shrink-0 flex items-center justify-center">
              <Image src="/logo.png" alt="VeerNXT" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1 font-bold text-sm text-neutral-900">
                VeerNXT <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 fill-neutral-700" />
              </div>
              <div className="text-xs text-neutral-500">@VeerNXT</div>
            </div>
          </div>
          <Twitter className="w-4 h-4 text-neutral-500" />
        </div>

        {/* Text */}
        <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
          {post.text}
          {post.hashtags?.length > 0 && (
            <div className="mt-2 text-neutral-700 font-normal">
              {post.hashtags.join(' ')}
            </div>
          )}
        </div>

        {/* Image preview */}
        <div className="relative overflow-hidden border border-neutral-200 bg-neutral-50 aspect-video">
          <img src={mediaUrl} alt="VeerNXT" className="w-full h-full object-cover" />
        </div>

        {/* Timestamp */}
        <div className="text-xs text-neutral-500 border-b border-neutral-200 pb-3">
          10:30 AM • Sep 29, 2026 • <span className="font-semibold text-neutral-700">1.4K Views</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-neutral-500 text-xs px-2">
          <button className="flex items-center gap-1.5 hover:text-neutral-900"><MessageSquare className="w-4 h-4" /> 14</button>
          <button className="flex items-center gap-1.5 hover:text-neutral-900"><Repeat2 className="w-4 h-4" /> 28</button>
          <button className="flex items-center gap-1.5 hover:text-neutral-900"><Heart className="w-4 h-4" /> 142</button>
          <button className="flex items-center gap-1.5 hover:text-neutral-900"><Bookmark className="w-4 h-4" /></button>
          <button className="flex items-center gap-1.5 hover:text-neutral-900"><Share2 className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  if (platform === 'instagram') {
    return (
      <div className="bg-white border border-neutral-200 p-4 space-y-3 max-w-sm mx-auto shadow-md text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 p-0.5 bg-neutral-800 hover:bg-neutral-700   ">
              <div className="w-full h-full bg-neutral-50 p-0.5 flex items-center justify-center">
                <Image src="/logo.png" alt="VeerNXT" width={24} height={24} className="object-contain" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xs text-neutral-900 block">veernxt_official</span>
              <span className="text-[10px] text-neutral-600">Original Audio</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-neutral-600" />
        </div>

        {/* Square Media */}
        <div className="relative aspect-square overflow-hidden bg-neutral-200 border border-neutral-200">
          <img src={mediaUrl} alt="Instagram Visual" className="w-full h-full object-cover" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-neutral-800 pt-1">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-neutral-700 fill-neutral-700" />
            <MessageSquare className="w-5 h-5" />
            <Send className="w-5 h-5" />
          </div>
          <Bookmark className="w-5 h-5" />
        </div>

        {/* Caption */}
        <div className="text-xs space-y-1">
          <div className="font-bold text-neutral-800">284 likes</div>
          <div className="leading-relaxed">
            <span className="font-bold text-neutral-900 mr-1.5">veernxt_official</span>
            <span className="text-neutral-700">{post.text}</span>
          </div>
          {post.hashtags?.length > 0 && (
            <div className="text-neutral-700 text-[11px]">{post.hashtags.join(' ')}</div>
          )}
          <div className="text-[10px] text-neutral-500 uppercase">2 hours ago</div>
        </div>
      </div>
    );
  }

  // Facebook
  return (
    <div className="bg-white border border-neutral-300 p-4 md:p-6 space-y-4 max-w-lg mx-auto shadow-md text-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-50 border border-neutral-300 p-1 shrink-0 flex items-center justify-center">
            <Image src="/logo.png" alt="VeerNXT" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <div className="font-bold text-sm text-neutral-900">VeerNXT</div>
            <div className="text-[11px] text-neutral-600 flex items-center gap-1">
              Just now • <Globe className="w-3 h-3 inline text-neutral-600" />
            </div>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-neutral-600" />
      </div>

      {/* Post Text */}
      <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
        {post.text}
        {post.hashtags?.length > 0 && (
          <div className="mt-2 text-neutral-700 font-medium">
            {post.hashtags.join(' ')}
          </div>
        )}
      </div>

      {/* Media Image */}
      <div className="relative overflow-hidden border border-neutral-200 bg-neutral-50 aspect-video">
        <img src={mediaUrl} alt="VeerNXT Facebook" className="w-full h-full object-cover" />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-neutral-600 border-b border-neutral-300 pb-2">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 bg-neutral-800 text-white flex items-center justify-center text-[9px]"><ThumbsUp className="w-2.5 h-2.5" /></span>
          <span className="w-4 h-4 bg-neutral-800 text-white flex items-center justify-center text-[9px]"><Heart className="w-2.5 h-2.5" /></span>
          <span>89</span>
        </div>
        <div>18 Comments • 9 Shares</div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-1 text-xs text-neutral-700 font-semibold pt-1">
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
          <ThumbsUp className="w-4 h-4" /> Like
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
          <MessageSquare className="w-4 h-4" /> Comment
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-neutral-100 ">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  );
}
