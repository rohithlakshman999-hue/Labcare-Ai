import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Monitor,
  Search,
  Filter,
  Plus,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
  ArrowUpDown,
  Laptop,
  Edit3,
  Wifi
} from 'lucide-react';

import { api } from '../services/api';
import { Device } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { DemoBadge } from '../components/common/DemoBadge';
import { EditDeviceModal } from '../components/devices/EditDeviceModal';
import { QuickConnectModal } from '../components/devices/QuickConnectModal';

export const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Connect & Edit Modals State
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedLab, setSelectedLab] = useState(searchParams.get('lab') || '');
  const [selectedHealth, setSelectedHealth] = useState(searchParams.get('health') || '');
  const [selectedConn, setSelectedConn] = useState(searchParams.get('connection') || '');

  // Registration Modal State
  const [showModal, setShowModal] = useState(false);
  const [regDeviceId, setRegDeviceId] = useState('');
  const [regName, setRegName] = useState('');
  const [regLab, setRegLab] = useState('Lab A (CS Lab)');
  const [regLocation, setRegLocation] = useState('Row 1, Seat 1');
  const [regOs, setRegOs] = useState('Windows 11 Pro');
  const [submitting, setSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  const loadDevices = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await api.getDevices({
        search: search || undefined,
        lab: selectedLab || undefined,
        health: selectedHealth || undefined,
        connection: selectedConn || undefined,
      });
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const handleRefresh = () => loadDevices(true);
    window.addEventListener('labcare:refresh', handleRefresh);
    return () => window.removeEventListener('labcare:refresh', handleRefresh);
  }, [selectedLab, selectedHealth, selectedConn]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDevices();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDeviceId || !regName) {
      setRegError('Device ID and Workstation Name are required.');
      return;
    }
    try {
      setSubmitting(true);
      setRegError('');
      const newDev = await api.createDevice({
        device_id: regDeviceId,
        display_name: regName,
        lab_name: regLab,
        location: regLocation,
        operating_system: regOs,
        demo_mode: false
      });
      setShowModal(false);
      navigate(`/devices/${newDev.device_id}`);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const labs = ['Lab A (CS Lab)', 'Lab B (AI Lab)', 'Lab C (Cyber Lab)'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workstation Registry</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500">
            Monitor real-time heartbeats, CPU/RAM telemetry, and connectivity across all college laboratory seats.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickConnect(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition-all"
          >
            <Wifi className="w-4 h-4 text-indigo-600" />
            Connect Other PCs
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Register Device
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Device ID (e.g. LAB-A-03) or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </form>

        {/* Lab Filter */}
        <select
          value={selectedLab}
          onChange={(e) => setSelectedLab(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
        >
          <option value="">All Laboratories</option>
          {labs.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Health Filter */}
        <select
          value={selectedHealth}
          onChange={(e) => setSelectedHealth(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
        >
          <option value="">All Health States</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="unknown">Unknown</option>
        </select>

        {/* Connection Filter */}
        <select
          value={selectedConn}
          onChange={(e) => setSelectedConn(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
        >
          <option value="">All Connectivity</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        <button
          onClick={() => loadDevices(false)}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Filter
        </button>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Device ID & Name</th>
                <th className="py-3 px-4">Lab / Location</th>
                <th className="py-3 px-4">Operating System</th>
                <th className="py-3 px-4">Connection</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">CPU Usage</th>
                <th className="py-3 px-4">RAM Usage</th>
                <th className="py-3 px-4">Disk Usage</th>
                <th className="py-3 px-4">Heartbeat</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading && devices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading devices...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No matching workstations found for current filters.
                  </td>
                </tr>
              ) : (
                devices.map((dev) => (
                  <tr
                    key={dev.id}
                    onClick={() => navigate(`/devices/${dev.device_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{dev.device_id}</span>
                        {dev.demo_mode && <DemoBadge size="sm" text="SIM" />}
                      </div>
                      <p className="text-[11px] text-slate-500">{dev.display_name}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{dev.lab_name}</p>
                      <p className="text-[11px] text-slate-400">{dev.location || 'N/A'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dev.operating_system}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge type="connection" value={dev.connection_status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge type="health" value={dev.health_status} />
                    </td>

                    <td className="py-3.5 px-4">
                      {dev.current_cpu !== undefined && dev.current_cpu !== null ? (
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-700">
                            <span>{dev.current_cpu}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dev.current_cpu > 80 ? 'bg-rose-500' : dev.current_cpu > 60 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, dev.current_cpu)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {dev.current_ram !== undefined && dev.current_ram !== null ? (
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-700">
                            <span>{dev.current_ram}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dev.current_ram > 85 ? 'bg-rose-500' : dev.current_ram > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, dev.current_ram)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {dev.current_disk !== undefined && dev.current_disk !== null ? (
                        <span className={`font-semibold ${dev.current_disk > 90 ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {dev.current_disk}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {dev.last_heartbeat_at
                        ? new Date(dev.last_heartbeat_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'Never'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDevice(dev);
                          }}
                          title="Edit System Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/devices/${dev.device_id}`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Details →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Device Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Register Laboratory Workstation</h3>
              <p className="text-xs text-slate-500 mt-1">
                Add a new computer to the lab registry and configure an authorized monitoring agent.
              </p>
            </div>

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Device Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. LAB-A-16 or WS-CS-2026"
                  value={regDeviceId}
                  onChange={(e) => setRegDeviceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Workstation A16"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Laboratory</label>
                  <select
                    value={regLab}
                    onChange={(e) => setRegLab(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    {labs.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operating System</label>
                  <select
                    value={regOs}
                    onChange={(e) => setRegOs(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Windows 11 Pro">Windows 11 Pro</option>
                    <option value="Windows 10 Enterprise">Windows 10 Enterprise</option>
                    <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS</option>
                    <option value="Kali Linux 2024">Kali Linux 2024</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Row 4, Seat 2"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
                >
                  {submitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit System Details Modal */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          isOpen={!!editingDevice}
          onClose={() => setEditingDevice(null)}
          onUpdated={() => {
            loadDevices(true);
            window.dispatchEvent(new CustomEvent('labcare:refresh'));
          }}
          onDeleted={() => {
            loadDevices(true);
            window.dispatchEvent(new CustomEvent('labcare:refresh'));
          }}
        />
      )}
      {/* Quick Connect Client Workstations Modal */}
      {showQuickConnect && (
        <QuickConnectModal
          isOpen={showQuickConnect}
          onClose={() => setShowQuickConnect(false)}
        />
      )}
    </div>
  );
};
