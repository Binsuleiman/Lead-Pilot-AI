import React from 'react';
import { ContactEnrichmentStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, Loader2, Minus, UserCheck } from 'lucide-react';

interface ContactStatusBadgeProps {
  status?: ContactEnrichmentStatus | null;
  size?: 'sm' | 'md';
}

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({
  status = 'Not Enriched',
  size = 'sm',
}) => {
  const sizeClasses = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  if (status === 'Enriched') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-purple-50 text-purple-800 border border-purple-200/80 ${sizeClasses}`}
        title="Public business contact information enriched"
      >
        <UserCheck className={`${iconSize} text-purple-600 shrink-0`} />
        <span>Enriched</span>
      </span>
    );
  }

  if (status === 'Partial') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-sky-50 text-sky-800 border border-sky-200/80 ${sizeClasses}`}
        title="Partial contact channels found (e.g. verified phone or contact page)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
        <span>Partial</span>
      </span>
    );
  }

  if (status === 'Enriching') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 ${sizeClasses}`}
        title="Enriching public contact information"
      >
        <Loader2 className={`${iconSize} text-blue-600 animate-spin shrink-0`} />
        <span>Enriching</span>
      </span>
    );
  }

  if (status === 'Enrichment Failed') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200/80 ${sizeClasses}`}
        title="Enrichment could not be completed for this lead"
      >
        <AlertTriangle className={`${iconSize} text-rose-600 shrink-0`} />
        <span>Failed</span>
      </span>
    );
  }

  if (status === 'Not Found') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/80 ${sizeClasses}`}
        title="No public contact information found in available sources"
      >
        <Minus className={`${iconSize} text-zinc-400 shrink-0`} />
        <span>Not Found</span>
      </span>
    );
  }

  // Not Enriched
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium text-zinc-400 ${sizeClasses}`}
      title="Not yet enriched"
    >
      <span>—</span>
    </span>
  );
};
