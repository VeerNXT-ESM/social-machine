'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Platform, ContentType, SourceType, ContentItem } from '@/types';
import type { ContentPrefill } from '@/types/sources';
import { insightInstructions } from '@/lib/insightRules';
import { api } from '@/lib/api';
import {
  FileText,
  Link as LinkIcon,
  StickyNote,
  Lightbulb,
  Globe,
  AlertCircle,
  Loader2,
  Wand2,
  Zap,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Tabs, Textarea } from './ui';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';

interface CreateContentViewProps {
  onGenerated: (newItem: ContentItem) => void;
  /** Set when content is started from a link found on the Sources screen. */
  prefill?: ContentPrefill | null;
}

/** Read a web page through the server; returns its title and main text. */
async function readPage(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch('/api/content/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "We couldn't read this page. Paste the article text instead.");
  return { title: data.title ?? '', text: data.extractedText ?? '' };
}

export function CreateContentView({ onGenerated, prefill }: CreateContentViewProps) {
  const [sourceType, setSourceType] = useState<SourceType>(prefill ? 'link' : 'article');
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [sourceContent, setSourceContent] = useState(prefill?.summary ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(prefill?.url ?? '');
  const [campaign, setCampaign] = useState(prefill ? 'Industry insights' : '');
  const [contentType, setContentType] = useState<ContentType>(prefill ? 'Thought Leadership' : 'Announcement');
  const [cta, setCta] = useState('Discover career transition pathways at https://veernxt.in');
  const [additionalInstructions, setAdditionalInstructions] = useState(
    prefill ? insightInstructions(prefill.sourceName) : ''
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    'linkedin',
    'x',
    'instagram',
    'facebook',
  ]);

  const [loading, setLoading] = useState(false);
  // Optional picture supplied by the person; when set, no AI image is created
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [imageThumb, setImageThumb] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // The picture the article itself uses, offered after the page is read
  const [articleImage, setArticleImage] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [scrapingUrl, setScrapingUrl] = useState(Boolean(prefill));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Content type options list
  const contentTypeOptions: ContentType[] = [
    'Announcement',
    'Educational',
    'Thought Leadership',
    'Product',
    'Employer',
    'Jobs',
    'Career Advice',
    'Community',
    'Evergreen',
    'Other',
  ];

  // Started from a discovered link: read the article text once so the draft is based on the real article.
  useEffect(() => {
    if (!prefill) return;
    let active = true;
    readPage(prefill.url)
      .then(({ text }) => {
        if (active && text) setSourceContent(text);
      })
      .catch((err) => {
        if (active) setErrorMsg(err instanceof Error ? err.message : "We couldn't read this page. Paste the article text instead.");
      })
      .finally(() => {
        if (active) setScrapingUrl(false);
      });
    return () => {
      active = false;
    };
  }, [prefill]);

  // URL Scrape Handler
  const handleExtractUrl = async () => {
    if (!websiteUrl) return;
    setScrapingUrl(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/content/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "We couldn't read this page. Paste the article text instead.");
      } else {
        if (data.title && !title) setTitle(data.title);
        setArticleImage(typeof data.imageUrl === 'string' ? data.imageUrl : null);
        if (data.extractedText) {
          setSourceContent(data.extractedText);
          setErrorMsg(null);
        }
      }
    } catch {
      setErrorMsg("We couldn't read this page. Paste the article text instead.");
    } finally {
      setScrapingUrl(false);
    }
  };

  const useArticleImage = async () => {
    if (!articleImage) return;
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const media = await api.importImage(articleImage);
      setImageUrl(media.public_url);
      setImageName(media.filename);
      setImageThumb(media.thumb_url ?? media.public_url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not use the article picture.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const media = await api.uploadImage(file);
      setImageUrl(media.public_url);
      setImageName(media.filename);
      setImageThumb(media.thumb_url ?? media.public_url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not upload the image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Platform checkbox toggle
  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) return; // keep at least 1
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceContent.trim() && !title.trim()) {
      setErrorMsg('Please enter either a title or source content/notes.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'VeerNXT Idea',
          sourceContent: sourceContent || title,
          sourceType,
          sourceUrl: websiteUrl,
          contentType,
          campaign,
          cta,
          selectedPlatforms,
          additionalInstructions,
          sourceLinkId: prefill?.linkId,
          imageUrl: imageUrl ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate posts');
      }

      onGenerated(data.item);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Content generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sourceTabs: { id: SourceType; label: string; icon: React.ReactNode }[] = [
    { id: 'article', label: 'Article', icon: <FileText className="w-4 h-4" /> },
    { id: 'link', label: 'Link / URL', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote className="w-4 h-4" /> },
    { id: 'idea', label: 'Idea', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  const channelOptions: { id: Platform; label: string; icon: React.ReactNode }[] = [
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" /> },
    { id: 'x', label: 'X', icon: <Twitter className="w-4 h-4" /> },
    { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
    { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        title="New content"
        description="Add source material, choose channels, and generate a draft for each."
      />

      {errorMsg && (
        <div className="p-3 bg-white border border-neutral-400 text-neutral-900 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start"
      >
        <Card>
          <Tabs options={sourceTabs} value={sourceType} onChange={setSourceType} />

          <CardBody className="space-y-4">
            <Field label="Title">
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Launching VeerNXT"
              />
            </Field>

            {(sourceType === 'link' || sourceType === 'article') && (
              <Field label="Website URL (optional)">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <Input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://veernxt.in/news/career-launch"
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleExtractUrl} disabled={scrapingUrl || !websiteUrl} className="shrink-0">
                    {scrapingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch page'}
                  </Button>
                </div>
              </Field>
            )}

            <Field label="Source material" hint={`${sourceContent.length} characters`}>
              <Textarea
                rows={14}
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                placeholder="Paste article text, a press release, notes or key points here."
              />
            </Field>
          </CardBody>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-20">
          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-4">
              <Field label="Campaign">
                <Input
                  type="text"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g. VeerNXT Launch"
                />
              </Field>
              <Field label="Content type">
                <Select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)}>
                  {contentTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Call to action">
                <Input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g. Visit https://veernxt.in to learn more."
                />
              </Field>
              <Field label="Additional instructions (optional)">
                <Textarea
                  rows={3}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Emphasize leadership skills for corporate IT roles"
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Channels" />
            <ul className="divide-y divide-neutral-200">
              {channelOptions.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-neutral-50">
                    <span className="flex items-center gap-2.5 text-sm text-neutral-900">
                      {c.icon} {c.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(c.id)}
                      onChange={() => togglePlatform(c.id)}
                      className="w-4 h-4 accent-neutral-800"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Image (optional)" />
            <CardBody className="space-y-3">
              {imageUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageThumb ?? imageUrl} alt="Your uploaded image" className="w-16 h-16 object-cover border border-neutral-300" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-neutral-900 truncate">{imageName}</div>
                    <button type="button" onClick={() => setImageUrl(null)} className="text-xs text-neutral-700 underline inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => imageInput.current?.click()} disabled={uploadingImage} block>
                  <ImagePlus className="w-4 h-4" /> {uploadingImage ? 'Uploading...' : 'Upload your own image'}
                </Button>
              )}
              {!imageUrl && articleImage && (
                <div className="border border-neutral-300 p-3 flex gap-3 items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={articleImage} alt="Picture from the article" className="w-20 h-20 object-cover border border-neutral-300 bg-neutral-100 shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm text-neutral-900">This article has its own picture.</p>
                    <Button size="sm" onClick={useArticleImage} disabled={uploadingImage}>
                      <ImagePlus className="w-3.5 h-3.5" /> {uploadingImage ? 'Saving...' : 'Use the article picture'}
                    </Button>
                    <p className="text-xs text-neutral-600">News photos are usually copyrighted. Use it only if you have the right to, or credit the source in your post.</p>
                  </div>
                </div>
              )}
              <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageFile} aria-label="Upload an image" />
              <p className="text-xs text-neutral-600">
                {imageUrl
                  ? 'Your image will be used on every channel. No AI image is created.'
                  : 'Leave this empty and the app creates an AI image for you. PNG, JPEG or WebP, up to 10 MB.'}
              </p>
            </CardBody>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            disabled={loading || selectedPlatforms.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating posts...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>
                  Generate for {selectedPlatforms.length} channel{selectedPlatforms.length === 1 ? '' : 's'}
                </span>
              </>
            )}
          </Button>
        </aside>
      </form>
    </div>
  );
}
