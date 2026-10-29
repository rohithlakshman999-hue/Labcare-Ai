import React from 'react';
import { RefreshCw, Bell, Search, ShieldAlert, FlaskConical, Radio } from 'lucide-react';

interface Props {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  activeWarningsCount?: number;
  livePolling?: boolean;
  onToggleLivePolling?: () => void;
}

export const Topbar: React.FC<Props> = ({
  onRefresh,
  isRefreshing = false,
  activeWarningsCount = 0,
  livePolling = true,
  onToggleLivePolling
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
      {/* Left: Demo Mode Notice & Real-time status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-xs">
          <FlaskConical className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>DEMO / HYBRID MODE</span>
          <span className="text-amber-600 font-normal hidden sm:inline">
            — Real client agents & simulated lab telemetry coexist seamlessly.
          </span>
        </div>

        {/* Live Real-Time Auto-Polling Toggle */}
        <button
          onClick={onToggleLivePolling}
          title={livePolling ? "Auto-refreshing every 5 seconds. Click to pause." : "Auto-refresh paused. Click to enable real-time updates."}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
            livePolling
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-100 text-slate-600 border-slate-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${livePolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
          <span>{livePolling ? 'LIVE (5s)' : 'PAUSED'}</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Warning Indicator */}
        {activeWarningsCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{activeWarningsCount} Early Warnings</span>
          </div>
        )}

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Dashboard Data Now"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        {/* Technician Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
            IT
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Lab Technician</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Campus IT Ops</p>
          </div>
        </div>
      </div>
    </header>
  );
};
