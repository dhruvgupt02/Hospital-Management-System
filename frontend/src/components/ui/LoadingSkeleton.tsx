import React from 'react';
import { cn } from '../../utils/cn';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className,
}) => {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      <div className="h-6 bg-slate-200/80 rounded w-1/3 mb-4"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-10 bg-slate-200/70 rounded-lg flex-1"></div>
          <div className="h-10 bg-slate-200/70 rounded-lg w-28"></div>
        </div>
      ))}
    </div>
  );
};
