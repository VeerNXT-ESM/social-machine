'use client';

import { Button } from './ui';
import React from 'react';
import Image from 'next/image';
import { NavTab } from './Sidebar';
import {
  PlusCircle,
  
  Globe,
  Bell,
  Sliders,
  CheckCircle2,
  Menu,
  X,
  Shield,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mockMode: boolean;
  setMockMode: (val: boolean) => void;
  onOpenTestCampaignModal: () => void;
}

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  create: 'Create content',
  content: 'Content library',
  calendar: 'Calendar',
  sources: 'Sources',
  media: 'Media library',
  campaigns: 'Campaigns',
  analytics: 'Analytics',
  settings: 'Settings',
};

export function Header({
  activeTab,
  setActiveTab,
  mockMode,
  setMockMode,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  // Sign-in only exists on the online site; locally this stays null and no button is shown.
  const [account, setAccount] = React.useState<{ required: boolean; email: string | null } | null>(null);
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);
  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/login';
  };

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'create', label: 'Create' },
    { id: 'content', label: 'Content' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'sources', label: 'Sources' },
    { id: 'media', label: 'Media' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between gap-2">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-neutral-600 hover:text-neutral-900 md:hidden"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 bg-neutral-100 border border-neutral-300 p-1 flex items-center justify-center">
            <Image src="/logo.png" alt="VeerNXT" width={28} height={28} className="object-contain" />
          </div>
          <span className="font-bold text-neutral-900 text-base">VeerNXT Social</span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            {TITLES[activeTab] ?? activeTab}
          </h2>
        </div>
      </div>

      {/* Right Controls & Indicators */}
      <div className="flex items-center gap-3">
        {/* Mock Mode Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-300 px-3 py-1.5">
          <span
            className={`w-2 h-2  ${
              mockMode ? 'bg-neutral-800 animate-pulse' : 'bg-neutral-800'
            }`}
          />
          <span className="text-xs font-semibold text-neutral-700">
            {mockMode ? 'Sandbox mode' : 'Live API'}
          </span>
          <button
            onClick={() => setMockMode(!mockMode)}
            className="text-[10px] underline font-medium text-neutral-600 hover:text-neutral-900 ml-1"
            title="Toggle mock publisher simulation mode"
          >
            {mockMode ? 'Switch to live' : 'Switch to sandbox'}
          </button>
        </div>

        {account?.required && (
          <Button size="sm" variant="ghost" onClick={signOut} title={account.email ? `Signed in as ${account.email}` : 'Sign out'}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Button>
        )}

        <Button variant="primary" size="sm" onClick={() => setActiveTab('create')}>
          <PlusCircle className="w-3.5 h-3.5" /> Create
        </Button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-200 p-4 md:hidden space-y-2 shadow-2xl z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5  text-sm font-semibold ${
                activeTab === item.id
                  ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
