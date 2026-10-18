'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { CreateContentView } from '@/components/CreateContentView';
import { ContentEditorView } from '@/components/ContentEditorView';
import { ContentLibraryView } from '@/components/ContentLibraryView';
import { CalendarView } from '@/components/CalendarView';
import { SourcesView } from '@/components/SourcesView';
import { PageHelp } from '@/components/PageHelp';
import { MediaLibraryView } from '@/components/MediaLibraryView';
import { CampaignsView } from '@/components/CampaignsView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { SettingsView } from '@/components/SettingsView';
import { TestCampaignModal } from '@/components/TestCampaignModal';
import { ManualPublishModal } from '@/components/ManualPublishModal';
import { api, setPublishMode } from '@/lib/api';
import { ContentItem, PlatformPost } from '@/types';
import type { ContentPrefill } from '@/types/sources';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [mockMode, setMockMode] = useState<boolean>(true);
  useEffect(() => setPublishMode(mockMode ? 'mock' : 'buffer'), [mockMode]);

  // Modals
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);
  const [manualPost, setManualPost] = useState<PlatformPost | null>(null);
  const [prefill, setPrefill] = useState<ContentPrefill | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadItems = React.useCallback(async () => {
    try {
      const loaded = await api.listItems();
      setItems(loaded);
      setSelectedItem((current) => (current ? loaded.find((i) => i.id === current.id) ?? null : current));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Once on opening the app, ask Buffer whether scheduled posts have gone out, and refresh if any changed.
    api.syncPublishing().then((r) => r.changed > 0 && void loadItems()).catch(() => undefined);
  }, [loadItems]);

  useEffect(() => {
    // Initial load from the database. `active` stops a late response from updating an unmounted page.
    let active = true;
    api
      .listItems()
      .then((loaded) => {
        if (!active) return;
        setItems(loaded);
        setLoadError(null);
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : 'Could not load content.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshItems = () => {
    void loadItems();
  };

  /** Put an updated item (returned by the API) into the list and the open editor. */
  const applyItem = (updated: ContentItem) => {
    setItems((current) =>
      current.some((i) => i.id === updated.id)
        ? current.map((i) => (i.id === updated.id ? updated : i))
        : [updated, ...current]
    );
    setSelectedItem((current) => (current && current.id === updated.id ? updated : current));
  };

  const handleContentGenerated = (newItem: ContentItem) => {
    applyItem(newItem);
    setPrefill(null);
    setSelectedItem(newItem);
    setActiveTab('content');
  };

  const handleSelectItem = (item: ContentItem) => {
    setSelectedItem(item);
    setActiveTab('content');
  };

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900 font-sans antialiased">
      {/* Desktop Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'content') setSelectedItem(null);
          if (tab === 'create') setPrefill(null);
          setActiveTab(tab);
        }}
        onOpenTestCampaignModal={() => setTestModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mockMode={mockMode}
          setMockMode={setMockMode}
          onOpenTestCampaignModal={() => setTestModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          {loadError && (
            <div className="mb-4 p-3 bg-white border border-neutral-800 text-neutral-900 text-sm flex items-center justify-between gap-3" role="alert">
              <span>Could not load content: {loadError}</span>
              <button onClick={refreshItems} className="underline font-medium shrink-0">
                Try again
              </button>
            </div>
          )}
          {loading && !loadError && <div className="mb-4 text-sm text-neutral-600">Loading content...</div>}
          {activeTab === 'dashboard' && (
            <DashboardView
              items={items}
              setActiveTab={setActiveTab}
              onSelectItem={handleSelectItem}
              onOpenTestCampaignModal={() => setTestModalOpen(true)}
            />
          )}

          {activeTab === 'create' && (
            <CreateContentView key={prefill?.linkId ?? 'blank'} prefill={prefill} onGenerated={handleContentGenerated} />
          )}

          {activeTab === 'content' && (
            selectedItem ? (
              <ContentEditorView
                item={selectedItem}
                onUpdateItem={applyItem}
                onOpenManualPublish={(post) => setManualPost(post)}
              />
            ) : (
              <ContentLibraryView
                items={items}
                onSelectItem={handleSelectItem}
                onCreate={() => setActiveTab('create')}
                onItemsChanged={refreshItems}
              />
            )
          )}

          {activeTab === 'calendar' && (
            <CalendarView items={items} onSelectItem={handleSelectItem} onItemsChanged={refreshItems} />
          )}

          {activeTab === 'sources' && (
            <SourcesView
              onCreateFromLink={(p) => {
                setPrefill(p);
                setActiveTab('create');
              }}
            />
          )}

          {activeTab === 'media' && <MediaLibraryView />}

          {activeTab === 'campaigns' && (
            <CampaignsView onGenerateCampaign={() => setActiveTab('create')} />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'settings' && (
            <SettingsView
              mockMode={mockMode}
              setMockMode={setMockMode}
              onOpenTestCampaignModal={() => setTestModalOpen(true)}
            />
          )}

          <PageHelp tab={activeTab} editing={activeTab === 'content' && selectedItem !== null} />
        </main>
      </div>

      {/* Test Campaign Modal (#35) */}
      <TestCampaignModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        onCompleteTest={(newItem) => {
          refreshItems();
          setSelectedItem(newItem);
          setActiveTab('content');
        }}
      />

      {/* Manual Publishing Modal (#19) */}
      <ManualPublishModal
        post={manualPost}
        onClose={() => setManualPost(null)}
        onMarkPublished={() => refreshItems()}
      />
    </div>
  );
}
