from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Device Schemas ---
class DeviceBase(BaseModel):
    device_id: str
    display_name: str
    lab_name: str
    location: Optional[str] = None
    operating_system: Optional[str] = "Windows 11 Pro"
    agent_version: Optional[str] = "1.0.0"

class DeviceCreate(DeviceBase):
    demo_mode: Optional[bool] = False

class DeviceUpdate(BaseModel):
    display_name: Optional[str] = None
    lab_name: Optional[str] = None
    location: Optional[str] = None
    operating_system: Optional[str] = None
    is_active: Optional[bool] = None

class DeviceResponse(DeviceBase):
    id: int
    connection_status: str
    health_status: str
    last_heartbeat_at: Optional[datetime] = None
    enrolled_at: datetime
    is_active: bool
    demo_mode: bool
    current_cpu: Optional[float] = None
    current_ram: Optional[float] = None
    current_disk: Optional[float] = None
    active_warnings_count: int = 0
    active_incidents_count: int = 0

    class Config:
        from_attributes = True

class DeviceEnrollResponse(BaseModel):
    device_id: str
    enrollment_token: str
    message: str

# --- Metric Schemas ---
class MetricCreate(BaseModel):
    device_id: str
    cpu_usage_pct: float = Field(ge=0.0, le=100.0)
    ram_usage_pct: float = Field(ge=0.0, le=100.0)
    available_memory_mb: float = Field(ge=0.0)
    disk_usage_pct: float = Field(ge=0.0, le=100.0)
    free_disk_gb: float = Field(ge=0.0)
    network_status: Optional[str] = "connected"
    failed_connectivity_checks: Optional[int] = 0
    log_error_count: Optional[int] = 0
    source_type: Optional[str] = "live"

class MetricResponse(MetricCreate):
    id: int
    captured_at: datetime

    class Config:
        from_attributes = True

# --- Log Schemas ---
class LogCreate(BaseModel):
    device_id: str
    source: Optional[str] = "System"
    severity: Optional[str] = "INFO"
    message: str
    parsed_features: Optional[Dict[str, Any]] = None
    collection_source: Optional[str] = "agent"

class LogResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    source: str
    severity: str
    message: str
    parsed_features: Optional[str] = None
    collection_source: str

    class Config:
        from_attributes = True

# --- Early Warning Schemas ---
class EarlyWarningResponse(BaseModel):
    id: int
    device_id: str
    category: str
    severity: str
    trigger_type: str
    explanation: str
    supporting_evidence: Optional[str] = None
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    dismissal_reason: Optional[str] = None

    class Config:
        from_attributes = True

class EarlyWarningAction(BaseModel):
    action: str  # acknowledge, resolve, dismiss
    reason: Optional[str] = None

# --- Diagnostic Schemas ---
class DiagnosticRequest(BaseModel):
    device_id: str
    incident_id: Optional[int] = None

class DiagnosticReportResponse(BaseModel):
    id: int
    report_id: str
    device_id: str
    incident_id: Optional[int] = None
    model_version: str
    prediction: str
    model_score: float
    confidence_level: str
    evidence: Optional[str] = None
    likely_causes: Optional[str] = None
    missing_evidence: Optional[str] = None
    verification_checklist: Optional[str] = None
    safe_troubleshooting: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True

# --- Verification Schemas ---
class VerificationCreate(BaseModel):
    report_id: int
    technician_outcome: str  # confirmed, not_confirmed, inconclusive
    checks_completed: List[str]
    observations: str
    technician_identifier: Optional[str] = "tech_operator"

class VerificationResponse(BaseModel):
    id: int
    report_id: int
    technician_outcome: str
    checks_completed: Optional[str] = None
    observations: str
    confirmed_at: datetime
    technician_identifier: str

    class Config:
        from_attributes = True

# --- Repair Schemas ---
class RepairRecordCreate(BaseModel):
    incident_id: int
    procedure_identifier: str
    action_notes: str
    approval_metadata: Optional[Dict[str, Any]] = None
    outcome: Optional[str] = "successful"
    verification_result: Optional[str] = None

class RepairRecordResponse(BaseModel):
    id: int
    incident_id: int
    procedure_identifier: str
    action_notes: str
    approval_metadata: Optional[str] = None
    created_at: datetime
    verification_result: Optional[str] = None
    outcome: str

    class Config:
        from_attributes = True

class RecoveryVerifyRequest(BaseModel):
    incident_id: int
    technician_notes: str
    confirm_resolved: bool

# --- Incident Schemas ---
class IncidentCreate(BaseModel):
    device_id: str
    fault_category: str
    severity: Optional[str] = "medium"
    source: Optional[str] = "manual_report"
    notes: Optional[str] = None

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    final_outcome: Optional[str] = None

class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    device_id: str
    fault_category: str
    severity: str
    status: str
    source: str
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    final_outcome: Optional[str] = None
    notes: Optional[str] = None
    device_display_name: Optional[str] = None
    lab_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Knowledge Base Schemas ---
class KnowledgeDocumentResponse(BaseModel):
    id: int
    doc_id: str
    title: str
    fault_category: str
    symptoms: Optional[str] = None
    required_evidence: Optional[str] = None
    verification_procedure: Optional[str] = None
    safe_repair_instructions: Optional[str] = None
    risk_level: str
    post_repair_checks: Optional[str] = None
    source_reference: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Chat Schemas ---
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session"
    device_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sources: List[Dict[str, Any]] = []
    is_fallback: bool
    device_context_included: bool

# --- Dashboard & Reports Schemas ---
class DashboardSummary(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    healthy_devices: int
    investigating_devices: int
    critical_incidents: int
    active_early_warnings: int
    awaiting_confirmation_count: int
    awaiting_repair_verification_count: int
    demo_mode: bool

class DashboardTrends(BaseModel):
    health_distribution: Dict[str, int]
    incidents_by_category: Dict[str, int]
    incident_status_distribution: Dict[str, int]
    daily_incident_trend: List[Dict[str, Any]]
    device_telemetry_samples: List[Dict[str, Any]]
