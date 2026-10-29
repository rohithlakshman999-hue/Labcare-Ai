import {
  Device, MetricSnapshot, LogEvent, EarlyWarning, Incident,
  DiagnosticReport, KnowledgeDoc, DashboardSummary, DashboardTrends,
  ChatResponse, SystemSettings
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || `http://${window.location.hostname || '127.0.0.1'}:8000/api`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const json = await res.json();
      if (json.detail) {
        errorMsg = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  getDashboardSummary: (): Promise<DashboardSummary> =>
    fetch(`${API_BASE}/dashboard/summary`).then(r => handleResponse<DashboardSummary>(r)),

  getDashboardTrends: (): Promise<DashboardTrends> =>
    fetch(`${API_BASE}/dashboard/trends`).then(r => handleResponse<DashboardTrends>(r)),

  // Devices
  getDevices: (params?: { search?: string; lab?: string; health?: string; connection?: string; os?: string }): Promise<Device[]> => {
    const url = new URL(`${API_BASE}/devices`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.append(k, v);
      });
    }
    return fetch(url.toString()).then(r => handleResponse<Device[]>(r));
  },

  getDevice: (deviceId: string): Promise<Device> =>
    fetch(`${API_BASE}/devices/${deviceId}`).then(r => handleResponse<Device>(r)),

  createDevice: (payload: { device_id: string; display_name: string; lab_name: string; location?: string; operating_system?: string; demo_mode?: boolean }): Promise<Device> =>
    fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<Device>(r)),

  enrollDevice: (deviceId: string): Promise<{ device_id: string; enrollment_token: string; message: string }> =>
    fetch(`${API_BASE}/devices/${deviceId}/enroll`, { method: 'POST' }).then(r => handleResponse<{ device_id: string; enrollment_token: string; message: string }>(r)),

  getDeviceMetrics: (deviceId: string): Promise<MetricSnapshot[]> =>
    fetch(`${API_BASE}/devices/${deviceId}/metrics`).then(r => handleResponse<MetricSnapshot[]>(r)),

  getDeviceLogs: (deviceId: string): Promise<LogEvent[]> =>
    fetch(`${API_BASE}/devices/${deviceId}/logs`).then(r => handleResponse<LogEvent[]>(r)),

  // Diagnostics
  runDiagnosis: (deviceId: string, incidentId?: number): Promise<DiagnosticReport> =>
    fetch(`${API_BASE}/devices/${deviceId}/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, incident_id: incidentId })
    }).then(r => handleResponse<DiagnosticReport>(r)),

  getDiagnosticReport: (reportId: string): Promise<DiagnosticReport> =>
    fetch(`${API_BASE}/diagnostics/${reportId}`).then(r => handleResponse<DiagnosticReport>(r)),

  submitVerification: (reportId: string, payload: {
    technician_outcome: string;
    checks_completed: string[];
    observations: string;
    technician_identifier?: string;
  }) => fetch(`${API_BASE}/diagnostics/${reportId}/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: 0, ...payload })
  }).then(r => handleResponse<any>(r)),

  recordRepair: (reportId: string, payload: {
    incident_id: number;
    procedure_identifier: string;
    action_notes: string;
    approval_metadata?: any;
    outcome?: string;
  }) => fetch(`${API_BASE}/diagnostics/${reportId}/repair-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => handleResponse<any>(r)),

  verifyRecovery: (reportId: string, payload: {
    incident_id: number;
    technician_notes: string;
    confirm_resolved: boolean;
  }): Promise<{ status: string; message: string; resolved_at?: string; latest_metrics?: any }> =>
    fetch(`${API_BASE}/diagnostics/${reportId}/verify-recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<{ status: string; message: string; resolved_at?: string; latest_metrics?: any }>(r)),

  // Early Warnings
  getWarnings: (params?: { status?: string; device_id?: string; category?: string }): Promise<EarlyWarning[]> => {
    const url = new URL(`${API_BASE}/warnings`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.append(k, v);
      });
    }
    return fetch(url.toString()).then(r => handleResponse<EarlyWarning[]>(r));
  },

  acknowledgeWarning: (id: number): Promise<EarlyWarning> =>
    fetch(`${API_BASE}/warnings/${id}/acknowledge`, { method: 'POST' }).then(r => handleResponse<EarlyWarning>(r)),

  resolveWarning: (id: number): Promise<EarlyWarning> =>
    fetch(`${API_BASE}/warnings/${id}/resolve`, { method: 'POST' }).then(r => handleResponse<EarlyWarning>(r)),

  dismissWarning: (id: number, reason: string): Promise<EarlyWarning> =>
    fetch(`${API_BASE}/warnings/${id}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss', reason })
    }).then(r => handleResponse<EarlyWarning>(r)),

  createIncidentFromWarning: (warningId: number): Promise<Incident> =>
    fetch(`${API_BASE}/warnings/${warningId}/create-incident`, { method: 'POST' }).then(r => handleResponse<Incident>(r)),

  // Incidents
  getIncidents: (params?: { status?: string; device_id?: string; fault_category?: string; severity?: string; lab?: string }): Promise<Incident[]> => {
    const url = new URL(`${API_BASE}/incidents`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.append(k, v);
      });
    }
    return fetch(url.toString()).then(r => handleResponse<Incident[]>(r));
  },

  getIncident: (incidentId: string): Promise<Incident> =>
    fetch(`${API_BASE}/incidents/${incidentId}`).then(r => handleResponse<Incident>(r)),

  createIncident: (payload: { device_id: string; fault_category: string; severity?: string; notes?: string }): Promise<Incident> =>
    fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<Incident>(r)),

  updateIncident: (incidentId: string, payload: { status?: string; assigned_to?: string; notes?: string; final_outcome?: string }): Promise<Incident> =>
    fetch(`${API_BASE}/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<Incident>(r)),

  // Knowledge Base
  getKnowledge: (query?: string, category?: string): Promise<KnowledgeDoc[]> => {
    const url = new URL(`${API_BASE}/knowledge`);
    if (query) url.searchParams.append('query', query);
    if (category) url.searchParams.append('category', category);
    return fetch(url.toString()).then(r => handleResponse<KnowledgeDoc[]>(r));
  },

  getKnowledgeDoc: (docId: string): Promise<KnowledgeDoc> =>
    fetch(`${API_BASE}/knowledge/${docId}`).then(r => handleResponse<KnowledgeDoc>(r)),

  // Chat
  sendMessage: (message: string, sessionId: string = 'default_session', deviceId?: string): Promise<ChatResponse> =>
    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, device_id: deviceId })
    }).then(r => handleResponse<ChatResponse>(r)),

  getChatHistory: (sessionId: string = 'default_session') =>
    fetch(`${API_BASE}/chat/history?session_id=${sessionId}`).then(r => handleResponse<any>(r)),

  clearChatHistory: (sessionId: string = 'default_session') =>
    fetch(`${API_BASE}/chat/history?session_id=${sessionId}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Reports
  getReportMetrics: () =>
    fetch(`${API_BASE}/reports/metrics`).then(r => handleResponse<any>(r)),

  getExportCsvUrl: () => `${API_BASE}/reports/export-csv`,

  // Settings
  getSettings: (): Promise<SystemSettings> =>
    fetch(`${API_BASE}/settings`).then(r => handleResponse<SystemSettings>(r)),

  updateSettings: (payload: SystemSettings): Promise<SystemSettings> =>
    fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<SystemSettings>(r)),

  // Simulator Pulse
  triggerSimulatorTick: () =>
    fetch(`${API_BASE}/simulator/tick`, { method: 'POST' }).then(r => handleResponse<any>(r))
};
