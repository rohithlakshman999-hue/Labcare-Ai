from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.db.session import get_db
from app.models.all_models import EarlyWarning, Incident, Device
from app.schemas.schemas import EarlyWarningResponse, EarlyWarningAction, IncidentResponse

router = APIRouter(prefix="/warnings", tags=["Early Warnings"])

def utcnow():
    return datetime.now(timezone.utc)

@router.get("", response_model=List[EarlyWarningResponse])
def list_warnings(
    status: Optional[str] = None,
    device_id: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EarlyWarning).order_by(EarlyWarning.created_at.desc())
    if status:
        query = query.filter(EarlyWarning.status == status)
    if device_id:
        query = query.filter(EarlyWarning.device_id == device_id)
    if category:
        query = query.filter(EarlyWarning.category == category)
    return query.all()

@router.post("/{warning_id}/acknowledge", response_model=EarlyWarningResponse)
def acknowledge_warning(warning_id: int, db: Session = Depends(get_db)):
    w = db.query(EarlyWarning).filter(EarlyWarning.id == warning_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Early warning not found.")
    w.status = "acknowledged"
    w.acknowledged_at = utcnow()
    db.commit()
    db.refresh(w)
    return w

@router.post("/{warning_id}/resolve", response_model=EarlyWarningResponse)
def resolve_warning(warning_id: int, db: Session = Depends(get_db)):
    w = db.query(EarlyWarning).filter(EarlyWarning.id == warning_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Early warning not found.")
    w.status = "resolved"
    w.resolved_at = utcnow()
    db.commit()
    db.refresh(w)
    return w

@router.post("/{warning_id}/dismiss", response_model=EarlyWarningResponse)
def dismiss_warning(warning_id: int, payload: EarlyWarningAction, db: Session = Depends(get_db)):
    w = db.query(EarlyWarning).filter(EarlyWarning.id == warning_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Early warning not found.")
    w.status = "dismissed"
    w.resolved_at = utcnow()
    w.dismissal_reason = payload.reason or "Dismissed by technician as non-critical or expected workload."
    db.commit()
    db.refresh(w)
    return w

@router.post("/{warning_id}/create-incident", response_model=IncidentResponse)
def create_incident_from_warning(warning_id: int, db: Session = Depends(get_db)):
    w = db.query(EarlyWarning).filter(EarlyWarning.id == warning_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Early warning not found.")

    dev = db.query(Device).filter(Device.device_id == w.device_id).first()
    inc_id = f"INC-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"

    inc = Incident(
        incident_id=inc_id,
        device_id=w.device_id,
        fault_category=w.category,
        severity=w.severity,
        status="new",
        source="early_warning",
        created_at=utcnow(),
        notes=f"Escalated from Early Warning: {w.explanation}"
    )
    db.add(inc)
    w.status = "investigating"
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
        device_display_name=dev.display_name if dev else inc.device_id,
        lab_name=dev.lab_name if dev else "Unknown Lab"
    )
