'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import type { MediaItem } from '@/types';
import { Button, Card, EmptyState, PageHeader } from './ui';
import { cn } from '@/lib/cn';

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

export function MediaLibraryView() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .listMedia()
      .then((m) => {
        if (!active) return;
        setMedia(m);
        setError(null);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Could not load the library.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [version]);

  const upload = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    const failures: string[] = [];
    let done = 0;
    let before = 0;
    let after = 0;
    for (const file of list) {
      try {
        const m = await api.uploadImage(file);
        done += 1;
        before += m.original_bytes ?? file.size;
        after += m.size_bytes;
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`);
      }
    }
    setUploading(false);
    if (done > 0) setNotice(`Uploaded ${done} image${done === 1 ? '' : 's'}, compressed from ${kb(before)} to ${kb(after)} as WebP.`);
    if (failures.length > 0) setError(failures.join(' '));
    setVersion((v) => v + 1);
  };

  const remove = async (id: string) => {
    setConfirmDelete(null);
    setError(null);
    try {
      await api.deleteMedia(id);
      setNotice('Image deleted.');
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the image.');
    }
  };

  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        title="Media library"
        description="Every image stored for your posts: pictures you upload and images the app created."
        actions={
          <label
            className={cn(
              'bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-3.5 py-2 text-sm inline-flex items-center gap-2 cursor-pointer transition-colors',
              uploading && 'opacity-60 pointer-events-none'
            )}
          >
            <Plus className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload images'}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        }
      />

      {notice && (
        <div className="p-3 bg-white border border-neutral-400 text-neutral-900 text-sm" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm" role="alert">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed p-6 text-center transition-colors',
          isDragging ? 'border-neutral-500 bg-neutral-100' : 'border-neutral-300 bg-white hover:border-neutral-400'
        )}
      >
        <UploadCloud className="w-7 h-7 text-neutral-600 mx-auto mb-1.5" />
        <p className="text-sm font-medium text-neutral-800">Drag and drop pictures here</p>
        <p className="text-xs text-neutral-600 mt-1">PNG, JPEG or WebP, up to 10 MB each. Saved as compressed WebP.</p>
      </div>

      {loading ? (
        <Card>
          <div className="p-10 text-center text-sm text-neutral-600">Loading...</div>
        </Card>
      ) : media.length === 0 ? (
        <Card>
          <EmptyState title="No images yet" description="Upload a picture above, or generate content to get AI images." />
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((m) => {
            const generated = m.storage_path.startsWith('generated/');
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumb_url ?? m.public_url} alt={m.filename} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="text-sm font-medium text-neutral-900 truncate" title={m.filename}>
                    {m.filename}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {generated ? 'Created by the app' : 'Uploaded'} - {kb(m.size_bytes)}
                    {m.width && m.height ? ` - ${m.width}x${m.height}` : ''}
                  </div>
                  <div className="text-xs text-neutral-500">{format(new Date(m.created_at), 'd MMM yyyy')}</div>
                  {confirmDelete === m.id ? (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="primary" onClick={() => remove(m.id)}>
                        Confirm delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="px-0" onClick={() => setConfirmDelete(m.id)} aria-label={`Delete ${m.filename}`}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
