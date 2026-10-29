import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  User,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import { api } from '../services/api';
import { Incident, Device } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedLab, setSelectedLab] = useState('');

  // Manual Incident Modal
  const [showModal, setShowModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newCategory, setNewCategory] = useState('Excessive CPU Usage');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const [incData, devData] = await Promise.all([
        api.getIncidents({
          status: selectedStatus || undefined,
          severity: selectedSeverity || undefined,
          lab: selectedLab || undefined
        }),
        api.getDevices()
      ]);
      setIncidents(incData);
      setDevices(devData);
      if (devData.length > 0 && !newDeviceId) {
        setNewDeviceId(devData[0].device_id);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedStatus, selectedSeverity, selectedLab]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await api.createIncident({
        device_id: newDeviceId,
        fault_category: newCategory,
        severity: newSeverity,
        notes: newNotes
      });
      setShowModal(false);
      navigate(`/incidents/${created.incident_id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inc.incident_id.toLowerCase().includes(q) ||
      inc.device_id.toLowerCase().includes(q) ||
      inc.fault_category.toLowerCase().includes(q) ||
      (inc.notes && inc.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incident Management</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Lifecycle tracking from triage and checklist verification through safe repair and recovery confirmation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Incident Report
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Incident ID, Workstation, or Fault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Lifecycle States</option>
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

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button
          onClick={loadIncidents}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Workstation / Lab</th>
                <th className="py-3 px-4">Fault Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Trigger Source</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Created Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && incidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading incident repository...
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {inc.incident_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{inc.device_id}</p>
                      <p className="text-[11px] text-slate-500">{inc.lab_name || 'Lab A'}</p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {inc.fault_category}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge type="severity" value={inc.severity} />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge type="incident_status" value={inc.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 capitalize">
                      {inc.source.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inc.assigned_to || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(inc.created_at).toLocaleDateString()}{' '}
                      {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${inc.incident_id}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded"
                      >
                        Triage →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Laboratory Incident Report</h3>
            <p className="text-xs text-slate-500">
              Log a student or technician reported computer issue into the incident tracking system.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workstation</label>
                <select
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  {devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} — {d.display_name} ({d.lab_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fault Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="Excessive CPU Usage">Excessive CPU Usage</option>
                  <option value="High Memory Utilization">High Memory Utilization</option>
                  <option value="Low Disk Space">Low Disk Space</option>
                  <option value="Network Connectivity Failure">Network Connectivity Failure</option>
                  <option value="Software / Application Errors">Software / Application Errors</option>
                  <option value="Service Failure">Service Failure</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician Notes</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Describe observed student symptom or error message..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Log Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
