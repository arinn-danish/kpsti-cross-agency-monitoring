import React from 'react';
import { ProjectStatus } from '../types';
import { AlertTriangle, Clock, CheckCircle2, PlayCircle, PauseCircle, Compass } from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  switch (status) {
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses}`}>
          <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
          <span className="whitespace-nowrap">In Progress</span>
        </span>
      );
    case 'Completed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="whitespace-nowrap">Completed</span>
        </span>
      );
    case 'Planning':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses}`}>
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span className="whitespace-nowrap">Planning</span>
        </span>
      );
    case 'On Hold':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}>
          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          <span className="whitespace-nowrap">On Hold</span>
        </span>
      );
    case 'Delayed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span className="whitespace-nowrap">Delayed</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};

interface NeedsAttentionBadgeProps {
  hasBlocker?: boolean;
  isOverdue?: boolean;
  size?: 'sm' | 'md';
}

export const NeedsAttentionBadge: React.FC<NeedsAttentionBadgeProps> = ({ hasBlocker, isOverdue, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-semibold';
  
  let label = 'Needs Attention';
  if (hasBlocker && isOverdue) {
    label = 'Blocker & Overdue';
  } else if (hasBlocker) {
    label = 'Active Blocker';
  } else if (isOverdue) {
    label = 'Overdue';
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses}`}>
      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};

export const CrossAgencyBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300/80">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
      <span className="whitespace-nowrap">{count} Partner {count === 1 ? 'Agency' : 'Agencies'}</span>
    </span>
  );
};
