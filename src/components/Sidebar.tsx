'use client';

import { Button } from './ui';
import React from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Calendar,
  Image as ImageIcon,
  FolderKanban,
  BarChart3,
  Settings,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'create'
  | 'content'
  | 'calendar'
  | 'media'
  | 'campaigns'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenTestCampaignModal: () => void;
}

export function Sidebar({ activeTab, setActiveTab, onOpenTestCampaignModal }: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'create', label: 'Create', icon: <PlusCircle className="w-5 h-5" />, badge: 'AI' },
    { id: 'content', label: 'Content Library', icon: <FileText className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0 hidden md:flex min-h-screen">
      <div>
        {/* Brand Logo & Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center space-x-3">
          <div className="relative w-9 h-9 shrink-0 bg-neutral-100 border border-neutral-300 flex items-center justify-center overflow-hidden shadow-sm">
            <Image
              src="/logo.png"
              alt="VeerNXT Logo"
              width={36}
              height={36}
              className="object-contain p-0.5"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral-900 tracking-tight leading-tight flex items-center gap-1.5">
              VeerNXT <span className="text-neutral-700 font-semibold text-xs px-1.5 py-0.5 bg-neutral-100 border border-neutral-300">Social</span>
            </h1>
            <p className="text-[11px] text-neutral-600 font-medium">Content platform</p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <Button variant="primary" block onClick={() => setActiveTab('create')}>
            <PlusCircle className="w-4 h-4" />
            <span>Create content</span>
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5  text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-semibold border border-neutral-300 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-neutral-700' : 'text-neutral-600'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-neutral-200 space-y-3">
        {/* User / Team Card */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-neutral-100 border border-neutral-300 text-neutral-700 font-bold flex items-center justify-center text-xs shrink-0">
              VN
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-800 truncate">VeerNXT Editorial</p>
              <p className="text-[10px] text-neutral-700 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 inline" /> ESM Communications
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
