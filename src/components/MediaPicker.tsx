'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { MediaItem } from '@/types';
import { EmptyState, Modal } from './ui';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (media: MediaItem) => void;
}

/** A grid of stored images to choose from. */
export function MediaPicker({ open, onClose, onPick }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    api
      .listMedia()
      .then((m) => {
        if (!active) return;
        setMedia(m.filter((x) => x.type === 'image'));
        setError(null);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Could not load the library.'));
    return () => {
      active = false;
    };
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<ImageIcon className="w-5 h-5" />}
      title="Choose an image"
      subtitle="Pictures you have uploaded, and images the app created earlier."
    >
      {error && (
        <p className="text-sm text-neutral-900 border border-neutral-800 p-2" role="alert">
          {error}
        </p>
      )}
      {!error && media === null && <p className="text-sm text-neutral-600 py-8 text-center">Loading...</p>}
      {media !== null && media.length === 0 && (
        <EmptyState title="No images yet" description="Upload a picture first, and it will appear here for reuse." />
      )}
      {media !== null && media.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto">
          {media.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onPick(m)}
                className="w-full text-left border border-neutral-300 hover:border-neutral-800 focus:border-neutral-800 bg-white"
              >
                <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumb_url ?? m.public_url} alt={m.filename} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="px-2 py-1.5 text-xs text-neutral-700 truncate">{m.filename}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
