import React from 'react';
import { ResearchStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface ResearchStatusBadgeProps {
  status: ResearchStatus;
  size?: 'sm' | 'md';
}

export const ResearchStatusBadge: React.FC<ResearchStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const sizeClasses = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  if (status === 'Researched') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${sizeClasses}`}
        title="AI web research completed with verified sources"
      >
        <CheckCircle2 className={`${iconSize} text-emerald-600 shrink-0`} />
        <span>Researched</span>
      </span>
    );
  }

  if (status === 'Researching') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 ${sizeClasses}`}
        title="Gemini is actively researching this business online"
      >
        <Loader2 className={`${iconSize} text-blue-600 animate-spin shrink-0`} />
        <span>Researching</span>
      </span>
    );
  }

  if (status === 'Research failed') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200/80 ${sizeClasses}`}
        title="Research could not be completed for this lead"
      >
        <AlertTriangle className={`${iconSize} text-rose-600 shrink-0`} />
        <span>Research failed</span>
      </span>
    );
  }

  // Not researched
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/80 ${sizeClasses}`}
      title="Awaiting AI web research"
    >
      <Clock className={`${iconSize} text-zinc-400 shrink-0`} />
      <span>Not researched</span>
    </span>
  );
};
