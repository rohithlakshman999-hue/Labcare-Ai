import React from 'react';

interface Props {
  type: 'health' | 'connection' | 'severity' | 'incident_status';
  value: string;
}

export const StatusBadge: React.FC<Props> = ({ type, value }) => {
  const val = (value || 'unknown').toLowerCase();

  if (type === 'connection') {
    if (val === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Online
        </span>
      );
    }
    if (val === 'offline') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Offline
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
        Unknown
      </span>
    );
  }

  if (type === 'health') {
    if (val === 'healthy') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          Healthy
        </span>
      );
    }
    if (val === 'warning') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          Warning
        </span>
      );
    }
    if (val === 'critical') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          Critical
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
        Unknown
      </span>
    );
  }

  if (type === 'severity') {
    const map: Record<string, string> = {
      critical: 'bg-rose-100 text-rose-800 border-rose-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-amber-100 text-amber-800 border-amber-300',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    const style = map[val] || 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider border ${style}`}>
        {value}
      </span>
    );
  }

  if (type === 'incident_status') {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      new: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'New' },
      investigating: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Investigating' },
      confirmed: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Confirmed' },
      fix_in_progress: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Fix In Progress' },
      resolved: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Resolved' },
      not_confirmed: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', label: 'Not Confirmed' },
      inconclusive: { bg: 'bg-zinc-100 border-zinc-300', text: 'text-zinc-700', label: 'Inconclusive' },
      reopened: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Reopened' },
      escalated: { bg: 'bg-red-50 border-red-300', text: 'text-red-800', label: 'Escalated' }
    };
    const cfg = map[val] || { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: value };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  }

  return <span>{value}</span>;
};
