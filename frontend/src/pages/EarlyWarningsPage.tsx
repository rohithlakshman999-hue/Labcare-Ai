import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  PlusCircle,
  Clock,
  Filter,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

import { api } from '../services/api';
import { EarlyWarning } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';

export const EarlyWarningsPage: React.FC = () => {
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Dismiss modal state
  const [dismissId, setDismissId] = useState<number | null>(null);
  const [dismissReason, setDismissReason] = useState('Standard workload expected during student lab session.');

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const data = await api.getWarnings({ status: selectedStatus || undefined });
      setWarnings(data);
    } catch (err) {
      console.error('Failed to load warnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarnings();
  }, [selectedStatus]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeWarning(id);
      loadWarnings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.resolveWarning(id);
      loadWarnings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissConfirm = async () => {
    if (!dismissId) return;
    try {
      await api.dismissWarning(dismissId, dismissReason);
      setDismissId(null);
      loadWarnings();
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Early Warning & Predictive Alerts</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Evidence-backed threshold anomalies, sustained spikes, and memory leak patterns flagged before system failure.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
          {['', 'new', 'acknowledged', 'investigating', 'resolved', 'dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-md transition-colors capitalize ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === '' ? 'All States' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Warnings List */}
      <div className="space-y-4">
        {loading && warnings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading early warning telemetry...
          </div>
        ) : warnings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Warnings Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no early warning alerts matching the selected filter.
            </p>
          </div>
        ) : (
          warnings.map((w) => {
            const evidenceObj = w.supporting_evidence ? JSON.parse(w.supporting_evidence) : null;
            return (
              <div
                key={w.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all hover:border-slate-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                      {w.device_id}
                    </span>
                    <StatusBadge type="severity" value={w.severity} />
                    <span className="font-bold text-sm text-slate-900">{w.category}</span>
                    <span className="text-xs text-slate-400">• Trigger: {w.trigger_type}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(w.created_at).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                      {w.status}
                    </span>
                  </div>
                </div>

                <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <p className="font-semibold text-slate-700">Condition Explanation:</p>
                      <p className="text-slate-600 mt-0.5">{w.explanation}</p>
                    </div>

                    {evidenceObj && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                        <span className="font-sans font-bold text-slate-800 block mb-1">Supporting Metric Telemetry:</span>
                        {Object.entries(evidenceObj).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-semibold">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {w.dismissal_reason && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                        <strong>Dismissal Reason:</strong> {w.dismissal_reason}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-slate-700 space-y-1.5">
                    <p className="font-bold text-blue-900 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                      Recommended Preventive Checks:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>Inspect workstation Resource Monitor for active student processes.</li>
                      <li>Review whether multiple student sessions are logged in.</li>
                      <li>Run guided diagnostic check before escalating to hardware maintenance.</li>
                    </ul>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/devices/${w.device_id}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Workstation Telemetry <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {w.status === 'new' && (
                      <button
                        onClick={() => handleAcknowledge(w.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {['new', 'acknowledged'].includes(w.status) && (
                      <>
                        <button
                          onClick={() => setDismissId(w.id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Dismiss...
                        </button>

                        <button
                          onClick={() => handleCreateIncident(w.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
                        >
                          Escalate to Incident
                        </button>
                      </>
                    )}

                    {w.status === 'investigating' && (
                      <button
                        onClick={() => handleResolve(w.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dismiss Reason Modal */}
      {dismissId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Dismiss Early Warning</h3>
            <p className="text-xs text-slate-500">
              Provide a rationale for dismissing this alert so it is audited in lab reports.
            </p>

            <textarea
              rows={3}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Expected transient load during machine learning model training lab."
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDismissId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDismissConfirm}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Confirm Dismissal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
