'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { CreateContentView } from '@/components/CreateContentView';
import { ContentEditorView } from '@/components/ContentEditorView';
import { ContentLibraryView } from '@/components/ContentLibraryView';
import { CalendarView } from '@/components/CalendarView';
import { MediaLibraryView } from '@/components/MediaLibraryView';
import { CampaignsView } from '@/components/CampaignsView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { SettingsView } from '@/components/SettingsView';
import { TestCampaignModal } from '@/components/TestCampaignModal';
import { ManualPublishModal } from '@/components/ManualPublishModal';
import { mockRepo } from '@/lib/mockStore';
import { ContentItem, PlatformPost } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [mockMode, setMockMode] = useState<boolean>(true);

  // Modals
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);
  const [manualPost, setManualPost] = useState<PlatformPost | null>(null);

  useEffect(() => {
    setItems(mockRepo.getItems());
  }, []);

  const refreshItems = () => {
    const updated = mockRepo.getItems();
    setItems(updated);
    if (selectedItem) {
      const refreshed = updated.find((i) => i.id === selectedItem.id);
      if (refreshed) setSelectedItem(refreshed);
    }
  };

  const handleContentGenerated = (newItem: ContentItem) => {
    refreshItems();
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
          {activeTab === 'dashboard' && (
            <DashboardView
              items={items}
              setActiveTab={setActiveTab}
              onSelectItem={handleSelectItem}
              onOpenTestCampaignModal={() => setTestModalOpen(true)}
            />
          )}

          {activeTab === 'create' && (
            <CreateContentView onGenerated={handleContentGenerated} />
          )}

          {activeTab === 'content' && (
            selectedItem ? (
              <ContentEditorView
                item={selectedItem}
                onUpdateItem={(updated) => {
                  setSelectedItem(updated);
                  refreshItems();
                }}
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
