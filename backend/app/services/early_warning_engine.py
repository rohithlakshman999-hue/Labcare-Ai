import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.all_models import Device, MetricSnapshot, EarlyWarning, LogEvent
from app.core.config import settings

def utcnow():
    return datetime.now(timezone.utc)

class EarlyWarningEngine:
    @staticmethod
    def evaluate_device(db: Session, device_id: str) -> List[EarlyWarning]:
        """
        Evaluate device telemetry and recent logs for early warning signs.
        Implements cooldown and deduplication to avoid alert fatigue.
        """
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device or not device.is_active:
            return []

        # Fetch last 10 snapshots (ordered descending)
        recent_metrics = db.query(MetricSnapshot).filter(
            MetricSnapshot.device_id == device_id
        ).order_by(MetricSnapshot.captured_at.desc()).limit(10).all()

        if not recent_metrics:
            return []

        latest = recent_metrics[0]
        new_warnings = []

        # Helper to check active warning cooldown
        def has_active_warning(category: str) -> bool:
            existing = db.query(EarlyWarning).filter(
                EarlyWarning.device_id == device_id,
                EarlyWarning.category == category,
                EarlyWarning.status.in_(["new", "acknowledged", "investigating"])
            ).first()
            return existing is not None

        # 1. Sustained High CPU Usage (at least 3 consecutive snapshots >= threshold)
        if len(recent_metrics) >= 3:
            high_cpu_count = sum(1 for m in recent_metrics[:3] if m.cpu_usage_pct >= settings.CPU_WARNING_THRESHOLD)
            if high_cpu_count >= 3 and not has_active_warning("High CPU"):
                avg_cpu = sum(m.cpu_usage_pct for m in recent_metrics[:3]) / 3
                evidence = {
                    "current_cpu": latest.cpu_usage_pct,
                    "sustained_snapshots": 3,
                    "average_cpu": round(avg_cpu, 1),
                    "threshold": settings.CPU_WARNING_THRESHOLD,
                    "timestamps": [m.captured_at.isoformat() for m in recent_metrics[:3]]
                }
                warning = EarlyWarning(
                    device_id=device_id,
                    category="High CPU",
                    severity="high" if avg_cpu > 92 else "medium",
                    trigger_type="trend",
                    explanation=f"CPU utilization sustained above {settings.CPU_WARNING_THRESHOLD}% over last 3 measurements (average: {avg_cpu:.1f}%).",
                    supporting_evidence=json.dumps(evidence),
                    status="new",
                    created_at=utcnow()
                )
                db.add(warning)
                new_warnings.append(warning)

        # 2. High Memory Utilization / Memory Leak Trend
        if latest.ram_usage_pct >= settings.RAM_WARNING_THRESHOLD or latest.available_memory_mb < 500.0:
            if not has_active_warning("High RAM"):
                # Check if RAM has been monotonically increasing across recent snapshots
                ram_trend = "increasing" if len(recent_metrics) >= 4 and all(
                    recent_metrics[i].ram_usage_pct >= recent_metrics[i+1].ram_usage_pct for i in range(3)
                ) else "elevated"

                evidence = {
                    "current_ram_pct": latest.ram_usage_pct,
                    "available_memory_mb": latest.available_memory_mb,
                    "trend": ram_trend,
                    "threshold_pct": settings.RAM_WARNING_THRESHOLD
                }
                warning = EarlyWarning(
                    device_id=device_id,
                    category="High RAM",
                    severity="critical" if latest.available_memory_mb < 300.0 else "high",
                    trigger_type="trend" if ram_trend == "increasing" else "threshold",
                    explanation=f"RAM utilization critical at {latest.ram_usage_pct}% with only {latest.available_memory_mb} MB free (Trend: {ram_trend}).",
                    supporting_evidence=json.dumps(evidence),
                    status="new",
                    created_at=utcnow()
                )
                db.add(warning)
                new_warnings.append(warning)

        # 3. Decreasing Free Storage / Low Disk Space
        if latest.disk_usage_pct >= settings.DISK_WARNING_THRESHOLD or latest.free_disk_gb < 5.0:
            if not has_active_warning("Low Disk"):
                evidence = {
                    "disk_usage_pct": latest.disk_usage_pct,
                    "free_disk_gb": latest.free_disk_gb,
                    "threshold_pct": settings.DISK_WARNING_THRESHOLD
                }
                warning = EarlyWarning(
                    device_id=device_id,
                    category="Low Disk",
                    severity="critical" if latest.free_disk_gb < 2.0 else "high",
                    trigger_type="threshold",
                    explanation=f"Storage volume critically low at {latest.disk_usage_pct}% used ({latest.free_disk_gb} GB remaining).",
                    supporting_evidence=json.dumps(evidence),
                    status="new",
                    created_at=utcnow()
                )
                db.add(warning)
                new_warnings.append(warning)

        # 4. Repeated Network Connectivity Failures
        if latest.failed_connectivity_checks >= settings.FAILED_PING_THRESHOLD or latest.network_status == "disconnected":
            if not has_active_warning("Network Drop"):
                evidence = {
                    "failed_checks": latest.failed_connectivity_checks,
                    "network_status": latest.network_status,
                    "threshold": settings.FAILED_PING_THRESHOLD
                }
                warning = EarlyWarning(
                    device_id=device_id,
                    category="Network Drop",
                    severity="critical" if latest.network_status == "disconnected" else "high",
                    trigger_type="repeated_error",
                    explanation=f"Recurring network connectivity loss ({latest.failed_connectivity_checks} consecutive ping drops recorded).",
                    supporting_evidence=json.dumps(evidence),
                    status="new",
                    created_at=utcnow()
                )
                db.add(warning)
                new_warnings.append(warning)

        # 5. Elevated Error Logs (last 1 hour)
        one_hour_ago = utcnow() - timedelta(hours=1)
        recent_errors = db.query(LogEvent).filter(
            LogEvent.device_id == device_id,
            LogEvent.severity.in_(["ERROR", "CRITICAL"]),
            LogEvent.timestamp >= one_hour_ago
        ).count()

        if recent_errors >= 4 and not has_active_warning("Recurring Errors"):
            evidence = {
                "error_count_last_hour": recent_errors,
                "window": "1 hour"
            }
            warning = EarlyWarning(
                device_id=device_id,
                category="Recurring Errors",
                severity="medium",
                trigger_type="repeated_error",
                explanation=f"{recent_errors} application or system error events logged within the last hour.",
                supporting_evidence=json.dumps(evidence),
                status="new",
                created_at=utcnow()
            )
            db.add(warning)
            new_warnings.append(warning)

        if new_warnings:
            # Update device health status
            device.health_status = "warning" if all(w.severity in ["low", "medium"] for w in new_warnings) else "critical"
            db.commit()

        return new_warnings
