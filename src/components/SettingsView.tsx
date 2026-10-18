'use client';

import React, { useState } from 'react';
import { BrandSettings } from '@/types';
import { mockRepo } from '@/lib/mockStore';
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from './ui';

interface SettingsViewProps {
  mockMode: boolean;
  setMockMode: (val: boolean) => void;
  onOpenTestCampaignModal?: () => void;
}

type Mode = BrandSettings['publishing_mode'];

const MODES: { id: Mode; title: string; description: string }[] = [
  { id: 'mock', title: 'Sandbox (default)', description: 'Run the full workflow without connecting real social accounts.' },
  { id: 'manual', title: 'Manual publishing', description: 'Copy text, download media and open the native apps.' },
  { id: 'buffer', title: 'Buffer or native API', description: 'Really publish to LinkedIn and X through Buffer. Facebook and Instagram are not connected yet.' },
];

const splitList = (value: string) => value.split(',').map((s) => s.trim());

export function SettingsView({ setMockMode, onOpenTestCampaignModal }: SettingsViewProps) {
  const [settings, setSettings] = useState<BrandSettings>(mockRepo.getBrandSettings());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mockRepo.saveBrandSettings(settings);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const chooseMode = (id: Mode) => {
    // Only the Buffer option publishes for real; sandbox and manual never send anything.
    setMockMode(id !== 'buffer');
    setSettings({ ...settings, publishing_mode: id });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <PageHeader
        title="Settings"
        description="Brand voice, prohibited terms and publishing mode."
        actions={
          savedMsg && (
            <span className="text-sm text-neutral-800 px-3 py-1.5 border border-neutral-300 bg-neutral-50 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Settings saved
            </span>
          )
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader title="Publishing mode" />
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MODES.map((m) => {
              const selected = settings.publishing_mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseMode(m.id)}
                  className={cn(
                    'p-4 border text-left space-y-1 transition-colors',
                    selected
                      ? 'bg-neutral-100 border-neutral-800'
                      : 'bg-white border-neutral-300 hover:border-neutral-500'
                  )}
                >
                  <div className="font-medium text-sm text-neutral-900">{m.title}</div>
                  <div className="text-xs text-neutral-600">{m.description}</div>
                </button>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Brand voice" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Brand name">
                <Input
                  value={settings.brand_name}
                  onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                />
              </Field>
              <Field label="Target audience">
                <Input
                  value={settings.audience}
                  onChange={(e) => setSettings({ ...settings, audience: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Preferred terms and messaging" hint="Separate terms with commas.">
              <Textarea
                rows={2}
                value={settings.words_to_use.join(', ')}
                onChange={(e) => setSettings({ ...settings, words_to_use: splitList(e.target.value) })}
              />
            </Field>

            <div className="p-4 bg-neutral-50 border border-neutral-300 space-y-2">
              <div className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Prohibited words and concepts
              </div>
              <p className="text-xs text-neutral-700">
                &quot;Agniveer&quot; is strictly prohibited. Generated text is checked against this list.
              </p>
              <Textarea
                rows={2}
                value={settings.words_to_avoid.join(', ')}
                onChange={(e) => setSettings({ ...settings, words_to_avoid: splitList(e.target.value) })}
                aria-label="Prohibited words and concepts"
              />
            </div>
          </CardBody>
        </Card>

        <Button type="submit" variant="primary" size="lg" block>
          <Save className="w-4 h-4" /> Save settings
        </Button>
      </form>

      {onOpenTestCampaignModal && (
        <Card>
          <CardHeader title="Developer tools" />
          <CardBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              Runs the end-to-end test workflow: generates two sample content items with images, approves them and
              publishes through the mock provider. Uses your OpenAI key.
            </p>
            <Button onClick={onOpenTestCampaignModal}>Run test campaign</Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
