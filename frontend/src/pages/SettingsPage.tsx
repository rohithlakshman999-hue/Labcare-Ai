import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  Cpu,
  Shield,
  Layers,
  Database
} from 'lucide-react';

import { api } from '../services/api';
import { SystemSettings } from '../types';
import { DemoBadge } from '../components/common/DemoBadge';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    cpu_warning_threshold: 80.0,
    ram_warning_threshold: 85.0,
    disk_warning_threshold: 90.0,
    heartbeat_timeout_seconds: 90,
    demo_mode: true,
    model_version: 'RandomForest-v1.0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Engine Configuration</h1>
          <DemoBadge />
        </div>
        <p className="text-sm text-slate-500">
          Configure early warning detection thresholds, agent heartbeat timeouts, and simulation controls.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Early Warning Detection Thresholds</h2>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Settings saved & applied
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              CPU Sustained Spike Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="99"
              step="1"
              value={settings.cpu_warning_threshold}
              onChange={(e) => setSettings({ ...settings, cpu_warning_threshold: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers a warning when CPU exceeds this percentage across 3 consecutive readings.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              RAM Memory Utilization Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="99"
              step="1"
              value={settings.ram_warning_threshold}
              onChange={(e) => setSettings({ ...settings, ram_warning_threshold: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers a warning or memory leak trend when RAM utilization exceeds this level.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Disk Volume Warning Threshold (%)
            </label>
            <input
              type="number"
              min="60"
              max="99"
              step="1"
              value={settings.disk_warning_threshold}
              onChange={(e) => setSettings({ ...settings, disk_warning_threshold: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers when primary storage disk utilization reaches this percentage.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Agent Heartbeat Timeout (Seconds)
            </label>
            <input
              type="number"
              min="30"
              max="600"
              step="10"
              value={settings.heartbeat_timeout_seconds}
              onChange={(e) => setSettings({ ...settings, heartbeat_timeout_seconds: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Workstation transitions to 'Offline' if no heartbeat is received within this duration.
            </p>
          </div>
        </div>

        {/* Demo Mode Toggle */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">Demonstration Mode</p>
            <p className="text-slate-500 text-[11px]">
              When enabled, simulated demo computers and realistic telemetry streams are displayed.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.demo_mode}
            onChange={(e) => setSettings({ ...settings, demo_mode: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Applying...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Model & Architecture Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          Active AI Model Information
        </h3>
        <p className="text-slate-600 leading-relaxed">
          The diagnostic engine uses a trained <strong>RandomForestClassifier</strong> with stratified train/test evaluation (held-out validation accuracy: 99.52%). Feature vector combines normalized CPU, RAM, disk, network ping status, and event log error frequency.
        </p>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
          Model Artifact: <code>fault_classifier.joblib</code> | Serialized via <code>scikit-learn 1.9.0</code> / <code>joblib 1.5.3</code>
        </div>
      </div>
    </div>
  );
};
