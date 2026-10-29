from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.all_models import Device, MetricSnapshot, LogEvent, EarlyWarning, Incident
from app.schemas.schemas import (
    DeviceResponse, DeviceCreate, DeviceUpdate, DeviceEnrollResponse,
    MetricResponse, LogResponse
)
from app.core.security import generate_agent_token, hash_token
from app.core.config import settings

router = APIRouter(prefix="/devices", tags=["Devices"])

def update_device_connection(device: Device):
    if not device.last_heartbeat_at:
        device.connection_status = "unknown"
        return
    now = datetime.now(timezone.utc)
    hb_time = device.last_heartbeat_at
    if hb_time.tzinfo is None:
        hb_time = hb_time.replace(tzinfo=timezone.utc)
    diff_sec = (now - hb_time).total_seconds()
    device.connection_status = "online" if diff_sec <= settings.HEARTBEAT_TIMEOUT_SECONDS else "offline"

@router.get("", response_model=List[DeviceResponse])
def list_devices(
    search: Optional[str] = None,
    lab: Optional[str] = None,
    health: Optional[str] = None,
    connection: Optional[str] = None,
    os: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Device).filter(Device.is_active == True)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter((Device.device_id.ilike(search_filter)) | (Device.display_name.ilike(search_filter)))
    if lab:
        query = query.filter(Device.lab_name == lab)
    if health:
        query = query.filter(Device.health_status == health)
    if os:
        query = query.filter(Device.operating_system.ilike(f"%{os}%"))

    devices = query.all()
    results = []

    for dev in devices:
        update_device_connection(dev)
        latest_m = db.query(MetricSnapshot).filter(
            MetricSnapshot.device_id == dev.device_id
        ).order_by(MetricSnapshot.captured_at.desc()).first()

        w_cnt = db.query(EarlyWarning).filter(
            EarlyWarning.device_id == dev.device_id,
            EarlyWarning.status.in_(["new", "acknowledged", "investigating"])
        ).count()

        inc_cnt = db.query(Incident).filter(
            Incident.device_id == dev.device_id,
            Incident.status.notin_(["resolved", "not_confirmed"])
        ).count()

        results.append(DeviceResponse(
            id=dev.id,
            device_id=dev.device_id,
            display_name=dev.display_name,
            lab_name=dev.lab_name,
            location=dev.location,
            operating_system=dev.operating_system,
            agent_version=dev.agent_version,
            connection_status=dev.connection_status,
            health_status=dev.health_status,
            last_heartbeat_at=dev.last_heartbeat_at,
            enrolled_at=dev.enrolled_at,
            is_active=dev.is_active,
            demo_mode=dev.demo_mode,
            current_cpu=latest_m.cpu_usage_pct if latest_m else None,
            current_ram=latest_m.ram_usage_pct if latest_m else None,
            current_disk=latest_m.disk_usage_pct if latest_m else None,
            active_warnings_count=w_cnt,
            active_incidents_count=inc_cnt
        ))

    db.commit()
    return results

@router.post("", response_model=DeviceResponse)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    existing = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Device ID '{payload.device_id}' already registered.")

    dev = Device(
        device_id=payload.device_id.strip().upper(),
        display_name=payload.display_name.strip(),
        lab_name=payload.lab_name.strip(),
        location=payload.location,
        operating_system=payload.operating_system or "Windows 11 Pro",
        agent_version=payload.agent_version or "1.0.0",
        connection_status="unknown",
        health_status="unknown",
        is_active=True,
        demo_mode=payload.demo_mode or False
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)

    return DeviceResponse(
        id=dev.id,
        device_id=dev.device_id,
        display_name=dev.display_name,
        lab_name=dev.lab_name,
        location=dev.location,
        operating_system=dev.operating_system,
        agent_version=dev.agent_version,
        connection_status=dev.connection_status,
        health_status=dev.health_status,
        last_heartbeat_at=dev.last_heartbeat_at,
        enrolled_at=dev.enrolled_at,
        is_active=dev.is_active,
        demo_mode=dev.demo_mode,
        active_warnings_count=0,
        active_incidents_count=0
    )

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found.")

    update_device_connection(dev)
    db.commit()

    latest_m = db.query(MetricSnapshot).filter(
        MetricSnapshot.device_id == dev.device_id
    ).order_by(MetricSnapshot.captured_at.desc()).first()

    w_cnt = db.query(EarlyWarning).filter(
        EarlyWarning.device_id == dev.device_id,
        EarlyWarning.status.in_(["new", "acknowledged", "investigating"])
    ).count()

    inc_cnt = db.query(Incident).filter(
        Incident.device_id == dev.device_id,
        Incident.status.notin_(["resolved", "not_confirmed"])
    ).count()

    return DeviceResponse(
        id=dev.id,
        device_id=dev.device_id,
        display_name=dev.display_name,
        lab_name=dev.lab_name,
        location=dev.location,
        operating_system=dev.operating_system,
        agent_version=dev.agent_version,
        connection_status=dev.connection_status,
        health_status=dev.health_status,
        last_heartbeat_at=dev.last_heartbeat_at,
        enrolled_at=dev.enrolled_at,
        is_active=dev.is_active,
        demo_mode=dev.demo_mode,
        current_cpu=latest_m.cpu_usage_pct if latest_m else None,
        current_ram=latest_m.ram_usage_pct if latest_m else None,
        current_disk=latest_m.disk_usage_pct if latest_m else None,
        active_warnings_count=w_cnt,
        active_incidents_count=inc_cnt
    )

@router.patch("/{device_id}", response_model=DeviceResponse)
def update_device(device_id: str, payload: DeviceUpdate, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found.")

    if payload.display_name is not None:
        dev.display_name = payload.display_name
    if payload.lab_name is not None:
        dev.lab_name = payload.lab_name
    if payload.location is not None:
        dev.location = payload.location
    if payload.operating_system is not None:
        dev.operating_system = payload.operating_system
    if payload.is_active is not None:
        dev.is_active = payload.is_active

    db.commit()
    db.refresh(dev)
    return get_device(device_id, db)

@router.post("/{device_id}/enroll", response_model=DeviceEnrollResponse)
def enroll_agent(device_id: str, db: Session = Depends(get_db)):
    """Generate an enrollment token for an authorized monitoring agent."""
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found.")

    plain_token = generate_agent_token()
    dev.agent_token_hash = hash_token(plain_token)
    db.commit()

    return DeviceEnrollResponse(
        device_id=dev.device_id,
        enrollment_token=plain_token,
        message="Agent enrollment token created. Configure agent config.py or LABCARE_AGENT_TOKEN environment variable."
    )

@router.get("/{device_id}/metrics", response_model=List[MetricResponse])
def get_device_metrics(device_id: str, limit: int = 50, db: Session = Depends(get_db)):
    metrics = db.query(MetricSnapshot).filter(
        MetricSnapshot.device_id == device_id
    ).order_by(MetricSnapshot.captured_at.desc()).limit(limit).all()
    return list(reversed(metrics))

@router.get("/{device_id}/logs", response_model=List[LogResponse])
def get_device_logs(device_id: str, limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(LogEvent).filter(
        LogEvent.device_id == device_id
    ).order_by(LogEvent.timestamp.desc()).limit(limit).all()
    return logs
