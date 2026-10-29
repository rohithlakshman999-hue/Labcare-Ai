import React, { useState } from 'react';
import {
  X,
  Wifi,
  Download,
  Copy,
  Check,
  Terminal,
  Laptop,
  CheckCircle,
  HelpCircle,
  FileCode
} from 'lucide-react';

interface QuickConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDeviceId?: string;
  defaultToken?: string;
}

export const QuickConnectModal: React.FC<QuickConnectModalProps> = ({
  isOpen,
  onClose,
  defaultDeviceId,
  defaultToken
}) => {
  if (!isOpen) return null;

  const currentHost = window.location.hostname || '10.10.198.220';
  const [serverIp, setServerIp] = useState(currentHost === 'localhost' || currentHost === '127.0.0.1' ? '10.10.198.220' : currentHost);
  const [deviceId, setDeviceId] = useState(defaultDeviceId || 'JB1');
  const [token, setToken] = useState(defaultToken || 'lca_agent_5eIqKK9_iSOHmHjY9kCfUGus42gm1eBK');
  const [interval, setInterval] = useState(5);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedAutoCmd, setCopiedAutoCmd] = useState(false);

  const backendUrl = `http://${serverIp}:8000/api`;

  const configJson = {
    server_ip: serverIp,
    backend_url: backendUrl,
    device_id: deviceId,
    token: token,
    interval: interval
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([JSON.stringify(configJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const manualCmd = `python connect.py --server ${serverIp} --device ${deviceId} ${token ? `--token ${token}` : ''}`.trim();
  const autoCmd = `python connect.py --server ${serverIp}`;

  const handleCopyManual = () => {
    navigator.clipboard.writeText(manualCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyAuto = () => {
    navigator.clipboard.writeText(autoCmd);
    setCopiedAutoCmd(true);
    setTimeout(() => setCopiedAutoCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Connect Client Workstations</h2>
              <p className="text-xs text-slate-500">
                Quick 1-step setup to connect other computers to this LabCare AI dashboard.
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

        <div className="p-6 space-y-5 text-xs">
          {/* Server IP Setting */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-blue-900 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-blue-600" />
                This Server Laptop's IP Address
              </label>
              <span className="text-[11px] font-mono text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                Port 8000
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value.trim())}
                placeholder="e.g. 10.10.198.220"
                className="flex-1 px-3 py-1.5 font-mono text-xs bg-white border border-blue-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-500 font-mono text-[11px]">/api</span>
            </div>
            <p className="text-[11px] text-blue-700">
              Ensure the other computers are on the same Wi-Fi network and this server's Wi-Fi profile is set to <strong>Private network</strong>.
            </p>
          </div>

          {/* Option 1: Download agent_config.json */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-xs">Option A: 1-Click Config File (Recommended)</h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Zero Typing
              </span>
            </div>

            <p className="text-slate-600 text-[11px]">
              Download this pre-configured <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">agent_config.json</code> file and place it inside the <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">agent/</code> folder on the client PC.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadConfig}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download agent_config.json
              </button>
              <span className="text-slate-400 text-[11px]">
                Then double-click <strong>start_agent.bat</strong> on that PC!
              </span>
            </div>
          </div>

          {/* Option 2: 1-Liner Connect Command */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px]">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-xs">Option B: Run Easy Connect Command</h3>
              </div>
            </div>

            <p className="text-slate-600 text-[11px]">
              On the other computer, open PowerShell in the <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">agent/</code> directory and run:
            </p>

            {/* Auto connect for ANY computer */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-700">For any computer (Auto-registers in 1 step):</p>
              <div className="flex items-center justify-between bg-slate-900 text-slate-100 font-mono text-[11px] px-3 py-2 rounded-lg">
                <code className="truncate mr-2">{autoCmd}</code>
                <button
                  onClick={handleCopyAuto}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] shrink-0 flex items-center gap-1 transition-colors"
                >
                  {copiedAutoCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedAutoCmd ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Direct connect for JB1 */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-700">For specific device ({deviceId}):</p>
              <div className="flex items-center justify-between bg-slate-900 text-slate-100 font-mono text-[11px] px-3 py-2 rounded-lg">
                <code className="truncate mr-2">{manualCmd}</code>
                <button
                  onClick={handleCopyManual}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] shrink-0 flex items-center gap-1 transition-colors"
                >
                  {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedCmd ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
