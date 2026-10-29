from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.all_models import DiagnosticReport, VerificationRecord, RepairRecord, Incident, Device, MetricSnapshot
from app.schemas.schemas import (
    DiagnosticReportResponse, DiagnosticRequest,
    VerificationCreate, VerificationResponse,
    RepairRecordCreate, RepairRecordResponse,
    RecoveryVerifyRequest
)
from app.services.diagnostic_engine import DiagnosticEngine

router = APIRouter(prefix="", tags=["Diagnostics"])

def utcnow():
    return datetime.now(timezone.utc)

@router.post("/devices/{device_id}/diagnose", response_model=DiagnosticReportResponse)
def run_device_diagnosis(device_id: str, payload: Optional[DiagnosticRequest] = None, db: Session = Depends(get_db)):
    incident_id = payload.incident_id if payload else None
    try:
        report = DiagnosticEngine.run_diagnosis(db, device_id, incident_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/diagnostics/{report_id}", response_model=DiagnosticReportResponse)
def get_diagnostic_report(report_id: str, db: Session = Depends(get_db)):
    rpt = db.query(DiagnosticReport).filter(DiagnosticReport.report_id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Diagnostic report not found.")
    return rpt

@router.post("/diagnostics/{report_id}/verification", response_model=VerificationResponse)
def record_verification(report_id: str, payload: VerificationCreate, db: Session = Depends(get_db)):
    rpt = db.query(DiagnosticReport).filter(DiagnosticReport.report_id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Diagnostic report not found.")

    valid_outcomes = ["confirmed", "not_confirmed", "inconclusive"]
    if payload.technician_outcome not in valid_outcomes:
        raise HTTPException(status_code=400, detail=f"Invalid outcome. Must be one of {valid_outcomes}")

    v_record = VerificationRecord(
        report_id=rpt.id,
        technician_outcome=payload.technician_outcome,
        checks_completed=json.dumps(payload.checks_completed),
        observations=payload.observations,
        confirmed_at=utcnow(),
        technician_identifier=payload.technician_identifier or "tech_operator"
    )
    db.add(v_record)

    # Update associated incident status
    if rpt.incident_id:
        inc = db.query(Incident).filter(Incident.id == rpt.incident_id).first()
        if inc:
            if payload.technician_outcome == "confirmed":
                inc.status = "confirmed"
            elif payload.technician_outcome == "not_confirmed":
                inc.status = "not_confirmed"
                inc.final_outcome = f"Diagnosis not confirmed by technician: {payload.observations}"
            elif payload.technician_outcome == "inconclusive":
                inc.status = "inconclusive"
            inc.updated_at = utcnow()

    db.commit()
    db.refresh(v_record)
    return v_record

@router.post("/diagnostics/{report_id}/repair-records", response_model=RepairRecordResponse)
def record_repair(report_id: str, payload: RepairRecordCreate, db: Session = Depends(get_db)):
    rpt = db.query(DiagnosticReport).filter(DiagnosticReport.report_id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Diagnostic report not found.")

    repair = RepairRecord(
        incident_id=payload.incident_id,
        procedure_identifier=payload.procedure_identifier,
        action_notes=payload.action_notes,
        approval_metadata=json.dumps(payload.approval_metadata or {}),
        created_at=utcnow(),
        verification_result=payload.verification_result or "Repair procedure logged. Ready for recovery verification.",
        outcome=payload.outcome or "successful"
    )
    db.add(repair)

    inc = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if inc:
        inc.status = "fix_in_progress"
        inc.updated_at = utcnow()

    db.commit()
    db.refresh(repair)
    return repair

@router.post("/diagnostics/{report_id}/verify-recovery")
def verify_recovery(report_id: str, payload: RecoveryVerifyRequest, db: Session = Depends(get_db)):
    rpt = db.query(DiagnosticReport).filter(DiagnosticReport.report_id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Diagnostic report not found.")

    inc = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Fetch latest fresh metrics to compare against baseline
    latest_m = db.query(MetricSnapshot).filter(
        MetricSnapshot.device_id == rpt.device_id
    ).order_by(MetricSnapshot.captured_at.desc()).first()

    if not payload.confirm_resolved:
        inc.status = "reopened"
        inc.notes = f"Recovery check failed or marked incomplete: {payload.technician_notes}"
        db.commit()
        return {
            "status": "reopened",
            "message": "Recovery incomplete. Incident marked as reopened for further inspection."
        }

    # Incident successfully verified and resolved
    inc.status = "resolved"
    inc.final_outcome = f"Verified recovered by technician. Notes: {payload.technician_notes}"
    inc.updated_at = utcnow()

    # Reset device health to healthy if no other active critical incidents
    other_issues = db.query(Incident).filter(
        Incident.device_id == rpt.device_id,
        Incident.id != inc.id,
        Incident.status.notin_(["resolved", "not_confirmed"])
    ).count()

    dev = db.query(Device).filter(Device.device_id == rpt.device_id).first()
    if dev and other_issues == 0:
        dev.health_status = "healthy"

    db.commit()

    return {
        "status": "resolved",
        "message": f"Incident {inc.incident_id} successfully verified and closed.",
        "resolved_at": inc.updated_at.isoformat(),
        "latest_metrics": {
            "cpu_pct": latest_m.cpu_usage_pct if latest_m else None,
            "ram_pct": latest_m.ram_usage_pct if latest_m else None,
            "disk_pct": latest_m.disk_usage_pct if latest_m else None
        }
    }
