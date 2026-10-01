import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon?: React.ReactNode;
}

/** A single KPI tile: small label, large value, optional helper line. */
export function StatCard({ label, value, note, icon }: StatCardProps) {
  return (
    <Card className="p-4 space-y-1">
      <div className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold text-neutral-900">{value}</div>
      {note && <div className="text-xs text-neutral-500">{note}</div>}
    </Card>
  );
}
