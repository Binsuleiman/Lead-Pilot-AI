import React from 'react';
import { Search, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = Search,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
      <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 shadow-xs flex items-center justify-center text-zinc-500 mb-4">
        <Icon className="w-5 h-5 text-zinc-600" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
