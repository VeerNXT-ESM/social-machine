'use client';

import React, { useState } from 'react';
import { MediaItem } from '@/types';
import { INITIAL_MEDIA } from '@/lib/mockStore';
import { UploadCloud, Film, Trash2, Plus } from 'lucide-react';
import { Card, PageHeader } from './ui';
import { cn } from '@/lib/cn';

export function MediaLibraryView() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const url = URL.createObjectURL(file);
      const newMedia: MediaItem = {
        id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: isVideo ? 'video' : 'image',
        mime_type: file.type || (isVideo ? 'video/mp4' : 'image/png'),
        size_bytes: file.size,
        width: 1200,
        height: 630,
        storage_path: url,
        public_url: url,
        created_at: new Date().toISOString(),
      };
      setMediaList((prev) => [newMedia, ...prev]);
    });
  };

  const handleDelete = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Media library"
        description="Images and videos for campaigns. Files stay in this browser session until storage is connected."
        actions={
          <label className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-3.5 py-2 text-sm inline-flex items-center gap-2 cursor-pointer transition-colors">
            <Plus className="w-4 h-4" /> Upload media
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        }
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-neutral-500 bg-neutral-100' : 'border-neutral-300 bg-white hover:border-neutral-400'
        )}
      >
        <UploadCloud className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-neutral-800">Drag and drop images or videos here</p>
        <p className="text-xs text-neutral-600 mt-1">PNG, JPG or MP4</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mediaList.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden">
            <div className="aspect-video relative bg-neutral-100 overflow-hidden flex items-center justify-center">
              {item.type === 'video' ? (
                <div className="text-center p-4">
                  <Film className="w-8 h-8 text-neutral-500 mx-auto mb-1" />
                  <span className="text-xs text-neutral-600 font-medium">Video file</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.public_url} alt={item.filename} className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => handleDelete(item.id)}
                aria-label={`Delete ${item.filename}`}
                className="absolute top-2 right-2 p-1.5 bg-neutral-900/70 hover:bg-neutral-900 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 space-y-1">
              <div className="text-sm font-medium text-neutral-900 truncate">{item.filename}</div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{(item.size_bytes / 1024).toFixed(0)} KB</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
