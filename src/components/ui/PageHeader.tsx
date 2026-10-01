import React from 'react';
import { Card } from './Card';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Standard top-of-page header: title and description on the left, actions on the right. */
export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {description && <p className="text-sm text-neutral-600 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </Card>
  );
}
