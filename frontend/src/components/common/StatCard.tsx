import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  onClick
}) => {
  const borderColors: Record<string, string> = {
    default: 'border-slate-200 hover:border-slate-300',
    success: 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300',
    warning: 'border-amber-200 bg-amber-50/20 hover:border-amber-300',
    danger: 'border-rose-200 bg-rose-50/20 hover:border-rose-300',
    info: 'border-blue-200 bg-blue-50/20 hover:border-blue-300'
  };

  const iconColors: Record<string, string> = {
    default: 'text-slate-600 bg-slate-100',
    success: 'text-emerald-700 bg-emerald-100',
    warning: 'text-amber-700 bg-amber-100',
    danger: 'text-rose-700 bg-rose-100',
    info: 'text-blue-700 bg-blue-100'
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border bg-white shadow-sm transition-all duration-200 ${
        borderColors[variant]
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconColors[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
