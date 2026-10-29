import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    display_name = Column(String(128), nullable=False)
    lab_name = Column(String(64), index=True, nullable=False)
    location = Column(String(128), nullable=True)
    operating_system = Column(String(64), default="Windows 11 Pro")
    agent_version = Column(String(32), default="1.0.0")
    connection_status = Column(String(32), default="unknown", index=True)  # online, offline, unknown
    health_status = Column(String(32), default="unknown", index=True)      # healthy, warning, critical, unknown
    last_heartbeat_at = Column(DateTime, nullable=True)
    enrolled_at = Column(DateTime, default=utcnow)
    is_active = Column(Boolean, default=True)
    demo_mode = Column(Boolean, default=True)
    agent_token_hash = Column(String(128), nullable=True)

    # Relationships
    metrics = relationship("MetricSnapshot", back_populates="device", cascade="all, delete-orphan", order_by="desc(MetricSnapshot.captured_at)")
    logs = relationship("LogEvent", back_populates="device", cascade="all, delete-orphan", order_by="desc(LogEvent.timestamp)")
    warnings = relationship("EarlyWarning", back_populates="device", cascade="all, delete-orphan", order_by="desc(EarlyWarning.created_at)")
    incidents = relationship("Incident", back_populates="device", cascade="all, delete-orphan", order_by="desc(Incident.created_at)")


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.device_id"), index=True, nullable=False)
    captured_at = Column(DateTime, default=utcnow, index=True)
    cpu_usage_pct = Column(Float, nullable=False)
    ram_usage_pct = Column(Float, nullable=False)
    available_memory_mb = Column(Float, nullable=False)
    disk_usage_pct = Column(Float, nullable=False)
    free_disk_gb = Column(Float, nullable=False)
    network_status = Column(String(32), default="connected")  # connected, degraded, disconnected
    failed_connectivity_checks = Column(Integer, default=0)
    log_error_count = Column(Integer, default=0)
    source_type = Column(String(32), default="simulated")     # live, simulated

    device = relationship("Device", back_populates="metrics")


class LogEvent(Base):
    __tablename__ = "log_events"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.device_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=utcnow, index=True)
    source = Column(String(64), default="System")
    severity = Column(String(32), default="INFO")            # INFO, WARNING, ERROR, CRITICAL
    message = Column(Text, nullable=False)
    parsed_features = Column(Text, nullable=True)            # JSON string
    collection_source = Column(String(64), default="agent")  # agent, syslog, simulator

    device = relationship("Device", back_populates="logs")


class EarlyWarning(Base):
    __tablename__ = "early_warnings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.device_id"), index=True, nullable=False)
    category = Column(String(64), nullable=False)            # High CPU, High RAM, Low Disk, Network Drop, Recurring Errors
    severity = Column(String(32), default="medium")          # low, medium, high, critical
    trigger_type = Column(String(64), default="threshold")   # threshold, trend, anomaly, repeated_error
    explanation = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=True)        # JSON string
    status = Column(String(32), default="new", index=True)   # new, acknowledged, investigating, resolved, dismissed
    created_at = Column(DateTime, default=utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    dismissal_reason = Column(Text, nullable=True)

    device = relationship("Device", back_populates="warnings")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(64), unique=True, index=True, nullable=False)
    device_id = Column(String(64), ForeignKey("devices.device_id"), index=True, nullable=False)
    fault_category = Column(String(64), nullable=False)
    severity = Column(String(32), default="medium")          # low, medium, high, critical
    status = Column(String(32), default="new", index=True)   # new, investigating, confirmed, fix_in_progress, resolved, not_confirmed, inconclusive, reopened, escalated
    source = Column(String(64), default="early_warning")     # early_warning, monitoring_rule, log_event, manual_report
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    assigned_to = Column(String(64), nullable=True)
    final_outcome = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    device = relationship("Device", back_populates="incidents")
    diagnostic_reports = relationship("DiagnosticReport", back_populates="incident")
    repair_records = relationship("RepairRecord", back_populates="incident")


class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(64), unique=True, index=True, nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.device_id"), index=True, nullable=False)
    model_version = Column(String(64), default="rules_and_ml_v1")
    prediction = Column(String(64), nullable=False)
    model_score = Column(Float, default=0.0)
    confidence_level = Column(String(32), default="moderate") # low, moderate, high, insufficient_evidence
    evidence = Column(Text, nullable=True)                    # JSON
    likely_causes = Column(Text, nullable=True)              # JSON
    missing_evidence = Column(Text, nullable=True)           # JSON
    verification_checklist = Column(Text, nullable=True)     # JSON
    safe_troubleshooting = Column(Text, nullable=True)       # JSON
    generated_at = Column(DateTime, default=utcnow, index=True)

    incident = relationship("Incident", back_populates="diagnostic_reports")
    verifications = relationship("VerificationRecord", back_populates="report")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("diagnostic_reports.id"), nullable=False, index=True)
    technician_outcome = Column(String(32), nullable=False)  # confirmed, not_confirmed, inconclusive
    checks_completed = Column(Text, nullable=True)           # JSON
    observations = Column(Text, nullable=False)
    confirmed_at = Column(DateTime, default=utcnow)
    technician_identifier = Column(String(64), default="tech_operator")

    report = relationship("DiagnosticReport", back_populates="verifications")


class RepairRecord(Base):
    __tablename__ = "repair_records"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    procedure_identifier = Column(String(64), nullable=False)
    action_notes = Column(Text, nullable=False)
    approval_metadata = Column(Text, nullable=True)          # JSON
    created_at = Column(DateTime, default=utcnow)
    verification_result = Column(String(64), nullable=True)
    outcome = Column(String(32), default="successful")       # successful, failed, partially_resolved

    incident = relationship("Incident", back_populates="repair_records")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(256), nullable=False)
    fault_category = Column(String(64), nullable=False, index=True)
    symptoms = Column(Text, nullable=True)                   # JSON
    required_evidence = Column(Text, nullable=True)          # JSON
    verification_procedure = Column(Text, nullable=True)     # JSON
    safe_repair_instructions = Column(Text, nullable=True)   # JSON
    risk_level = Column(String(32), default="Low")           # Low, Medium, High
    post_repair_checks = Column(Text, nullable=True)         # JSON
    source_reference = Column(String(256), nullable=True)
    updated_at = Column(DateTime, default=utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    device_id = Column(String(64), nullable=True, index=True)
    role = Column(String(32), nullable=False)                # user, assistant, system
    content = Column(Text, nullable=False)
    sources_used = Column(Text, nullable=True)               # JSON
    created_at = Column(DateTime, default=utcnow)
