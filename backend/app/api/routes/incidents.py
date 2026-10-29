from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.db.session import get_db
from app.models.all_models import Incident, Device, DiagnosticReport, RepairRecord
from app.schemas.schemas import IncidentResponse, IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])

def utcnow():
    return datetime.now(timezone.utc)

ALLOWED_STATUSES = [
    "new", "investigating", "confirmed", "fix_in_progress",
    "resolved", "not_confirmed", "inconclusive", "reopened", "escalated"
]

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    device_id: Optional[str] = None,
    fault_category: Optional[str] = None,
    severity: Optional[str] = None,
    lab: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident).join(Device, Incident.device_id == Device.device_id)

    if status:
        query = query.filter(Incident.status == status)
    if device_id:
        query = query.filter(Incident.device_id == device_id)
    if fault_category:
        query = query.filter(Incident.fault_category == fault_category)
    if severity:
        query = query.filter(Incident.severity == severity)
    if lab:
        query = query.filter(Device.lab_name == lab)

    incidents = query.order_by(Incident.created_at.desc()).all()
    results = []
    for inc in incidents:
        results.append(IncidentResponse(
            id=inc.id,
            incident_id=inc.incident_id,
            device_id=inc.device_id,
            fault_category=inc.fault_category,
            severity=inc.severity,
            status=inc.status,
            source=inc.source,
            created_at=inc.created_at,
            updated_at=inc.updated_at,
            assigned_to=inc.assigned_to,
            final_outcome=inc.final_outcome,
            notes=inc.notes,
            device_display_name=inc.device.display_name if inc.device else inc.device_id,
            lab_name=inc.device.lab_name if inc.device else "Unknown"
        ))
    return results

@router.post("", response_model=IncidentResponse)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail=f"Device '{payload.device_id}' not found.")

    inc_id = f"INC-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    inc = Incident(
        incident_id=inc_id,
        device_id=payload.device_id,
        fault_category=payload.fault_category,
        severity=payload.severity or "medium",
        status="new",
        source=payload.source or "manual_report",
        created_at=utcnow(),
        notes=payload.notes
    )
    db.add(inc)

    # Update device health
    if payload.severity == "critical":
        dev.health_status = "critical"
    elif dev.health_status == "healthy":
        dev.health_status = "warning"

    db.commit()
    db.refresh(inc)

    return IncidentResponse(
        id=inc.id,
        incident_id=inc.incident_id,
        device_id=inc.device_id,
        fault_category=inc.fault_category,
        severity=inc.severity,
        status=inc.status,
        source=inc.source,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        assigned_to=inc.assigned_to,
        final_outcome=inc.final_outcome,
        notes=inc.notes,
        device_display_name=dev.display_name,
        lab_name=dev.lab_name
    )

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(
        (Incident.incident_id == incident_id) | (Incident.id == int(incident_id) if incident_id.isdigit() else False)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    return IncidentResponse(
        id=inc.id,
        incident_id=inc.incident_id,
        device_id=inc.device_id,
        fault_category=inc.fault_category,
        severity=inc.severity,
        status=inc.status,
        source=inc.source,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        assigned_to=inc.assigned_to,
        final_outcome=inc.final_outcome,
        notes=inc.notes,
        device_display_name=inc.device.display_name if inc.device else inc.device_id,
        lab_name=inc.device.lab_name if inc.device else "Unknown"
    )

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(
        (Incident.incident_id == incident_id) | (Incident.id == int(incident_id) if incident_id.isdigit() else False)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if payload.status:
        if payload.status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status '{payload.status}'. Allowed: {ALLOWED_STATUSES}")
        inc.status = payload.status

    if payload.assigned_to is not None:
        inc.assigned_to = payload.assigned_to
    if payload.notes is not None:
        inc.notes = payload.notes
    if payload.final_outcome is not None:
        inc.final_outcome = payload.final_outcome

    inc.updated_at = utcnow()
    db.commit()
    db.refresh(inc)

    return get_incident(incident_id, db)
