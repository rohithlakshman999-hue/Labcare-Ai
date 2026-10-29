import React, { useState } from 'react';
import {
  X,
  Laptop,
  Lock,
  Save,
  CheckCircle,
  AlertTriangle,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { Device } from '../../types';
import { api } from '../../services/api';

interface EditDeviceModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: Device) => void;
  onDeleted?: (deviceId: string) => void;
}

const LAB_OPTIONS = [
  'Lab A (CS Lab)',
  'Lab B (AI Lab)',
  'Lab C (Cyber Lab)',
  'Lab D (IoT & Networks Lab)',
  'Custom'
];

const OS_OPTIONS = [
  'Windows 11 Pro',
  'Windows 10 Pro',
  'Ubuntu 22.04 LTS',
  'Ubuntu 24.04 LTS',
  'Debian 12',
  'macOS Sonoma',
  'Custom'
];

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onUpdated,
  onDeleted
}) => {
  if (!isOpen) return null;

  const [displayName, setDisplayName] = useState(device.display_name);
  const [labName, setLabName] = useState(
    LAB_OPTIONS.includes(device.lab_name) ? device.lab_name : 'Custom'
  );
  const [customLab, setCustomLab] = useState(
    LAB_OPTIONS.includes(device.lab_name) ? '' : device.lab_name
  );

  const [location, setLocation] = useState(device.location || '');
  const [operatingSystem, setOperatingSystem] = useState(
    OS_OPTIONS.includes(device.operating_system) ? device.operating_system : 'Custom'
  );
  const [customOs, setCustomOs] = useState(
    OS_OPTIONS.includes(device.operating_system) ? '' : device.operating_system
  );

  const [demoMode, setDemoMode] = useState(device.demo_mode);
  const [isActive, setIsActive] = useState(device.is_active);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const resolvedLab = labName === 'Custom' ? customLab.trim() : labName;
    const resolvedOs = operatingSystem === 'Custom' ? customOs.trim() : operatingSystem;

    if (!displayName.trim()) {
      setError('Workstation display name is required.');
      return;
    }

    if (!resolvedLab) {
      setError('Laboratory name is required.');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateDevice(device.device_id, {
        display_name: displayName.trim(),
        lab_name: resolvedLab,
        location: location.trim() || undefined,
        operating_system: resolvedOs || 'Windows 11 Pro',
        demo_mode: demoMode,
        is_active: isActive
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdated(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update system details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError('');
      await api.deleteDevice(device.device_id);
      if (onDeleted) {
        onDeleted(device.device_id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workstation.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit System Details</h2>
              <p className="text-xs text-slate-500">
                Workstation <span className="font-mono font-semibold text-slate-700">{device.device_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>System details updated successfully!</span>
            </div>
          )}

          {/* Device ID (Immutable Hardware ID) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Hardware Identifier (Device ID)</span>
              <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Read-only ID
              </span>
            </label>
            <input
              type="text"
              value={device.device_id}
              disabled
              className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workstation Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Lab A - PC 01 or Dell OptiPlex"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Laboratory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Laboratory <span className="text-rose-500">*</span>
              </label>
              <select
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {LAB_OPTIONS.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
            </div>

            {/* Desk / Physical Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desk / Seat Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Row 1, Seat 3"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {labName === 'Custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Laboratory Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customLab}
                onChange={(e) => setCustomLab(e.target.value)}
                placeholder="Enter custom lab name"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          {/* Operating System */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operating System
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={operatingSystem}
                onChange={(e) => setOperatingSystem(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {OS_OPTIONS.map((os) => (
                  <option key={os} value={os}>
                    {os}
                  </option>
                ))}
              </select>
              {operatingSystem === 'Custom' && (
                <input
                  type="text"
                  required
                  value={customOs}
                  onChange={(e) => setCustomOs(e.target.value)}
                  placeholder="e.g. RedHat Enterprise Linux"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Operation Mode & Status */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-800">Telemetry Source & Lifecycle</p>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-700">Physical Workstation Mode</p>
                <p className="text-[11px] text-slate-400">
                  {demoMode ? 'Currently simulated telemetry' : 'Real-time telemetry from physical agent'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!demoMode}
                  onChange={(e) => setDemoMode(!e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2.5">
              <div>
                <p className="font-semibold text-slate-700">Station Active Status</p>
                <p className="text-[11px] text-slate-400">
                  {isActive ? 'Active and visible in lab monitoring' : 'Decommissioned / Maintenance hold'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-2 border-t border-slate-100">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Decommission / Delete Workstation
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-rose-900">
                  Are you sure you want to remove {device.device_id}?
                </p>
                <p className="text-[11px] text-rose-700">
                  This permanently removes telemetry history and diagnostic logs for this seat.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Remove'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
