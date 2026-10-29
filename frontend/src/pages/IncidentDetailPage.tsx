import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  MessageSquare,
  Wrench,
  ShieldCheck,
  Save
} from 'lucide-react';

import { api } from '../services/api';
import { Incident } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [finalOutcome, setFinalOutcome] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadIncident = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getIncident(id);
      setIncident(data);
      setStatus(data.status);
      setAssignedTo(data.assigned_to || '');
      setNotes(data.notes || '');
      setFinalOutcome(data.final_outcome || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      const updated = await api.updateIncident(id, {
        status,
        assigned_to: assignedTo,
        notes,
        final_outcome: finalOutcome
      });
      setIncident(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !incident) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-16">
        <h2 className="text-base font-bold text-slate-800">Incident Not Found</h2>
        <button onClick={() => navigate('/incidents')} className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg">
          Back to Incidents
        </button>
      </div>
    );
  }

  const lifecycleSteps = ['new', 'investigating', 'confirmed', 'fix_in_progress', 'resolved'];
  const currentStepIdx = lifecycleSteps.indexOf(incident.status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{incident.incident_id}</h1>
              <StatusBadge type="severity" value={incident.severity} />
              <StatusBadge type="incident_status" value={incident.status} />
              <DemoBadge />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Workstation: <strong className="text-slate-800">{incident.device_id}</strong> ({incident.device_display_name || 'Lab Workstation'}) • Category: <strong>{incident.fault_category}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/diagnostics`)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            AI Diagnostic Report
          </button>
          <button
            onClick={() => navigate(`/chat?device_id=${incident.device_id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chatbot Help
          </button>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <p className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">
          Incident Lifecycle Progression
        </p>

        <div className="grid grid-cols-5 gap-2">
          {lifecycleSteps.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx && currentStepIdx !== -1;
            const isCurrent = incident.status === step;

            return (
              <div key={step} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted && !isCurrent ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 capitalize">
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Triage & Technician Update Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Incident Triage & Status Control</h2>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Updated successfully
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lifecycle State</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="confirmed">Confirmed</option>
                <option value="fix_in_progress">Fix in Progress</option>
                <option value="resolved">Resolved</option>
                <option value="not_confirmed">Not Confirmed</option>
                <option value="inconclusive">Inconclusive</option>
                <option value="reopened">Reopened</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Technician</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Tech Kumar / Tech Sarah"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Technician Log & Observations</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record actions taken, findings, student interview notes..."
              className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Final Resolution Outcome</label>
            <textarea
              rows={2}
              value={finalOutcome}
              onChange={(e) => setFinalOutcome(e.target.value)}
              placeholder="e.g. Student script terminated. CPU returned to 15%. Work verified."
              className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Update Incident Record'}
            </button>
          </div>
        </form>

        {/* Audit Meta Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Audit Metadata</h3>

          <div className="space-y-2 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Trigger Source:</span>
              <span className="font-semibold text-slate-800 capitalize">{incident.source.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Created At:</span>
              <span className="font-semibold text-slate-800">{new Date(incident.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Last Updated:</span>
              <span className="font-semibold text-slate-800">{new Date(incident.updated_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Workstation ID:</span>
              <button
                onClick={() => navigate(`/devices/${incident.device_id}`)}
                className="font-mono font-bold text-blue-600 hover:underline"
              >
                {incident.device_id} →
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">State Transition Rule:</p>
            An incident may only be marked <strong>Resolved</strong> after completing the guided checklist verification and recording recovery verification.
          </div>
        </div>
      </div>
    </div>
  );
};
