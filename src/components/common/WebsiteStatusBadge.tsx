import React from 'react';
import { WebsiteStatus } from '../../types';
import { Globe, AlertCircle, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface WebsiteStatusBadgeProps {
  status: WebsiteStatus;
}

export const WebsiteStatusBadge: React.FC<WebsiteStatusBadgeProps> = ({ status }) => {
  if (status === 'Website researched') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-md">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Website researched</span>
      </span>
    );
  }

  if (status === 'Website found') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 bg-blue-50/80 border border-blue-200/70 px-2 py-0.5 rounded-md">
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span>Website found</span>
      </span>
    );
  }

  if (status === 'Website research failed' || status === 'Website found, but research could not be completed') {
    return (
      <span
        title="Website found, but research could not be completed"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 bg-rose-50/80 border border-rose-200/70 px-2 py-0.5 rounded-md"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span>Website found, research incomplete</span>
      </span>
    );
  }

  if (status === 'No website found') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50/80 border border-amber-200/70 px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>No website found</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">
      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
      <span>Not researched</span>
    </span>
  );
};


