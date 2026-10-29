import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.models.all_models import Incident, Device, EarlyWarning, DiagnosticReport

router = APIRouter(prefix="/reports", tags=["Reports & History"])

@router.get("/metrics")
def get_report_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Calculate comprehensive lab incident, warning, and resolution metrics
    strictly from stored database records.
    """
    devices = db.query(Device).all()
    incidents = db.query(Incident).all()
    warnings = db.query(EarlyWarning).all()
    diagnostics = db.query(DiagnosticReport).all()

    # Incidents by Category
    cat_counts = {}
    for inc in incidents:
        cat_counts[inc.fault_category] = cat_counts.get(inc.fault_category, 0) + 1

    # Incidents by Laboratory
    lab_counts = {}
    for inc in incidents:
        lab_name = inc.device.lab_name if inc.device else "Unknown Lab"
        lab_counts[lab_name] = lab_counts.get(lab_name, 0) + 1

    # Status counts
    resolved_count = sum(1 for inc in incidents if inc.status == "resolved")
    reopened_count = sum(1 for inc in incidents if inc.status == "reopened")
    confirmed_count = sum(1 for inc in incidents if inc.status in ["confirmed", "fix_in_progress", "resolved"])

    # Calculate average time to resolution (in minutes) for resolved incidents
    durations = []
    for inc in incidents:
        if inc.status == "resolved" and inc.updated_at and inc.created_at:
            dur = (inc.updated_at - inc.created_at).total_seconds() / 60.0
            if dur > 0:
                durations.append(dur)
    
    avg_resolution_mins = round(sum(durations) / len(durations), 1) if durations else 0.0

    return {
        "total_registered_devices": len(devices),
        "total_incidents": len(incidents),
        "total_early_warnings": len(warnings),
        "total_diagnostic_reports": len(diagnostics),
        "incidents_by_category": cat_counts,
        "incidents_by_lab": lab_counts,
        "resolved_incidents": resolved_count,
        "reopened_incidents": reopened_count,
        "confirmed_diagnoses": confirmed_count,
        "average_resolution_time_minutes": avg_resolution_mins,
        "unconfirmed_incidents": sum(1 for inc in incidents if inc.status == "not_confirmed")
    }

@router.get("/export-csv")
def export_incidents_csv(db: Session = Depends(get_db)):
    """Export all recorded incidents as CSV for laboratory administrative audits."""
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Incident ID", "Device ID", "Lab Name", "Fault Category",
        "Severity", "Status", "Source", "Assigned Technician",
        "Created At", "Updated At", "Final Outcome"
    ])

    for inc in incidents:
        writer.writerow([
            inc.incident_id,
            inc.device_id,
            inc.device.lab_name if inc.device else "Unknown",
            inc.fault_category,
            inc.severity,
            inc.status,
            inc.source,
            inc.assigned_to or "Unassigned",
            inc.created_at.isoformat() if inc.created_at else "",
            inc.updated_at.isoformat() if inc.updated_at else "",
            inc.final_outcome or inc.notes or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=labcare_incidents_report.csv"}
    )
