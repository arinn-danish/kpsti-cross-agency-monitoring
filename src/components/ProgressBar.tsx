import React from 'react';

interface ProgressBarProps {
  progress: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isOverdue?: boolean;
  hasBlocker?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showText = true,
  size = 'md',
  isOverdue = false,
  hasBlocker = false
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  let barColor = 'bg-blue-600';
  if (clamped >= 100) {
    barColor = 'bg-emerald-600';
  } else if (hasBlocker || isOverdue) {
    barColor = hasBlocker ? 'bg-amber-600' : 'bg-rose-600';
  } else if (clamped >= 70) {
    barColor = 'bg-blue-600';
  } else if (clamped >= 30) {
    barColor = 'bg-sky-600';
  } else {
    barColor = 'bg-slate-500';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  }[size];

  return (
    <div className="w-full flex items-center gap-2.5">
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClasses}`}>
        <div
          className={`${barColor} ${heightClasses} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showText && (
        <span className="text-xs font-bold text-slate-700 w-10 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
};
