import React from 'react';

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="text-center py-14 px-6">
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      {description && <p className="text-sm text-neutral-600 mt-1">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
