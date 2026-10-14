import React from 'react';
import { EmailStatus } from '../../types';
import { Mail, Minus, AlertCircle } from 'lucide-react';

interface EmailStatusBadgeProps {
  status?: EmailStatus | null;
  emailValue?: string | null;
  size?: 'sm' | 'md';
}

export const EmailStatusBadge: React.FC<EmailStatusBadgeProps> = ({
  status,
  emailValue,
  size = 'sm',
}) => {
  const sizeClasses = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  if (status === 'Found' || (emailValue && emailValue.includes('@'))) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${sizeClasses}`}
        title={emailValue ? `Public email: ${emailValue}` : 'Public email listed on website'}
      >
        <Mail className={`${iconSize} text-emerald-600 shrink-0`} />
        <span>Found</span>
      </span>
    );
  }

  if (status === 'Not Found') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/80 ${sizeClasses}`}
        title="No public business email found in available sources"
      >
        <Minus className={`${iconSize} text-zinc-400 shrink-0`} />
        <span>Not Found</span>
      </span>
    );
  }

  if (status === 'Unable to Determine') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}
        title="Unable to determine public email from available sources"
      >
        <AlertCircle className={`${iconSize} text-amber-600 shrink-0`} />
        <span>Inconclusive</span>
      </span>
    );
  }

  // Not yet enriched or unknown
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium text-zinc-400 ${sizeClasses}`}
      title="Awaiting contact enrichment"
    >
      <span>—</span>
    </span>
  );
};
