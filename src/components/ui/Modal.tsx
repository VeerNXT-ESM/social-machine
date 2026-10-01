'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  /** Width of the panel. */
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const SIZES = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-7xl' };

export function Modal({ open = true, onClose, title, subtitle, icon, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'bg-white border border-neutral-300 shadow-xl w-full max-h-[94vh] overflow-y-auto',
          SIZES[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="p-2 border border-neutral-300 bg-neutral-50 text-neutral-700 shrink-0">{icon}</div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
              {subtitle && <p className="text-xs text-neutral-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">{children}</div>
      </div>
    </div>
  );
}
