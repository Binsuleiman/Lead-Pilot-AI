import React from 'react';
import { QualificationConfidence } from '../../types';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: QualificationConfidence | null | undefined;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, size = 'sm' }) => {
  if (!confidence) return null;

  const configs = {
    High: {
      text: 'text-emerald-800',
      bg: 'bg-emerald-50/90 border-emerald-200/80',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      label: 'High confidence',
    },
    Medium: {
      text: 'text-blue-800',
      bg: 'bg-blue-50/90 border-blue-200/80',
      icon: Shield,
      iconColor: 'text-blue-600',
      label: 'Medium confidence',
    },
    Low: {
      text: 'text-amber-800',
      bg: 'bg-amber-50/90 border-amber-200/80',
      icon: ShieldAlert,
      iconColor: 'text-amber-600',
      label: 'Low confidence',
    },
  };

  const config = configs[confidence] || configs.Medium;
  const Icon = config.icon;
  const textSize = size === 'sm' ? 'text-[11px] py-0.5 px-2' : 'text-xs py-1 px-2.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${config.bg} ${config.text} ${textSize} tracking-tight select-none`}
    >
      <Icon className={`w-3 h-3 ${config.iconColor}`} />
      <span>{config.label}</span>
    </span>
  );
};
