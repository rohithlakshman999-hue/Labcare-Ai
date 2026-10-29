import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  AlertTriangle,
  Stethoscope,
  LifeBuoy,
  MessageSquare,
  BookOpen,
  BarChart3,
  Settings,
  Activity,
  Zap,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';

const navItems = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Devices', to: '/devices', icon: Monitor },
  { name: 'Early Warnings', to: '/warnings', icon: AlertTriangle },
  { name: 'Diagnostic Center', to: '/diagnostics', icon: Stethoscope },
  { name: 'Incidents', to: '/incidents', icon: LifeBuoy },
  { name: 'AI Troubleshooting Chat', to: '/chat', icon: MessageSquare },
  { name: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
  { name: 'Reports', to: '/reports', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [ticking, setTicking] = useState(false);
  const [tickSuccess, setTickSuccess] = useState(false);

  const handleSimulateTick = async () => {
    try {
      setTicking(true);
      await api.triggerSimulatorTick();
      setTickSuccess(true);
      setTimeout(() => setTickSuccess(false), 2000);
      window.dispatchEvent(new CustomEvent('labcare:refresh'));
    } catch (err) {
      console.error('Failed to trigger simulator tick:', err);
    } finally {
      setTicking(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950">
        <div className="p-2 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
            LabCare <span className="text-blue-400 font-extrabold">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            College Lab IT Monitor
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Simulator Pulse Panel */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Lab Simulator
          </span>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
            ACTIVE
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          Inject fresh telemetry & heartbeats across all demo workstations.
        </p>
        <button
          onClick={handleSimulateTick}
          disabled={ticking}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
            tickSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
          }`}
        >
          {tickSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pulse Sent!
            </>
          ) : (
            <>
              <Cpu className={`w-3.5 h-3.5 ${ticking ? 'animate-spin' : ''}`} />
              {ticking ? 'Simulating...' : 'Pulse Telemetry'}
            </>
          )}
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>LabCare v1.0.0</span>
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Engine Online
        </span>
      </div>
    </aside>
  );
};
