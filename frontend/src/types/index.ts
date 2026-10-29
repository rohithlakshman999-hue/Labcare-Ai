export interface Device {
  id: number;
  device_id: string;
  display_name: string;
  lab_name: string;
  location?: string;
  operating_system: string;
  agent_version: string;
  connection_status: 'online' | 'offline' | 'unknown';
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  last_heartbeat_at?: string;
  enrolled_at: string;
  is_active: boolean;
  demo_mode: boolean;
  current_cpu?: number;
  current_ram?: number;
  current_disk?: number;
  active_warnings_count: number;
  active_incidents_count: number;
}

export interface MetricSnapshot {
  id: number;
  device_id: string;
  captured_at: string;
  cpu_usage_pct: number;
  ram_usage_pct: number;
  available_memory_mb: number;
  disk_usage_pct: number;
  free_disk_gb: number;
  network_status: string;
  failed_connectivity_checks: number;
  log_error_count: number;
  source_type: string;
}

export interface LogEvent {
  id: number;
  device_id: string;
  timestamp: string;
  source: string;
  severity: string;
  message: string;
  collection_source: string;
}

export interface EarlyWarning {
  id: number;
  device_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_type: string;
  explanation: string;
  supporting_evidence?: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  dismissal_reason?: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  device_id: string;
  fault_category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'confirmed' | 'fix_in_progress' | 'resolved' | 'not_confirmed' | 'inconclusive' | 'reopened' | 'escalated';
  source: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  final_outcome?: string;
  notes?: string;
  device_display_name?: string;
  lab_name?: string;
}

export interface DiagnosticReport {
  id: number;
  report_id: string;
  device_id: string;
  incident_id?: number;
  model_version: string;
  prediction: string;
  model_score: number;
  confidence_level: 'low' | 'moderate' | 'high' | 'insufficient_evidence';
  evidence?: string;
  likely_causes?: string;
  missing_evidence?: string;
  verification_checklist?: string;
  safe_troubleshooting?: string;
  generated_at: string;
}

export interface KnowledgeDoc {
  id: number;
  doc_id: string;
  title: string;
  fault_category: string;
  symptoms?: string;
  required_evidence?: string;
  verification_procedure?: string;
  safe_repair_instructions?: string;
  risk_level: string;
  post_repair_checks?: string;
  source_reference?: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  healthy_devices: number;
  investigating_devices: number;
  critical_incidents: number;
  active_early_warnings: number;
  awaiting_confirmation_count: number;
  awaiting_repair_verification_count: number;
  demo_mode: boolean;
}

export interface DashboardTrends {
  health_distribution: Record<string, number>;
  incidents_by_category: Record<string, number>;
  incident_status_distribution: Record<string, number>;
  daily_incident_trend: Array<{ date: string; incidents: number }>;
  device_telemetry_samples: Array<{ device_id: string; time: string; cpu: number; ram: number }>;
}

export interface ChatResponse {
  reply: string;
  sources: Array<{ doc_id: string; title: string; source: string }>;
  is_fallback: boolean;
  device_context_included: boolean;
}

export interface SystemSettings {
  cpu_warning_threshold: number;
  ram_warning_threshold: number;
  disk_warning_threshold: number;
  heartbeat_timeout_seconds: number;
  demo_mode: boolean;
  model_version: string;
}
