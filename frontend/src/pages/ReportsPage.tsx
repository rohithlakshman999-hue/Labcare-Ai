import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  CheckCircle,
  Clock,
  Layers,
  Monitor,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import { api } from '../services/api';
import { DemoBadge } from '../components/common/DemoBadge';

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReportMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.location.href = api.getExportCsvUrl();
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const labData = metrics?.incidents_by_lab
    ? Object.entries(metrics.incidents_by_lab).map(([lab, count]) => ({
        lab,
        count
      }))
    : [];

  const categoryData = metrics?.incidents_by_category
    ? Object.entries(metrics.incidents_by_category).map(([cat, count]) => ({
        cat: cat.replace(' Failure', '').replace(' / Application Errors', ' Errors'),
        count
      }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratory Incident & Health Audits</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Metrics aggregated directly from stored incident records, verification logs, and telemetry history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Incidents</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics?.total_incidents || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all laboratories</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Diagnoses</p>
          <p className="mt-2 text-3xl font-extrabold text-purple-600">{metrics?.confirmed_diagnoses || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Checklist confirmed by tech</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Incidents</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{metrics?.resolved_incidents || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Verified post-repair</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mean Time to Resolution</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">
            {metrics?.average_resolution_time_minutes || 0}{' '}
            <span className="text-sm font-medium text-slate-400">mins</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Computed from timestamps</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Laboratory */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Incidents by Laboratory</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="lab" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} incidents`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Fault Category */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Incidents by Category</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="cat" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} incidents`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Incident Outcome Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Incident Outcome Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Total Early Warnings Logged:</span>
            <span className="text-lg font-bold text-slate-900">{metrics?.total_early_warnings || 0}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Diagnostic Reports Generated:</span>
            <span className="text-lg font-bold text-slate-900">{metrics?.total_diagnostic_reports || 0}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Reopened Incidents:</span>
            <span className="text-lg font-bold text-rose-600">{metrics?.reopened_incidents || 0}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Unconfirmed Model Findings:</span>
            <span className="text-lg font-bold text-slate-600">{metrics?.unconfirmed_incidents || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
