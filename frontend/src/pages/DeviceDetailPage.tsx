import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  Key,
  MessageSquare,
  AlertTriangle,
  Play,
  ArrowLeft,
  CheckCircle,
  FileText,
  Activity,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

import { api } from '../services/api';
import { Device, MetricSnapshot, LogEvent, EarlyWarning, Incident, DiagnosticReport } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';
import { EditDeviceModal } from '../components/devices/EditDeviceModal';
import { QuickConnectModal } from '../components/devices/QuickConnectModal';

export const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<Device | null>(null);
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Connect & Edit System Details Modals
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Enrollment Token Modal
  const [enrollToken, setEnrollToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Diagnosis in progress
  const [diagnosing, setDiagnosing] = useState(false);

  const loadDeviceData = async (isSilent = false) => {
    if (!id) return;
    try {
      if (!isSilent) setLoading(true);
      const [dev, mData, lData, wData, incData] = await Promise.all([
        api.getDevice(id),
        api.getDeviceMetrics(id),
        api.getDeviceLogs(id),
        api.getWarnings({ device_id: id }),
        api.getIncidents({ device_id: id })
      ]);
      setDevice(dev);
      setMetrics(mData);
      setLogs(lData);
      setWarnings(wData);
      setIncidents(incData);
    } catch (err) {
      console.error('Failed to load device detail:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceData();
    const handleRefresh = () => loadDeviceData(true);
    window.addEventListener('labcare:refresh', handleRefresh);
    return () => window.removeEventListener('labcare:refresh', handleRefresh);
  }, [id]);

  const handleEnrollAgent = async () => {
    if (!device) return;
    try {
      const res = await api.enrollDevice(device.device_id);
      setEnrollToken(res.enrollment_token);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunDiagnosis = async () => {
    if (!device) return;
    try {
      setDiagnosing(true);
      const report = await api.runDiagnosis(device.device_id);
      navigate(`/diagnostics/${report.report_id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleCopyToken = () => {
    if (!enrollToken) return;
    navigator.clipboard.writeText(enrollToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !device) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-16">
        <h2 className="text-base font-bold text-slate-800">Workstation Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">No registered workstation with ID {id}.</p>
        <button
          onClick={() => navigate('/devices')}
          className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg"
        >
          Back to Devices
        </button>
      </div>
    );
  }

  // Chart data formatting
  const chartData = metrics.map((m) => ({
    time: new Date(m.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cpu: m.cpu_usage_pct,
    ram: m.ram_usage_pct
  }));

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/devices')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{device.display_name}</h1>
              <span className="font-mono text-sm font-semibold bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                {device.device_id}
              </span>
              {device.demo_mode && <DemoBadge />}
              <button
                onClick={() => setShowEditModal(true)}
                title="Edit Workstation Details"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-1"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {device.lab_name} • Location: {device.location || 'Row A'} • OS: {device.operating_system}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            Edit System Details
          </button>

          <button
            onClick={handleRunDiagnosis}
            disabled={diagnosing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${diagnosing ? 'animate-spin' : ''}`} />
            {diagnosing ? 'Running AI Diagnosis...' : 'Run Diagnosis'}
          </button>

          <button
            onClick={() => navigate(`/chat?device_id=${device.device_id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Troubleshoot with AI Chat
          </button>

          <button
            onClick={handleEnrollAgent}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            Agent Token
          </button>

          <button
            onClick={() => setShowQuickConnect(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg shadow-2xs transition-all"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            Connect Client PC
          </button>
        </div>
      </div>

      {/* Edit System Details Modal */}
      {showEditModal && (
        <EditDeviceModal
          device={device}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setDevice(updated);
            window.dispatchEvent(new CustomEvent('labcare:refresh'));
          }}
          onDeleted={() => {
            window.dispatchEvent(new CustomEvent('labcare:refresh'));
            navigate('/devices');
          }}
        />
      )}

      {/* Quick Connect Client PC Modal */}
      {showQuickConnect && device && (
        <QuickConnectModal
          isOpen={showQuickConnect}
          onClose={() => setShowQuickConnect(false)}
          defaultDeviceId={device.device_id}
          defaultToken={enrollToken || undefined}
        />
      )}

      {/* Enrollment Token Modal */}
      {enrollToken && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600" />
              Agent Enrollment Token Generated
            </p>
            <p className="text-[11px] text-blue-700 font-mono mt-1 break-all bg-white px-2 py-1 rounded border border-blue-200">
              {enrollToken}
            </p>
            <p className="text-[10px] text-blue-600 mt-1">
              Provide this token in <code className="bg-blue-100 px-1 rounded">config.py</code> or <code className="bg-blue-100 px-1 rounded">--token</code> when launching <code className="bg-blue-100 px-1 rounded">labcare_agent</code>.
            </p>
          </div>
          <button
            onClick={handleCopyToken}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Token'}
          </button>
        </div>
      )}

      {/* Live Status Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connection</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge type="connection" value={device.connection_status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Last heartbeat: {device.last_heartbeat_at ? new Date(device.last_heartbeat_at).toLocaleTimeString() : 'Never'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Health Status</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge type="health" value={device.health_status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Agent: {device.agent_version}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current CPU & RAM</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {latestMetric ? `${latestMetric.cpu_usage_pct}%` : 'N/A'}{' '}
            <span className="text-xs font-normal text-slate-500">CPU</span> •{' '}
            {latestMetric ? `${latestMetric.ram_usage_pct}%` : 'N/A'}{' '}
            <span className="text-xs font-normal text-slate-500">RAM</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Free RAM: {latestMetric ? `${latestMetric.available_memory_mb} MB` : 'N/A'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Volume</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {latestMetric ? `${latestMetric.disk_usage_pct}%` : 'N/A'}{' '}
            <span className="text-xs font-normal text-slate-500">Used</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Remaining: {latestMetric ? `${latestMetric.free_disk_gb} GB free` : 'N/A'}
          </p>
        </div>
      </div>

      {/* CPU & RAM Telemetry Chart */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              Processor & Memory Telemetry Over Time
            </h2>
            <p className="text-xs text-slate-400">Snapshot measurements collected by labcare-agent</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            {metrics.length} Recorded Snapshots
          </span>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No telemetry captured yet for this workstation. Launch the agent or click Pulse Telemetry.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="cpu" name="CPU Utilization %" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ram" name="RAM Utilization %" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Grid: Active Warnings & Incidents + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Warnings & Incidents */}
        <div className="space-y-6">
          {/* Active Early Warnings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Early Warnings on this Device
            </h2>
            {warnings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active early warnings on this device.</p>
            ) : (
              <div className="space-y-2.5">
                {warnings.map((w) => (
                  <div key={w.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">{w.category}</span>
                      <StatusBadge type="severity" value={w.severity} />
                    </div>
                    <p className="text-slate-600 mb-2">{w.explanation}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Status: <strong className="text-slate-700 capitalize">{w.status}</strong></span>
                      <span>{new Date(w.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incident History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Incident Records
            </h2>
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No logged incidents for this workstation.</p>
            ) : (
              <div className="space-y-2.5">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer bg-slate-50 text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-600">{inc.incident_id}</span>
                      <StatusBadge type="incident_status" value={inc.status} />
                    </div>
                    <p className="font-semibold text-slate-800">{inc.fault_category}</p>
                    {inc.notes && <p className="text-slate-500 text-[11px] mt-1">{inc.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System & Application Event Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-600" />
              Latest Relevant Logs
            </h2>
            <span className="text-[11px] text-slate-400">{logs.length} Log Entries</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 divide-y divide-slate-100 font-mono text-[11px]">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center font-sans">
                No error or warning events logged recently. System operating cleanly.
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="py-2.5 px-2 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : log.severity === 'ERROR'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-800 break-words">{log.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Source: {log.source}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
