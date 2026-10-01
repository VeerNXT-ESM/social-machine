import React from 'react';
import { cn } from '@/lib/cn';

interface Option<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Underlined tabs for switching between sections of one panel. */
export function Tabs<T extends string>({ options, value, onChange, className }: Props<T>) {
  return (
    <div className={cn('flex items-center border-b border-neutral-200', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm border-b-2 -mb-px',
            value === o.id
              ? 'border-neutral-800 text-neutral-900 font-medium'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Joined button group for switching a view mode (week / month / list). */
export function SegmentedControl<T extends string>({ options, value, onChange, className }: Props<T>) {
  return (
    <div className={cn('flex items-center', className)} role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'px-3 py-1.5 text-sm border -ml-px first:ml-0 inline-flex items-center gap-1.5',
            value === o.id
              ? 'bg-neutral-800 border-neutral-800 text-white font-medium'
              : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
