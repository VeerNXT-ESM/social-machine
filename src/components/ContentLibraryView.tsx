'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ContentItem, Platform } from '@/types';
import { api } from '@/lib/api';
import { Search, PlusCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import { Button, Card, EmptyState, Input, Select, StatusLabel } from './ui';

interface ContentLibraryViewProps {
  items: ContentItem[];
  onSelectItem: (item: ContentItem) => void;
  onCreate: () => void;
  onItemsChanged: () => void;
}

const ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x: Twitter,
  instagram: Instagram,
  facebook: Facebook,
};
const PLATFORM_NAMES: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

export function ContentLibraryView({ items, onSelectItem, onCreate, onItemsChanged }: ContentLibraryViewProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [channel, setChannel] = useState<'ALL' | Platform>('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (status !== 'ALL' && i.status !== status) return false;
      if (channel !== 'ALL' && !i.selected_platforms.includes(channel)) return false;
      if (!q) return true;
      return [i.title, i.campaign_name, i.master_idea, i.content_type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, query, status, channel]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const approveSelected = async () => {
    setBusy(true);
    setError(null);
    try {
      await Promise.all(selected.map((id) => api.approve(id)));
      setSelected([]);
      onItemsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve the selected content.');
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    const chosen = items.filter((i) => selected.includes(i.id));
    const queued = chosen.flatMap((i) => Object.values(i.posts ?? {})).filter((p) => p.status === 'SCHEDULED').length;
    const published = chosen.flatMap((i) => Object.values(i.posts ?? {})).filter((p) => p.status === 'PUBLISHED').length;
    const lines = [`Delete ${chosen.length} item${chosen.length === 1 ? '' : 's'} and all their channel posts? This cannot be undone.`];
    if (queued) lines.push(`${queued} scheduled post${queued === 1 ? '' : 's'} will also be cancelled in Buffer.`);
    if (published) lines.push(`${published} already published post${published === 1 ? '' : 's'} will stay on the social networks; only the app's copy is removed.`);
    if (!window.confirm(lines.join('\n\n'))) return;
    setBusy(true);
    setError(null);
    const failures: string[] = [];
    for (const i of chosen) {
      try {
        await api.deleteItem(i.id);
      } catch (err) {
        failures.push(`${i.title}: ${err instanceof Error ? err.message : 'could not be deleted'}`);
      }
    }
    setSelected(failures.length ? chosen.filter((i) => failures.some((f) => f.startsWith(i.title))).map((i) => i.id) : []);
    if (failures.length) setError(failures.join(' '));
    setBusy(false);
    onItemsChanged();
  };

  const approvedCount = (i: ContentItem) => {
    const posts = Object.values(i.posts || {});
    const done = posts.filter((p) => ['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(p.status)).length;
    return `${done} of ${posts.length}`;
  };

  return (
    <div className="space-y-4 pb-12">
      <Card className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search content"
              className="pl-8 w-64 py-1.5"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="w-auto py-1.5">
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">In review</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </Select>
          <Select
            value={channel}
            onChange={(e) => setChannel(e.target.value as 'ALL' | Platform)}
            aria-label="Channel"
            className="w-auto py-1.5"
          >
            <option value="ALL">All channels</option>
            {(Object.keys(PLATFORM_NAMES) as Platform[]).map((p) => (
              <option key={p} value={p}>
                {PLATFORM_NAMES[p]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <span className="text-sm text-neutral-700">{selected.length} selected</span>
              <Button onClick={approveSelected} disabled={busy}>
                <CheckCircle2 className="w-4 h-4" /> Approve posts
              </Button>
              <Button onClick={deleteSelected} disabled={busy}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
              <Button variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
            </>
          )}
          <Button variant="primary" onClick={onCreate}>
            <PlusCircle className="w-4 h-4" /> Create content
          </Button>
        </div>
      </Card>

      {error && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm" role="alert">
          {error}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="bg-neutral-50 text-left text-xs text-neutral-600 border-b border-neutral-200">
              <th className="px-4 py-2.5 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? [] : rows.map((r) => r.id))}
                />
              </th>
              <th className="px-2 py-2.5 font-medium">Content</th>
              <th className="px-4 py-2.5 font-medium">Channels</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Posts approved</th>
              <th className="px-4 py-2.5 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr
                key={i.id}
                onClick={() => onSelectItem(i)}
                className="border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${i.title}`}
                    checked={selected.includes(i.id)}
                    onChange={() => toggle(i.id)}
                  />
                </td>
                <td className="px-2 py-3 max-w-md">
                  <div className="font-medium text-neutral-900 truncate">{i.title}</div>
                  <div className="text-xs text-neutral-600 truncate">
                    {[i.content_type, i.campaign_name].filter(Boolean).join(' - ')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    {i.selected_platforms.map((p) => {
                      const Icon = ICONS[p];
                      return <Icon key={p} className="w-4 h-4" />;
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusLabel status={i.status} />
                </td>
                <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">{approvedCount(i)}</td>
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                  {format(new Date(i.updated_at), 'd MMM yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState title="No content matches these filters" />}
        <div className="px-4 py-2.5 text-xs text-neutral-600 bg-neutral-50 border-t border-neutral-200">
          {rows.length} of {items.length} items
        </div>
      </Card>
    </div>
  );
}
