import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.all_models import Device, MetricSnapshot, LogEvent, DiagnosticReport, Incident
from app.services.rules_engine import RulesEngine
from app.services.ml_predictor import MLPredictor

def utcnow():
    return datetime.now(timezone.utc)

class DiagnosticEngine:
    @staticmethod
    def run_diagnosis(db: Session, device_id: str, incident_id: Optional[int] = None) -> DiagnosticReport:
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device:
            raise ValueError(f"Device {device_id} not found.")

        # Gather latest metric snapshot
        latest_metric = db.query(MetricSnapshot).filter(
            MetricSnapshot.device_id == device_id
        ).order_by(MetricSnapshot.captured_at.desc()).first()

        metric_dict = {}
        if latest_metric:
            metric_dict = {
                "cpu_usage_pct": latest_metric.cpu_usage_pct,
                "ram_usage_pct": latest_metric.ram_usage_pct,
                "available_memory_mb": latest_metric.available_memory_mb,
                "disk_usage_pct": latest_metric.disk_usage_pct,
                "free_disk_gb": latest_metric.free_disk_gb,
                "network_status": latest_metric.network_status,
                "failed_connectivity_checks": latest_metric.failed_connectivity_checks,
                "log_error_count": latest_metric.log_error_count,
            }

        # Query recent logs
        recent_logs = db.query(LogEvent).filter(
            LogEvent.device_id == device_id
        ).order_by(LogEvent.timestamp.desc()).limit(15).all()

        log_snippets = [f"[{l.severity}] {l.source}: {l.message}" for l in recent_logs]

        # 1. Deterministic Rule Engine Evaluation
        rule_result = RulesEngine.evaluate_telemetry(metric_dict)

        # 2. Machine Learning Classifier Evaluation
        ml_result = MLPredictor.predict(metric_dict)

        # Synthesize Diagnosis: Evidence-Based Fusion
        # Always prioritize concrete physical measurements
        if not metric_dict:
            prediction = "Unknown / Insufficient Evidence"
            confidence_level = "insufficient_evidence"
            model_score = 0.0
            likely_causes = ["No metric telemetry received from this device."]
            missing_evidence = ["Live CPU/RAM/Disk metrics", "System Event Logs", "Network Connectivity status"]
            checklist = ["Verify device power and network cable", "Check if labcare-agent process is running"]
            safe_troubleshooting = [
                {
                    "step": 1,
                    "action": "Inspect physical workstation power state and network link LED.",
                    "risk_level": "Low",
                    "permissions": "None",
                    "expected_result": "Power LED on and ethernet link blinking."
                }
            ]
        else:
            # Reconcile ML and Rule results
            if rule_result["rule_matched"]:
                prediction = rule_result["suspected_fault"]
                confidence_level = rule_result["confidence"]
                model_score = ml_result.get("model_score", 0.92) if ml_result.get("available") else 0.88
            elif ml_result.get("available") and ml_result.get("prediction") != "Healthy":
                prediction = ml_result["prediction"]
                confidence_level = ml_result["confidence_level"]
                model_score = ml_result["model_score"]
            else:
                prediction = "Healthy / Normal Telemetry"
                confidence_level = "high"
                model_score = ml_result.get("model_score", 0.95)

            # Generate Evidence-Based Causes, Checklists, and Safe Repair Guidance
            likely_causes = []
            missing_evidence = []
            checklist = []
            safe_troubleshooting = []

            if prediction == "Excessive CPU Usage":
                likely_causes = [
                    "A runaway student process (e.g., Python infinite loop, unthrottled ML loop, or multi-threaded compiler).",
                    "A hung lab IDE or background process (e.g., VS Code extension host, Antivirus scanner spike)."
                ]
                missing_evidence = [
                    "Process-level CPU attribution (requires technician to inspect Task Manager or psutil process table).",
                    "Active student user account profile."
                ]
                checklist = [
                    "Open Task Manager (or run `tasklist /v` / `ps aux --sort=-%cpu`) on the workstation.",
                    "Identify the top process consuming > 50% CPU.",
                    "Check if the process is a student project compiler, Python script, or system utility.",
                    "Verify if processor cooling fan is running at normal audible levels."
                ]
                safe_troubleshooting = [
                    {
                        "step": 1,
                        "action": "Notify student user to save unsaved files in other open editors.",
                        "preconditions": "Technician has identified the PID of the offending process.",
                        "risk_level": "Low",
                        "permissions": "Standard / Lab Tech",
                        "expected_result": "Student work safely persisted."
                    },
                    {
                        "step": 2,
                        "action": "Close the specific runaway application through normal GUI prompt or safe SIGTERM.",
                        "risk_level": "Low",
                        "permissions": "Standard Lab Admin",
                        "expected_result": "Process exits cleanly; CPU drops below 30%."
                    },
                    {
                        "step": 3,
                        "action": "Recollect fresh CPU telemetry and verify baseline recovery.",
                        "risk_level": "Low",
                        "permissions": "None",
                        "expected_result": "CPU utilization returns to normal baseline (< 40%)."
                    }
                ]

            elif prediction == "High Memory Utilization":
                likely_causes = [
                    "Memory leak in an active application or virtual machine / Docker container.",
                    "Too many heavy browser tabs or IDE instances running simultaneously in student session."
                ]
                missing_evidence = [
                    "Specific process working set size and private memory breakdown.",
                    "Paging file commit charge vs physical RAM usage."
                ]
                checklist = [
                    "Inspect Resource Monitor memory tab.",
                    "Determine whether non-paged pool or private bytes are abnormally large.",
                    "Confirm if student had Docker Desktop, Android Emulator, or Blender open."
                ]
                safe_troubleshooting = [
                    {
                        "step": 1,
                        "action": "Check open browser tabs or idle background IDE instances and close unnecessary sessions.",
                        "risk_level": "Low",
                        "permissions": "Standard",
                        "expected_result": "Available memory increases by >= 1500 MB."
                    },
                    {
                        "step": 2,
                        "action": "If Docker / VM was left running from a previous lab, shut down the VM container cleanly.",
                        "risk_level": "Low",
                        "permissions": "Lab Admin",
                        "expected_result": "RAM usage drops below 75%."
                    }
                ]

            elif prediction == "Low Disk Space":
                likely_causes = [
                    "Large temporary build artifacts, node_modules, Python virtualenvs, or uncompressed datasets in student user folders.",
                    "System temp files (`%TEMP%` or `/tmp`) or Windows Update cache."
                ]
                missing_evidence = [
                    "Directory-level disk usage tree breakdown (e.g., WinDirStat or du -sh analysis)."
                ]
                checklist = [
                    "Verify free space on C: (or root filesystem) using File Explorer or `Get-PSDrive`.",
                    "Inspect `C:\\Users\\` student scratch folders for large zip/tarball files (> 5GB).",
                    "Check Recycle Bin and `%TEMP%` cache sizes."
                ]
                safe_troubleshooting = [
                    {
                        "step": 1,
                        "action": "Run built-in Windows Disk Cleanup (`cleanmgr.exe`) to purge temporary Windows update caches and Recycle Bin.",
                        "risk_level": "Low",
                        "permissions": "Standard Admin",
                        "expected_result": "At least 3 GB to 10 GB disk space recovered safely."
                    },
                    {
                        "step": 2,
                        "action": "Audit previous semester student folders in scratch drive and archive or prune outdated test datasets.",
                        "risk_level": "Medium (requires verification not active student data)",
                        "permissions": "Lab Admin",
                        "expected_result": "Disk utilization drops below 80%."
                    }
                ]

            elif prediction == "Network Connectivity Failure":
                likely_causes = [
                    "Ethernet cable loose, disconnected, or unseated at workstation or switch patch panel.",
                    "DHCP lease expired or IP address collision with lab subnet.",
                    "Local network interface adapter disabled or driver stalled."
                ]
                missing_evidence = [
                    "Physical ethernet link LED status.",
                    "Current IPv4 address assignment and default gateway ping response."
                ]
                checklist = [
                    "Inspect physical RJ-45 cable at back of computer and wall port.",
                    "Run `ipconfig /all` (or `ip addr`) to verify IP address assignment in 192.168.x / 10.x lab range.",
                    "Ping local default gateway (e.g. `ping 192.168.1.1`)."
                ]
                safe_troubleshooting = [
                    {
                        "step": 1,
                        "action": "Re-seat physical ethernet cable securely until the connector clicks.",
                        "risk_level": "Low",
                        "permissions": "Physical Access",
                        "expected_result": "Ethernet link LED illuminates green/amber."
                    },
                    {
                        "step": 2,
                        "action": "Execute `ipconfig /release` followed by `ipconfig /renew` to refresh DHCP lease.",
                        "risk_level": "Low",
                        "permissions": "Standard Admin",
                        "expected_result": "Valid lab IPv4 address and subnet assigned."
                    }
                ]

            elif prediction in ["Software / Application Errors", "Service Failure"]:
                likely_causes = [
                    "Lab service crash or terminated background daemon.",
                    "Missing runtime dependency or corrupted configuration file in student lab environment."
                ]
                missing_evidence = [
                    "Exact application crash code and event log stack trace.",
                    "Service exit code in Windows Event Log (Event ID 7034 / 7036)."
                ]
                checklist = [
                    "Review Windows Event Viewer Application and System logs for corresponding timestamps.",
                    "Verify if service startup type is set to Automatic or Disabled in `services.msc`."
                ]
                safe_troubleshooting = [
                    {
                        "step": 1,
                        "action": "Inspect service status in Services console and attempt restart via standard service manager.",
                        "risk_level": "Low",
                        "permissions": "Lab Admin",
                        "expected_result": "Service transitions to 'Running' without error 1067."
                    }
                ]
            else:
                likely_causes = ["System operating within normal lab parameters."]
                missing_evidence = []
                checklist = ["No corrective action required. Routine monitoring active."]
                safe_troubleshooting = []

        report_id = f"RPT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        report = DiagnosticReport(
            report_id=report_id,
            incident_id=incident_id,
            device_id=device_id,
            model_version="RandomForest-v1.0 + RulesEngine",
            prediction=prediction,
            model_score=round(float(model_score), 3),
            confidence_level=confidence_level,
            evidence=json.dumps({
                "observed_metrics": metric_dict,
                "recent_log_count": len(recent_logs),
                "recent_log_samples": log_snippets[:5],
                "rule_engine_findings": rule_result.get("findings", [])
            }),
            likely_causes=json.dumps(likely_causes),
            missing_evidence=json.dumps(missing_evidence),
            verification_checklist=json.dumps(checklist),
            safe_troubleshooting=json.dumps(safe_troubleshooting),
            generated_at=utcnow()
        )

        db.add(report)
        db.commit()
        db.refresh(report)
        return report
