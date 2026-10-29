import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  FileCheck,
  Wrench,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

import { api } from '../services/api';
import { DashboardSummary, DashboardTrends, EarlyWarning, Device } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [latestWarnings, setLatestWarnings] = useState<EarlyWarning[]>([]);
  const [investigatingDevices, setInvestigatingDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [sumData, trendData, warnData, devData] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
        api.getWarnings({ status: 'new' }),
        api.getDevices({ health: 'critical' })
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setLatestWarnings(warnData.slice(0, 5));
      setInvestigatingDevices(devData.slice(0, 6));
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData(true);
    window.addEventListener('labcare:refresh', handleRefresh);
    return () => window.removeEventListener('labcare:refresh', handleRefresh);
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeWarning(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateIncident = async (id: number) => {
    try {
      const inc = await api.createIncidentFromWarning(id);
      navigate(`/incidents/${inc.incident_id}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Loading Lab Telemetry & Incident Intelligence...</p>
        </div>
      </div>
    );
  }

  // Chart data formatting
  const healthPieData = trends
    ? [
        { name: 'Healthy', value: trends.health_distribution.healthy || 0, color: '#10b981' },
        { name: 'Warning', value: trends.health_distribution.warning || 0, color: '#f59e0b' },
        { name: 'Critical', value: trends.health_distribution.critical || 0, color: '#f43f5e' },
        { name: 'Unknown / Offline', value: trends.health_distribution.unknown || 0, color: '#94a3b8' },
      ].filter((d) => d.value > 0)
    : [];

  const categoryBarData = trends
    ? Object.entries(trends.incidents_by_category).map(([name, count]) => ({
        name: name.replace(' Failure', '').replace(' / Application Errors', ' Errors'),
        count
      }))
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Operations Overview</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Real-time status across Computer Science, AI, and Cybersecurity laboratories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/diagnostics')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Cpu className="w-4 h-4" />
            AI Diagnostic Center
          </button>
        </div>
      </div>

      {/* Top 9 Metric StatCards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Registered"
            value={summary.total_devices}
            subtext="Campus lab workstations"
            icon={Monitor}
            onClick={() => navigate('/devices')}
          />
          <StatCard
            title="Online"
            value={summary.online_devices}
            subtext="Active heartbeats (<90s)"
            icon={Wifi}
            variant="success"
            onClick={() => navigate('/devices?connection=online')}
          />
          <StatCard
            title="Offline"
            value={summary.offline_devices}
            subtext="No heartbeat received"
            icon={WifiOff}
            onClick={() => navigate('/devices?connection=offline')}
          />
          <StatCard
            title="Healthy"
            value={summary.healthy_devices}
            subtext="Normal telemetry"
            icon={CheckCircle}
            variant="success"
            onClick={() => navigate('/devices?health=healthy')}
          />
          <StatCard
            title="Investigating"
            value={summary.investigating_devices}
            subtext="Warning or critical states"
            icon={AlertOctagon}
            variant={summary.investigating_devices > 0 ? 'warning' : 'default'}
            onClick={() => navigate('/devices?health=critical')}
          />
          <StatCard
            title="Critical Incidents"
            value={summary.critical_incidents}
            subtext="Requiring active triage"
            icon={AlertTriangle}
            variant={summary.critical_incidents > 0 ? 'danger' : 'default'}
            onClick={() => navigate('/incidents?severity=critical')}
          />
          <StatCard
            title="Early Warnings"
            value={summary.active_early_warnings}
            subtext="Predicted fault symptoms"
            icon={TrendingUp}
            variant={summary.active_early_warnings > 0 ? 'warning' : 'default'}
            onClick={() => navigate('/warnings')}
          />
          <StatCard
            title="Awaiting Confirm"
            value={summary.awaiting_confirmation_count}
            subtext="Checklist confirmation"
            icon={FileCheck}
            variant="info"
            onClick={() => navigate('/incidents?status=investigating')}
          />
          <StatCard
            title="Awaiting Repair"
            value={summary.awaiting_repair_verification_count}
            subtext="Post-repair verification"
            icon={Wrench}
            variant="info"
            onClick={() => navigate('/incidents?status=fix_in_progress')}
          />
        </div>
      )}

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Health Distribution (Donut) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Device Health Distribution</h2>
            <span className="text-xs text-slate-400">Live Workstations</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {healthPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} devices`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-slate-600">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Fault Category (Bar Chart) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Incidents by Fault Category</h2>
            <span className="text-xs text-slate-400">All Labs</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
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

        {/* 7-Day Incident Trend */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">7-Day Incident Trend</h2>
            <span className="text-xs text-slate-400">Occurrence Rate</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.daily_incident_trend || []} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Prioritized Early Warnings & Workstations Requiring Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Early Warnings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Active Early Warnings (Predicted Signs)</h2>
            </div>
            <button
              onClick={() => navigate('/warnings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All ({summary?.active_early_warnings || 0}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {latestWarnings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No active early warnings</p>
              <p className="text-[11px] text-slate-500 mt-0.5">All monitored workstations are operating within thresholds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestWarnings.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{w.device_id}</span>
                      <StatusBadge type="severity" value={w.severity} />
                      <span className="text-xs font-semibold text-slate-700">{w.category}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{w.explanation}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcknowledge(w.id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleCreateIncident(w.id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Create Incident
                    </button>
                    <button
                      onClick={() => navigate(`/devices/${w.device_id}`)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 ml-auto"
                    >
                      Inspect Device →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workstations Requiring Attention */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">Workstations Requiring Triage</h2>
            </div>
            <button
              onClick={() => navigate('/devices?health=critical')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {investigatingDevices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">All workstations healthy</p>
              <p className="text-[11px] text-slate-500 mt-0.5">No critical issues detected on monitored lab machines.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {investigatingDevices.map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => navigate(`/devices/${dev.device_id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center font-bold text-rose-700 text-xs">
                      {dev.device_id.split('-')[1]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{dev.display_name} ({dev.device_id})</p>
                      <p className="text-[11px] text-slate-500">{dev.lab_name} • {dev.location || 'Row A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <p className="text-slate-600 font-medium">
                        CPU: <span className="font-semibold text-slate-900">{dev.current_cpu ?? 'N/A'}%</span> • RAM: <span className="font-semibold text-slate-900">{dev.current_ram ?? 'N/A'}%</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {dev.active_warnings_count} Warnings • {dev.active_incidents_count} Incidents
                      </p>
                    </div>
                    <StatusBadge type="health" value={dev.health_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
