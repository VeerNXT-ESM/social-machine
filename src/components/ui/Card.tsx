import React from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-white border border-neutral-200', className)} {...props} />;
}

interface CardHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Card title row with a bottom divider and optional right-hand actions. */
export function CardHeader({ title, description, icon, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5 py-3 border-b border-neutral-200', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {description && <p className="text-xs text-neutral-600 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}
