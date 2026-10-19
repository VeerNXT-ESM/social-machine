'use client';

import React, { useEffect, useState } from 'react';
import { BrandSettings } from '@/types';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle2, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from './ui';

interface SettingsViewProps {
  mockMode: boolean;
  setMockMode: (val: boolean) => void;
}

type Mode = 'mock' | 'manual' | 'buffer';

const MODES: { id: Mode; title: string; description: string }[] = [
  { id: 'mock', title: 'Sandbox (default)', description: 'Run the full workflow without connecting real social accounts.' },
  { id: 'manual', title: 'Manual publishing', description: 'Copy text, download media and open the native apps.' },
  { id: 'buffer', title: 'Buffer', description: 'Really publish to LinkedIn and X through Buffer. Facebook and Instagram are not connected yet.' },
];

/** What a person types into the boxes. Lists are kept as text while editing and split when saved. */
interface Draft {
  brand_name: string;
  brand_description: string;
  audience: string;
  cta_style: string;
  tone: string;
  words_to_use: string;
  words_to_avoid: string;
  key_messages: string;
}

const toDraft = (b: BrandSettings): Draft => ({
  brand_name: b.brand_name,
  brand_description: b.brand_description,
  audience: b.audience,
  cta_style: b.cta_style,
  tone: b.tone.join(', '),
  words_to_use: b.words_to_use.join(', '),
  words_to_avoid: b.words_to_avoid.join(', '),
  key_messages: b.key_messages.join('\n'),
});

const split = (value: string, separator: RegExp) => value.split(separator).map((s) => s.trim()).filter(Boolean);

const toSettings = (d: Draft): BrandSettings => ({
  brand_name: d.brand_name.trim(),
  brand_description: d.brand_description.trim(),
  audience: d.audience.trim(),
  cta_style: d.cta_style.trim(),
  tone: split(d.tone, /,/),
  words_to_use: split(d.words_to_use, /,/),
  words_to_avoid: split(d.words_to_avoid, /,/),
  key_messages: split(d.key_messages, /\n/),
});

export function SettingsView({ mockMode, setMockMode }: SettingsViewProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [mode, setMode] = useState<Mode>(mockMode ? 'mock' : 'buffer');

  useEffect(() => {
    let active = true;
    api
      .getBrandSettings()
      .then((b) => {
        if (!active) return;
        const d = toDraft(b);
        setDraft(d);
        setSaved(d);
      })
      .catch((err) => active && setLoadError(err instanceof Error ? err.message : 'Could not load the settings.'));
    return () => {
      active = false;
    };
  }, []);

  const dirty = draft !== null && saved !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessage(null);
    setDraft((d) => (d ? { ...d, [key]: e.target.value } : d));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      const stored = toDraft(await api.saveBrandSettings(toSettings(draft)));
      setDraft(stored);
      setSaved(stored);
      setMessage({ kind: 'ok', text: 'Brand voice saved. New posts will follow it.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Could not save the settings.' });
    } finally {
      setSaving(false);
    }
  };

  const chooseMode = (id: Mode) => {
    // Only the Buffer option publishes for real; sandbox and manual never send anything.
    setMockMode(id !== 'buffer');
    setMode(id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <PageHeader title="Settings" description="Brand voice and publishing mode." />

      <Card>
        <CardHeader title="Publishing mode" description="Applies to this visit. The app always opens in Sandbox." />
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => chooseMode(m.id)}
              className={cn(
                'p-4 border text-left space-y-1 transition-colors',
                mode === m.id ? 'bg-neutral-100 border-neutral-800' : 'bg-white border-neutral-300 hover:border-neutral-500'
              )}
            >
              <div className="font-medium text-sm text-neutral-900">{m.title}</div>
              <div className="text-xs text-neutral-600">{m.description}</div>
            </button>
          ))}
        </CardBody>
      </Card>

      {loadError && (
        <div className="p-3 bg-white border border-neutral-800 text-neutral-900 text-sm" role="alert">
          {loadError}
        </div>
      )}
      {!draft && !loadError && <div className="text-sm text-neutral-600">Loading the brand voice...</div>}

      {draft && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader
              title="Brand voice"
              description="Saved for everyone who uses this app. The AI follows it every time it writes or rewrites a post."
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Brand name">
                  <Input value={draft.brand_name} onChange={set('brand_name')} maxLength={80} required />
                </Field>
                <Field label="Call to action style" hint="How posts should invite the reader to act.">
                  <Input value={draft.cta_style} onChange={set('cta_style')} maxLength={1000} />
                </Field>
              </div>

              <Field label="About the brand" hint="One or two sentences the AI reads first.">
                <Textarea rows={3} value={draft.brand_description} onChange={set('brand_description')} maxLength={1000} />
              </Field>

              <Field label="Target audience">
                <Textarea rows={2} value={draft.audience} onChange={set('audience')} maxLength={1000} />
              </Field>

              <Field label="Tone" hint="Separate with commas, for example: Professional, Supportive, Practical.">
                <Input value={draft.tone} onChange={set('tone')} />
              </Field>

              <Field label="Preferred terms" hint="Words and phrases to use where they fit naturally. Separate with commas.">
                <Textarea rows={2} value={draft.words_to_use} onChange={set('words_to_use')} />
              </Field>

              <Field label="Key messages" hint="One message per line. Used only when relevant to the source; the AI never turns them into claims the source does not make.">
                <Textarea rows={4} value={draft.key_messages} onChange={set('key_messages')} />
              </Field>

              <div className="p-4 bg-neutral-50 border border-neutral-300 space-y-2">
                <div className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Prohibited words and concepts
                </div>
                <p className="text-xs text-neutral-700">
                  Separate with commas. &quot;Agniveer&quot; is always prohibited and is added back if removed. Other rules (never invent facts, write for India, use
                  &quot;Ex-Service Men (ESM)&quot;) are fixed and cannot be changed here.
                </p>
                <Textarea rows={2} value={draft.words_to_avoid} onChange={set('words_to_avoid')} aria-label="Prohibited words and concepts" />
              </div>
            </CardBody>
          </Card>

          {message && (
            <div
              className={cn('p-3 bg-white border text-sm flex items-center gap-2', message.kind === 'ok' ? 'border-neutral-400 text-neutral-900' : 'border-neutral-800 text-neutral-900')}
              role={message.kind === 'ok' ? 'status' : 'alert'}
            >
              {message.kind === 'ok' && <CheckCircle2 className="w-4 h-4" />} {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={saving || !dirty}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : dirty ? 'Save brand voice' : 'Saved'}
            </Button>
            {dirty && (
              <Button type="button" size="lg" onClick={() => saved && setDraft(saved)} disabled={saving}>
                <RotateCcw className="w-4 h-4" /> Discard changes
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
