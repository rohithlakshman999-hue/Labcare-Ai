from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

from app.db.session import get_db
from app.models.all_models import Device, Incident, EarlyWarning, MetricSnapshot
from app.schemas.schemas import DashboardSummary, DashboardTrends
from app.core.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def check_device_heartbeat_status(device: Device) -> str:
    """Evaluate device online/offline status based on last heartbeat time."""
    if not device.last_heartbeat_at:
        return "unknown"
    
    # Ensure timezone aware comparison
    now = datetime.now(timezone.utc)
    hb_time = device.last_heartbeat_at
    if hb_time.tzinfo is None:
        hb_time = hb_time.replace(tzinfo=timezone.utc)
        
    diff_sec = (now - hb_time).total_seconds()
    if diff_sec <= settings.HEARTBEAT_TIMEOUT_SECONDS:
        return "online"
    return "offline"

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard counts derived directly from stored database records.
    Never hardcodes values independently of records.
    """
    devices = db.query(Device).filter(Device.is_active == True).all()
    
    total_devices = len(devices)
    online_count = 0
    offline_count = 0
    healthy_count = 0
    investigating_count = 0

    for dev in devices:
        live_status = check_device_heartbeat_status(dev)
        if live_status != dev.connection_status:
            dev.connection_status = live_status
            db.commit()

        if dev.connection_status == "online":
            online_count += 1
        elif dev.connection_status == "offline":
            offline_count += 1

        if dev.health_status == "healthy":
            healthy_count += 1
        elif dev.health_status in ["warning", "critical"]:
            investigating_count += 1

    critical_incidents = db.query(Incident).filter(
        Incident.severity == "critical",
        Incident.status.notin_(["resolved", "not_confirmed"])
    ).count()

    active_warnings = db.query(EarlyWarning).filter(
        EarlyWarning.status.in_(["new", "acknowledged", "investigating"])
    ).count()

    awaiting_confirmation = db.query(Incident).filter(
        Incident.status.in_(["new", "investigating"])
    ).count()

    awaiting_repair = db.query(Incident).filter(
        Incident.status.in_(["confirmed", "fix_in_progress"])
    ).count()

    return DashboardSummary(
        total_devices=total_devices,
        online_devices=online_count,
        offline_devices=offline_count,
        healthy_devices=healthy_count,
        investigating_devices=investigating_count,
        critical_incidents=critical_incidents,
        active_early_warnings=active_warnings,
        awaiting_confirmation_count=awaiting_confirmation,
        awaiting_repair_verification_count=awaiting_repair,
        demo_mode=settings.DEMO_MODE
    )

@router.get("/trends", response_model=DashboardTrends)
def get_dashboard_trends(db: Session = Depends(get_db)):
    """
    Get dynamic distributions and trends for health, incident categories, and device CPU/RAM.
    """
    devices = db.query(Device).filter(Device.is_active == True).all()
    health_dist = {"healthy": 0, "warning": 0, "critical": 0, "unknown": 0}
    for d in devices:
        health_dist[d.health_status] = health_dist.get(d.health_status, 0) + 1

    # Incidents by Category
    incidents = db.query(Incident).all()
    by_cat = {}
    by_status = {}
    for inc in incidents:
        by_cat[inc.fault_category] = by_cat.get(inc.fault_category, 0) + 1
        by_status[inc.status] = by_status.get(inc.status, 0) + 1

    # Trend over past 7 days
    now = datetime.now(timezone.utc)
    daily_trends = []
    for day_offset in range(6, -1, -1):
        target_date = (now - timedelta(days=day_offset)).date()
        cnt = db.query(Incident).filter(
            func.date(Incident.created_at) == target_date.isoformat()
        ).count()
        daily_trends.append({
            "date": target_date.strftime("%b %d"),
            "incidents": cnt
        })

    # Sample telemetry from top active machines for CPU/RAM trend charts
    samples = []
    sample_dev_ids = ["LAB-A-01", "LAB-A-03", "LAB-A-08", "LAB-B-04"]
    for dev_id in sample_dev_ids:
        snaps = db.query(MetricSnapshot).filter(
            MetricSnapshot.device_id == dev_id
        ).order_by(MetricSnapshot.captured_at.desc()).limit(10).all()
        for s in reversed(snaps):
            samples.append({
                "device_id": dev_id,
                "time": s.captured_at.strftime("%H:%M"),
                "cpu": s.cpu_usage_pct,
                "ram": s.ram_usage_pct
            })

    return DashboardTrends(
        health_distribution=health_dist,
        incidents_by_category=by_cat,
        incident_status_distribution=by_status,
        daily_incident_trend=daily_trends,
        device_telemetry_samples=samples
    )
