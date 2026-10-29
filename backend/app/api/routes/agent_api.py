from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
import random

from pydantic import BaseModel
from app.db.session import get_db
from app.models.all_models import Device, MetricSnapshot, LogEvent
from app.schemas.schemas import MetricCreate, LogCreate
from app.core.security import verify_token, generate_agent_token, hash_token
from app.services.early_warning_engine import EarlyWarningEngine

router = APIRouter(prefix="", tags=["Agent Ingestion & Simulator"])

class QuickEnrollRequest(BaseModel):
    device_id: str
    display_name: Optional[str] = None
    lab_name: Optional[str] = "Lab A (CS Lab)"
    location: Optional[str] = None
    operating_system: Optional[str] = "Windows 11 Pro"

def utcnow():
    return datetime.now(timezone.utc)

def authenticate_agent(device_id: str, authorization: Optional[str], db: Session) -> Device:
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not registered.")

    # In demo mode, permit simulated telemetry without token
    if dev.demo_mode and not dev.agent_token_hash:
        return dev

    if not authorization:
        raise HTTPException(status_code=401, detail="Agent token missing.")

    token = authorization.replace("Bearer ", "").strip()
    if not dev.agent_token_hash or not verify_token(token, dev.agent_token_hash):
        raise HTTPException(status_code=403, detail="Invalid agent authentication token.")

    return dev

@router.post("/agent/quick-enroll")
def agent_quick_enroll(payload: QuickEnrollRequest, db: Session = Depends(get_db)):
    """
    Seamless 1-step client workstation onboarding:
    Finds existing device or automatically creates a new device entry,
    generates an authorized enrollment token, and returns credentials.
    """
    clean_id = payload.device_id.strip().upper()
    dev = db.query(Device).filter(Device.device_id == clean_id).first()

    if not dev:
        dev = Device(
            device_id=clean_id,
            display_name=payload.display_name or clean_id,
            lab_name=payload.lab_name or "Lab A (CS Lab)",
            location=payload.location or "Lab Workstation",
            operating_system=payload.operating_system or "Windows 11 Pro",
            connection_status="unknown",
            health_status="healthy",
            demo_mode=False,
            is_active=True
        )
        db.add(dev)
    else:
        if payload.display_name:
            dev.display_name = payload.display_name
        if payload.location:
            dev.location = payload.location
        dev.demo_mode = False

    plain_token = generate_agent_token()
    dev.agent_token_hash = hash_token(plain_token)
    db.commit()
    db.refresh(dev)

    return {
        "status": "enrolled",
        "device_id": dev.device_id,
        "token": plain_token,
        "display_name": dev.display_name,
        "lab_name": dev.lab_name,
        "operating_system": dev.operating_system,
        "message": f"Workstation '{dev.device_id}' connected and enrolled successfully."
    }

@router.post("/agent/heartbeat")
def agent_heartbeat(
    device_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    dev = authenticate_agent(device_id, authorization, db)
    dev.last_heartbeat_at = utcnow()
    dev.connection_status = "online"
    db.commit()
    return {"status": "ok", "device_id": dev.device_id, "timestamp": dev.last_heartbeat_at.isoformat()}

@router.post("/agent/metrics")
def ingest_agent_metrics(
    payload: MetricCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    dev = authenticate_agent(payload.device_id, authorization, db)
    dev.last_heartbeat_at = utcnow()
    dev.connection_status = "online"

    snap = MetricSnapshot(
        device_id=payload.device_id,
        captured_at=utcnow(),
        cpu_usage_pct=payload.cpu_usage_pct,
        ram_usage_pct=payload.ram_usage_pct,
        available_memory_mb=payload.available_memory_mb,
        disk_usage_pct=payload.disk_usage_pct,
        free_disk_gb=payload.free_disk_gb,
        network_status=payload.network_status or "connected",
        failed_connectivity_checks=payload.failed_connectivity_checks or 0,
        log_error_count=payload.log_error_count or 0,
        source_type=payload.source_type or "live"
    )
    db.add(snap)
    db.commit()

    # Automatically evaluate early warnings
    warnings = EarlyWarningEngine.evaluate_device(db, payload.device_id)

    return {
        "status": "ingested",
        "device_id": payload.device_id,
        "warnings_triggered": len(warnings)
    }

@router.post("/agent/logs")
def ingest_agent_logs(
    payload: LogCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    dev = authenticate_agent(payload.device_id, authorization, db)
    log_record = LogEvent(
        device_id=payload.device_id,
        timestamp=utcnow(),
        source=payload.source or "System",
        severity=payload.severity or "INFO",
        message=payload.message,
        collection_source=payload.collection_source or "agent"
    )
    db.add(log_record)
    db.commit()
    return {"status": "logged", "device_id": payload.device_id}

@router.post("/simulator/tick")
def simulator_tick(db: Session = Depends(get_db)):
    """
    Simulation pulse: Updates simulated demo devices with fresh realistic readings
    and heartbeats so live dashboard activity can be demonstrated interactively.
    """
    sim_devices = db.query(Device).filter(Device.demo_mode == True, Device.is_active == True).all()
    updated_count = 0

    for dev in sim_devices:
        if dev.device_id == "LAB-C-07":
            # Keep offline machine offline
            continue

        dev.last_heartbeat_at = utcnow()
        dev.connection_status = "online"

        # Slight realistic variance
        if dev.device_id == "LAB-A-03":
            # High CPU workstation
            cpu = round(random.uniform(91.0, 98.0), 1)
            ram = round(random.uniform(55.0, 65.0), 1)
        elif dev.device_id == "LAB-A-08":
            # High RAM workstation
            cpu = round(random.uniform(30.0, 50.0), 1)
            ram = round(random.uniform(92.0, 97.0), 1)
        elif dev.device_id == "LAB-B-04":
            # Low Disk workstation
            cpu = round(random.uniform(25.0, 45.0), 1)
            ram = 52.0
        elif dev.device_id == "LAB-C-02":
            # Network Drop workstation
            cpu = 22.0
            ram = 42.0
        else:
            cpu = round(random.uniform(15.0, 38.0), 1)
            ram = round(random.uniform(30.0, 58.0), 1)

        disk = 95.0 if dev.device_id == "LAB-B-04" else round(random.uniform(45.0, 65.0), 1)
        free_disk = 2.2 if dev.device_id == "LAB-B-04" else round(500 * (1 - disk / 100), 1)
        avail_ram = round(16384 * (1 - ram / 100), 1)
        pings = 4 if dev.device_id == "LAB-C-02" else 0
        net_st = "disconnected" if pings >= 4 else "connected"

        snap = MetricSnapshot(
            device_id=dev.device_id,
            captured_at=utcnow(),
            cpu_usage_pct=cpu,
            ram_usage_pct=ram,
            available_memory_mb=avail_ram,
            disk_usage_pct=disk,
            free_disk_gb=free_disk,
            network_status=net_st,
            failed_connectivity_checks=pings,
            log_error_count=0,
            source_type="simulated"
        )
        db.add(snap)
        updated_count += 1

    db.commit()
    return {"status": "success", "simulated_devices_ticked": updated_count}
