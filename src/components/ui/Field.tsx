import React from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full bg-white border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-600 disabled:bg-neutral-100 disabled:text-neutral-500';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'leading-relaxed', className)} {...props} />;
}

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Label above a control, with optional helper text underneath. */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-xs font-medium text-neutral-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500 mt-1">{hint}</span>}
    </label>
  );
}
