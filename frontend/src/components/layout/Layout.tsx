import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { api } from '../../services/api';

export const Layout: React.FC = () => {
  const [activeWarningsCount, setActiveWarningsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [livePolling, setLivePolling] = useState(true);

  const fetchGlobalAlerts = async () => {
    try {
      setRefreshing(true);
      const warnings = await api.getWarnings({ status: 'new' });
      setActiveWarningsCount(warnings.length);
    } catch (e) {
      console.error('Failed to load active warnings count:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalAlerts();
    const handleRefresh = () => fetchGlobalAlerts();
    window.addEventListener('labcare:refresh', handleRefresh);
    return () => window.removeEventListener('labcare:refresh', handleRefresh);
  }, []);

  // Live Auto-Polling Interval (every 5 seconds when active)
  useEffect(() => {
    if (!livePolling) return;
    const interval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('labcare:refresh'));
    }, 5000);
    return () => clearInterval(interval);
  }, [livePolling]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onRefresh={fetchGlobalAlerts}
          isRefreshing={refreshing}
          activeWarningsCount={activeWarningsCount}
          livePolling={livePolling}
          onToggleLivePolling={() => setLivePolling(!livePolling)}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
