'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Images, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ContentItem, MediaItem, Platform } from '@/types';
import { Button, Card, CardBody, CardHeader } from './ui';
import { MediaPicker } from './MediaPicker';

interface PostImageCardProps {
  itemId: string;
  platform: Platform;
  platformName: string;
  /** The post's current image, if any. */
  imageUrl?: string;
  /** How many channels the item has; the "all channels" option only makes sense for more than one. */
  channelCount: number;
  onUpdated: (item: ContentItem) => void;
}

/** Lets a person replace a post's picture with their own upload or an image from the library. */
export function PostImageCard({ itemId, platform, platformName, imageUrl, channelCount, onUpdated }: PostImageCardProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allChannels, setAllChannels] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const apply = async (url: string | null) => {
    setBusy(true);
    setError(null);
    try {
      onUpdated(await api.setPostImage(itemId, platform, url, allChannels && channelCount > 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the image.');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again later
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const media = await api.uploadImage(file);
      onUpdated(await api.setPostImage(itemId, platform, media.public_url, allChannels && channelCount > 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the image.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = (media: MediaItem) => {
    setPickerOpen(false);
    void apply(media.public_url);
  };

  return (
    <Card>
      <CardHeader title="Image" description={`Shown with the ${platformName} post. Use your own picture or keep the AI image.`} icon={<ImagePlus className="w-4 h-4" />} />
      <CardBody className="flex flex-col sm:flex-row gap-5">
        <div className="relative w-40 h-40 shrink-0 border border-neutral-300 bg-neutral-100 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`${platformName} post`} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-neutral-500 px-2 text-center">No image</span>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
              <ImagePlus className="w-3.5 h-3.5" /> {busy ? 'Working...' : 'Upload your own'}
            </Button>
            <Button size="sm" disabled={busy} onClick={() => setPickerOpen(true)}>
              <Images className="w-3.5 h-3.5" /> Choose from library
            </Button>
            {imageUrl && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => apply(null)}>
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </Button>
            )}
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} aria-label="Upload an image" />
          </div>

          {channelCount > 1 && (
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input type="checkbox" checked={allChannels} onChange={(e) => setAllChannels(e.target.checked)} className="w-4 h-4 accent-neutral-800" />
              Use this image on all channels
            </label>
          )}

          <p className="text-xs text-neutral-600">PNG, JPEG or WebP, up to 10 MB. Square or landscape pictures work best on every platform.</p>
          {error && (
            <p className="text-sm text-neutral-900 border border-neutral-800 p-2" role="alert">
              {error}
            </p>
          )}
        </div>
      </CardBody>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPick} />
    </Card>
  );
}
