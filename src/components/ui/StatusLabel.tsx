import React from 'react';
import { CheckCircle2, Clock, FileText, Layers, AlertTriangle, Loader2 } from 'lucide-react';

const LABELS: Record<string, { text: string; icon: React.ReactNode }> = {
  DRAFT: { text: 'Draft', icon: <FileText className="w-3 h-3" /> },
  GENERATING: { text: 'Generating', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  REVIEW: { text: 'In review', icon: <Layers className="w-3 h-3" /> },
  APPROVED: { text: 'Approved', icon: <CheckCircle2 className="w-3 h-3" /> },
  SCHEDULED: { text: 'Scheduled', icon: <Clock className="w-3 h-3" /> },
  PUBLISHED: { text: 'Published', icon: <CheckCircle2 className="w-3 h-3" /> },
  FAILED: { text: 'Failed', icon: <AlertTriangle className="w-3 h-3" /> },
};

/** Plain-language name for a status value. */
export function statusText(status: string) {
  return LABELS[status]?.text ?? status;
}

/** Grey-only status marker: meaning comes from the icon and wording, not colour. */
export function StatusLabel({ status }: { status: string }) {
  const entry = LABELS[status] ?? { text: status, icon: null };
  const strong = status === 'PUBLISHED' || status === 'SCHEDULED';
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
        strong
          ? 'bg-neutral-800 text-white border-neutral-800'
          : 'bg-white text-neutral-700 border-neutral-300'
      }`}
    >
      {entry.icon}
      {entry.text}
    </span>
  );
}
