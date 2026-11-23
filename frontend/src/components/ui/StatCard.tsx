import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  colorScheme?: 'teal' | 'navy' | 'blue' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorScheme = 'teal',
}) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    navy: 'bg-navy-50 text-navy-700 border-navy-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={cn('p-3 rounded-xl border flex-shrink-0', colorMap[colorScheme])}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{value}</p>
        {(description || trend) && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {trend && <span className="font-semibold text-teal-600">{trend}</span>}
            {description}
          </p>
        )}
      </div>
    </Card>
  );
};
