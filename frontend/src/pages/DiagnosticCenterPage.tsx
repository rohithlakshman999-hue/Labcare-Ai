import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Cpu,
  CheckSquare,
  Wrench,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Play,
  ArrowRight,
  ShieldAlert,
  Search,
  RotateCcw
} from 'lucide-react';

import { api } from '../services/api';
import { DiagnosticReport, Device } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';

export const DiagnosticCenterPage: React.FC = () => {
  const { id: routeReportId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('LAB-A-03');
  const [activeReport, setActiveReport] = useState<DiagnosticReport | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  // Verification Form State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [technicianOutcome, setTechnicianOutcome] = useState<'confirmed' | 'not_confirmed' | 'inconclusive'>('confirmed');
  const [observations, setObservations] = useState('');
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Repair Modal State
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairNotes, setRepairNotes] = useState('');
  const [repairSubmitting, setRepairSubmitting] = useState(false);

  // Recovery Verification State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);

    if (routeReportId) {
      api.getDiagnosticReport(routeReportId).then((rpt) => {
        setActiveReport(rpt);
        setSelectedDevice(rpt.device_id);
      }).catch(console.error);
    }
  }, [routeReportId]);

  const handleRunDiagnosis = async () => {
    if (!selectedDevice) return;
    try {
      setDiagnosing(true);
      const report = await api.runDiagnosis(selectedDevice);
      setActiveReport(report);
      setCheckedItems({});
      setVerificationSuccess(false);
      setRecoverySuccessMsg('');
      navigate(`/diagnostics/${report.report_id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    if (!observations.trim()) {
      alert('Technician observations are required before recording verification.');
      return;
    }

    try {
      setVerificationSubmitting(true);
      const completedList = Object.entries(checkedItems)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      await api.submitVerification(activeReport.report_id, {
        technician_outcome: technicianOutcome,
        checks_completed: completedList,
        observations: observations,
        technician_identifier: 'Campus Tech 1'
      });
      setVerificationSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const handleRepairSubmit = async () => {
    if (!activeReport) return;
    try {
      setRepairSubmitting(true);
      await api.recordRepair(activeReport.report_id, {
        incident_id: activeReport.incident_id || 1,
        procedure_identifier: `SOP-${activeReport.prediction.replace(/\s+/g, '-').toUpperCase()}`,
        action_notes: repairNotes || 'Safe repair executed as specified in recommended guidance.',
        outcome: 'successful'
      });
      setShowRepairModal(false);
      setShowRecoveryModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setRepairSubmitting(false);
    }
  };

  const handleRecoverySubmit = async () => {
    if (!activeReport) return;
    try {
      const res = await api.verifyRecovery(activeReport.report_id, {
        incident_id: activeReport.incident_id || 1,
        technician_notes: recoveryNotes || 'Workstation telemetry and application responsive. Baseline verified.',
        confirm_resolved: true
      });
      setShowRecoveryModal(false);
      setRecoverySuccessMsg(res.message);
    } catch (e) {
      console.error(e);
    }
  };

  // Parse JSON fields
  const checklist: string[] = activeReport?.verification_checklist
    ? JSON.parse(activeReport.verification_checklist)
    : [];

  const causes: string[] = activeReport?.likely_causes
    ? JSON.parse(activeReport.likely_causes)
    : [];

  const missingEvidence: string[] = activeReport?.missing_evidence
    ? JSON.parse(activeReport.missing_evidence)
    : [];

  const safeSteps: any[] = activeReport?.safe_troubleshooting
    ? JSON.parse(activeReport.safe_troubleshooting)
    : [];

  const evidenceObj = activeReport?.evidence
    ? JSON.parse(activeReport.evidence)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Diagnostic Center</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Multi-modal fault inference combining trained Random Forest telemetry models, deterministic rules, and guided checklists.
          </p>
        </div>

        {/* Workstation Selector & Diagnose Button */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 shadow-xs focus:outline-none focus:border-blue-500"
          >
            {devices.map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_id} — {d.display_name} ({d.health_status})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunDiagnosis}
            disabled={diagnosing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${diagnosing ? 'animate-spin' : ''}`} />
            {diagnosing ? 'Analyzing...' : 'Run Diagnosis'}
          </button>
        </div>
      </div>

      {recoverySuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{recoverySuccessMsg}</span>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="font-bold underline text-emerald-900"
          >
            View Incident History →
          </button>
        </div>
      )}

      {!activeReport ? (
        <div className="p-16 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
          <Stethoscope className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Diagnostic Report Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a laboratory workstation above and click <strong>Run Diagnosis</strong> to trigger evidence-based AI fault prediction and guided troubleshooting.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Diagnostic Report Summary Header */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Diagnosis: {activeReport.prediction}
                    </h2>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {activeReport.report_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Device: <strong>{activeReport.device_id}</strong> • Model Version: {activeReport.model_version} • Generated: {new Date(activeReport.generated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Model Score</p>
                  <p className="text-base font-extrabold text-blue-600 font-mono">
                    {(activeReport.model_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Confidence</p>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {activeReport.confidence_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Tri-Column: Observed Evidence vs Likely Causes vs Missing Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Observed Facts */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Observed Physical Evidence:
                </p>
                {evidenceObj && evidenceObj.observed_metrics ? (
                  <div className="space-y-1 font-mono text-[11px] text-slate-700">
                    <p>CPU: <strong>{evidenceObj.observed_metrics.cpu_usage_pct}%</strong></p>
                    <p>RAM: <strong>{evidenceObj.observed_metrics.ram_usage_pct}%</strong> ({evidenceObj.observed_metrics.available_memory_mb} MB avail)</p>
                    <p>Disk: <strong>{evidenceObj.observed_metrics.disk_usage_pct}%</strong> ({evidenceObj.observed_metrics.free_disk_gb} GB free)</p>
                    <p>Network: <strong>{evidenceObj.observed_metrics.network_status}</strong></p>
                  </div>
                ) : (
                  <p className="text-slate-500">No direct telemetry recorded.</p>
                )}
                {evidenceObj?.rule_engine_findings?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    {evidenceObj.rule_engine_findings.map((f: string, i: number) => (
                      <p key={i}>• {f}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Likely Causes */}
              <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  Likely Root Causes (Hypotheses):
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                  {causes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Missing Evidence */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  Missing Evidence (Not Inferred):
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  {missingEvidence.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Module E: Guided Verification Workflow */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Technician Guided Verification Checklist
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Before confirming a suspected fault, perform and document these physical checks. The model hypothesis is NOT confirmed until verified.
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {checklist.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer hover:text-slate-900 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item]}
                      onChange={(e) => setCheckedItems({ ...checkedItems, [item]: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>

              {/* Verification Outcome Radio Buttons */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-800">Technician Verification Outcome:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                      technicianOutcome === 'confirmed'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="confirmed"
                      checked={technicianOutcome === 'confirmed'}
                      onChange={() => setTechnicianOutcome('confirmed')}
                    />
                    Confirmed (Issue matches evidence)
                  </label>

                  <label
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                      technicianOutcome === 'not_confirmed'
                        ? 'border-slate-500 bg-slate-100 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="not_confirmed"
                      checked={technicianOutcome === 'not_confirmed'}
                      onChange={() => setTechnicianOutcome('not_confirmed')}
                    />
                    Not Confirmed (Alternative cause)
                  </label>

                  <label
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                      technicianOutcome === 'inconclusive'
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="inconclusive"
                      checked={technicianOutcome === 'inconclusive'}
                      onChange={() => setTechnicianOutcome('inconclusive')}
                    />
                    Inconclusive (Needs further logs)
                  </label>
                </div>
              </div>

              {/* Technician Observations Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Technician Physical Observations & Findings:
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="e.g. Inspected Task Manager. Confirmed student script infinite while loop PID 4920. Requested user save work."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {verificationSuccess && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Verification recorded in incident log.
                    </span>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={verificationSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
                >
                  {verificationSubmitting ? 'Recording...' : 'Record Verification Finding'}
                </button>
              </div>
            </form>
          </div>

          {/* Module F: Safe Repair Guidance */}
          {safeSteps.length > 0 && (
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    Standard Operating Procedure: Safe Repair Guidance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recommendation-only steps. No automatic disruptive commands are executed without authorization.
                  </p>
                </div>
                <button
                  onClick={() => setShowRepairModal(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all"
                >
                  Execute & Log Repair SOP
                </button>
              </div>

              <div className="space-y-3">
                {safeSteps.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900">Step {s.step}: {s.action}</span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Risk: {s.risk_level || 'Low'}
                      </span>
                    </div>
                    {s.preconditions && (
                      <p className="text-slate-500 text-[11px]"><strong>Preconditions:</strong> {s.preconditions}</p>
                    )}
                    <p className="text-emerald-700 text-[11px] mt-1">
                      <strong>Expected Result:</strong> {s.expected_result}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Repair Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              Log Safe Repair Action
            </h3>
            <p className="text-xs text-slate-500">
              Confirm that you have followed the safe repair procedure on <strong>{activeReport?.device_id}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Actions Performed:</label>
              <textarea
                rows={3}
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="e.g. Student work saved. Closed runaway Python IDE process PID 4920. Recollected metrics."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRepairModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRepairSubmit}
                disabled={repairSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
              >
                {repairSubmitting ? 'Recording...' : 'Proceed to Recovery Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Verification Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Module G — Post-Repair Recovery Verification
            </h3>
            <p className="text-xs text-slate-500">
              Fresh telemetry must confirm that the symptom has resolved before the incident can be closed.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Technician Verification Notes:</label>
              <textarea
                rows={3}
                value={recoveryNotes}
                onChange={(e) => setRecoveryNotes(e.target.value)}
                placeholder="e.g. CPU utilization dropped from 94% to 18%. Student reopened IDE successfully. Recovery confirmed."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRecoverySubmit}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Confirm Recovery & Resolve Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
