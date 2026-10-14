import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  padding = 'md',
  onClick,
}) => {
  const paddingMap = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-zinc-200/80 rounded-xl shadow-xs transition-all ${className}`}
    >
      {header && (
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddingMap[padding]}>{children}</div>
      {footer && (
        <div className="px-5 py-3.5 bg-zinc-50/60 border-t border-zinc-100 rounded-b-xl text-xs text-zinc-500">
          {footer}
        </div>
      )}
    </div>
  );
};
