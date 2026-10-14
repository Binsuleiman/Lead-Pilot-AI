import React from 'react';
import { QualificationStatus } from '../../types';

interface LeadStatusBadgeProps {
  status: QualificationStatus;
  size?: 'sm' | 'md';
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs = {
    Researching: {
      dot: 'bg-blue-500 ring-2 ring-blue-100 animate-pulse',
      text: 'text-blue-800',
      bg: 'bg-blue-50/80 border-blue-200/70',
      label: 'Researching',
    },
    Qualified: {
      dot: 'bg-emerald-500 ring-2 ring-emerald-100',
      text: 'text-emerald-800',
      bg: 'bg-emerald-50/70 border-emerald-200/60',
      label: 'Qualified',
    },
    Potential: {
      dot: 'bg-amber-500 ring-2 ring-amber-100',
      text: 'text-amber-800',
      bg: 'bg-amber-50/70 border-amber-200/60',
      label: 'Potential',
    },
    'Not a match': {
      dot: 'bg-zinc-400 ring-2 ring-zinc-100',
      text: 'text-zinc-600',
      bg: 'bg-zinc-100/70 border-zinc-200/60',
      label: 'Not a match',
    },
    'Qualification Failed': {
      dot: 'bg-rose-500 ring-2 ring-rose-100',
      text: 'text-rose-800',
      bg: 'bg-rose-50/80 border-rose-200/70',
      label: 'Qualification Failed',
    },
  };

  const config = configs[status] || configs['Not a match'];
  const textSize = size === 'sm' ? 'text-xs py-0.5 px-2' : 'text-sm py-1 px-2.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${config.text} ${textSize} tracking-tight select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
