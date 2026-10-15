'use client';

import React, { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ExternalLink, Plus, RefreshCw, Rss, Globe, Search, Trash2, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ContentPrefill, LinkRow, LinkStatus, ScanSummary, SourceKind, SourceRow } from '@/types/sources';
import { Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select } from './ui';

interface SourcesViewProps {
  onCreateFromLink: (prefill: ContentPrefill) => void;
}

const STATUS_TABS: { id: LinkStatus | 'all'; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'saved', label: 'Saved' },
  { id: 'used', label: 'Used' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All' },
];

// Links scoring at least this have some defence or veteran relevance; zero means off-topic.
const RELEVANT_MIN = 4;

export function SourcesView({ onCreateFromLink }: SourcesViewProps) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [status, setStatus] = useState<LinkStatus | 'all'>('new');
  const [sourceId, setSourceId] = useState('');
  const [relevantOnly, setRelevantOnly] = useState(true);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(0);

  const [busy, setBusy] = useState<string | null>(null); // 'all' | source id | 'seed'
  const [addOpen, setAddOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listLinks({ status, source: sourceId || undefined, minRelevance: relevantOnly ? RELEVANT_MIN : 0, q: query || undefined }),
      api.listSources(),
    ])
      .then(([l, s]) => {
        if (!active) return;
        setLinks(l);
        setSources(s);
        setError(null);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Could not load sources.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, sourceId, relevantOnly, query, version]);

  const describeScan = (summaries: ScanSummary[]) => {
    const added = summaries.reduce((n, s) => n + s.added, 0);
    const failed = summaries.filter((s) => s.error);
    const blocked = summaries.reduce((n, s) => n + (s.skipped?.spam ?? 0), 0);
    let msg = added > 0 ? `Found ${added} new link${added === 1 ? '' : 's'}.` : 'No new links since the last scan.';
    if (blocked > 0) msg += ` ${blocked} spam link${blocked === 1 ? ' was' : 's were'} blocked.`;
    if (failed.length > 0) msg += ` ${failed.length} source${failed.length === 1 ? '' : 's'} could not be read.`;
    return msg;
  };

  const scan = async (id?: string) => {
    setBusy(id ?? 'all');
    setError(null);
    setNotice(null);
    try {
      const result = await api.scan(id);
      setNotice(describeScan(result.summaries));
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The scan failed.');
    } finally {
      setBusy(null);
    }
  };

  const addSuggested = async () => {
    setBusy('seed');
    setError(null);
    try {
      const { added } = await api.addSuggestedSources();
      setNotice(`Added ${added} suggested source${added === 1 ? '' : 's'}. Select "Scan all sources" to look for links.`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the suggested sources.');
    } finally {
      setBusy(null);
    }
  };

  const toggleEnabled = async (s: SourceRow) => {
    setSources((cur) => cur.map((x) => (x.id === s.id ? { ...x, enabled: !s.enabled } : x)));
    try {
      await api.setSourceEnabled(s.id, !s.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the source.');
      reload();
    }
  };

  const removeSource = async (id: string) => {
    setConfirmRemove(null);
    try {
      await api.deleteSource(id);
      if (sourceId === id) setSourceId('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the source.');
    }
  };

  const changeLinkStatus = async (link: LinkRow, next: LinkStatus) => {
    // Update the list straight away; put it back if the save fails.
    const before = links;
    setLinks((cur) => (status === 'all' ? cur.map((l) => (l.id === link.id ? { ...l, status: next } : l)) : cur.filter((l) => l.id !== link.id)));
    try {
      await api.setLinkStatus(link.id, next);
      reload();
    } catch (err) {
      setLinks(before);
      setError(err instanceof Error ? err.message : 'Could not update the link.');
    }
  };

  const createFrom = (link: LinkRow) =>
    onCreateFromLink({
      linkId: link.id,
      title: link.title,
      url: link.url,
      summary: link.summary ?? '',
      sourceName: link.source_name,
    });

  const noSources = !loading && sources.length === 0;

  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        title="Sources"
        description="Find articles from defence and veteran-affairs sites to inspire posts. Only links, titles and short excerpts are kept."
        actions={
          <>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" /> Add source
            </Button>
            <Button variant="primary" onClick={() => scan()} disabled={busy !== null || sources.length === 0}>
              <RefreshCw className={`w-4 h-4 ${busy === 'all' ? 'animate-spin' : ''}`} />
              {busy === 'all' ? 'Scanning...' : 'Scan all sources'}
            </Button>
          </>
        }
      />

      {notice && (
        <div className="p-3 bg-white border border-neutral-400 text-neutral-900 text-sm" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm flex items-center justify-between gap-3" role="alert">
          <span>{error}</span>
          <button onClick={reload} className="underline font-medium shrink-0">
            Try again
          </button>
        </div>
      )}

      {noSources ? (
        <Card>
          <EmptyState
            title="No sources yet"
            description="Add the suggested defence and strategy sites to get started. You can add or remove sources at any time."
            action={
              <Button variant="primary" onClick={addSuggested} disabled={busy !== null}>
                {busy === 'seed' ? 'Adding...' : 'Add suggested sources'}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
          {/* Sources */}
          <Card>
            <CardHeader title="Sources" description={`${sources.length} configured`} />
            <ul className="divide-y divide-neutral-200">
              {sources.map((s) => (
                <li key={s.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={() => toggleEnabled(s)}
                      aria-label={`Include ${s.name} in scans`}
                      className="mt-1 w-4 h-4 accent-neutral-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                        {s.kind === 'rss' ? <Rss className="w-3.5 h-3.5 shrink-0" /> : <Globe className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{s.name}</span>
                      </div>
                      <div className="text-xs text-neutral-600">
                        {s.last_checked_at ? `Checked ${formatDistanceToNow(new Date(s.last_checked_at), { addSuffix: true })}` : 'Not scanned yet'}
                        {(s.new_count ?? 0) > 0 && ` - ${s.new_count} new`}
                      </div>
                      {s.last_status === 'error' && s.last_error && (
                        <div className="text-xs text-neutral-900 border border-neutral-800 p-1.5 mt-1">{s.last_error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-6.5">
                    <Button size="sm" onClick={() => scan(s.id)} disabled={busy !== null}>
                      <RefreshCw className={`w-3 h-3 ${busy === s.id ? 'animate-spin' : ''}`} /> Scan
                    </Button>
                    {confirmRemove === s.id ? (
                      <>
                        <Button size="sm" variant="primary" onClick={() => removeSource(s.id)}>
                          Confirm remove
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(s.id)} aria-label={`Remove ${s.name}`}>
                        <Trash2 className="w-3 h-3" /> Remove
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-neutral-200">
              <Button size="sm" onClick={addSuggested} disabled={busy !== null}>
                Add suggested sources
              </Button>
            </div>
          </Card>

          {/* Links */}
          <div className="space-y-3 min-w-0">
            <Card className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center">
                {STATUS_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setStatus(t.id)}
                    aria-pressed={status === t.id}
                    className={`px-3 py-1.5 text-sm border -ml-px first:ml-0 ${
                      status === t.id
                        ? 'bg-neutral-800 border-neutral-800 text-white font-medium'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)} aria-label="Source" className="w-auto py-1.5">
                <option value="">All sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={relevantOnly}
                  onChange={(e) => setRelevantOnly(e.target.checked)}
                  className="w-4 h-4 accent-neutral-800"
                />
                Defence-related only
              </label>
              <div className="relative ml-auto">
                <Search className="w-4 h-4 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setQuery(queryInput)}
                  onBlur={() => setQuery(queryInput)}
                  placeholder="Search links"
                  className="pl-8 w-56 py-1.5"
                />
              </div>
            </Card>

            <Card>
              {loading ? (
                <div className="p-10 text-center text-sm text-neutral-600">Loading...</div>
              ) : links.length === 0 ? (
                <EmptyState
                  title={status === 'new' ? 'No new links' : 'Nothing here'}
                  description={
                    status === 'new'
                      ? 'Scan the sources to look for new articles, or turn off "Defence-related only" to see everything.'
                      : 'Links you mark as ' + status + ' appear here.'
                  }
                />
              ) : (
                <ul className="divide-y divide-neutral-200">
                  {links.map((l) => (
                    <li key={l.id} className="px-5 py-4 flex flex-col md:flex-row md:items-start gap-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-neutral-900 hover:underline inline-flex items-start gap-1.5"
                        >
                          <span>{l.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-500" />
                        </a>
                        <div className="text-xs text-neutral-600">
                          {l.source_name}
                          {l.author && ` - ${l.author}`}
                          {l.published_at && ` - ${format(new Date(l.published_at), 'd MMM yyyy')}`}
                        </div>
                        {l.summary && <p className="text-sm text-neutral-700 line-clamp-2">{l.summary}</p>}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-xs border border-neutral-300 bg-neutral-50 text-neutral-800 px-1.5 py-0.5" title="How closely this relates to veterans and defence">
                            Relevance {l.relevance}
                          </span>
                          {l.matched_keywords.map((k) => (
                            <span key={k} className="text-xs border border-neutral-200 text-neutral-600 px-1.5 py-0.5">
                              {k}
                            </span>
                          ))}
                          {l.mentions_restricted_term && (
                            <span
                              className="text-xs border border-neutral-800 text-neutral-900 px-1.5 py-0.5 inline-flex items-center gap-1"
                              title="This article uses a term our brand rules do not allow in posts. Do not repeat the wording."
                            >
                              <AlertTriangle className="w-3 h-3" /> Contains a restricted term
                            </span>
                          )}
                          {l.status === 'used' && <span className="text-xs bg-neutral-800 text-white px-1.5 py-0.5">Used</span>}
                        </div>
                      </div>
                      <div className="flex md:flex-col items-stretch gap-2 shrink-0 md:w-40">
                        <Button variant="primary" size="sm" onClick={() => createFrom(l)}>
                          <Wand2 className="w-3.5 h-3.5" /> Create content
                        </Button>
                        <div className="flex gap-2">
                          {l.status === 'dismissed' || l.status === 'saved' ? (
                            <Button size="sm" className="flex-1" onClick={() => changeLinkStatus(l, 'new')}>
                              Restore
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1" onClick={() => changeLinkStatus(l, 'saved')}>
                              Save
                            </Button>
                          )}
                          {l.status !== 'dismissed' && (
                            <Button size="sm" variant="ghost" className="flex-1" onClick={() => changeLinkStatus(l, 'dismissed')}>
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <AddSourceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(summary) => {
          setAddOpen(false);
          setNotice(`Source added. ${summary.added} link${summary.added === 1 ? '' : 's'} found.`);
          reload();
        }}
      />
    </div>
  );
}

function AddSourceModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (scan: ScanSummary) => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<SourceKind>('rss');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { scan } = await api.addSource({ name, url, kind });
      setName('');
      setUrl('');
      onAdded(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the source.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Rss className="w-5 h-5" />}
      title="Add a source"
      subtitle="The address is tested before it is saved. An RSS feed is the most reliable option."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Example Defence Journal" required />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as SourceKind)}>
            <option value="rss">RSS feed</option>
            <option value="html">Web page listing articles</option>
          </Select>
        </Field>
        <Field label={kind === 'rss' ? 'Feed address' : 'Page address'} hint="Must start with https://. Internal addresses are not allowed.">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={kind === 'rss' ? 'https://example.org/feed/' : 'https://example.org/articles'}
            required
          />
        </Field>
        {error && (
          <p className="text-sm text-neutral-900 border border-neutral-800 p-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Testing...' : 'Test and add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
