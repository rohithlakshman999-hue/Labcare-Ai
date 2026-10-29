import json
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.all_models import (
    Device, MetricSnapshot, LogEvent, EarlyWarning, Incident, DiagnosticReport,
    VerificationRecord, RepairRecord, KnowledgeDocument
)
from app.services.rag_engine import RAGEngine
from app.services.early_warning_engine import EarlyWarningEngine
from app.services.diagnostic_engine import DiagnosticEngine

def utcnow():
    return datetime.now(timezone.utc)

class SimulatorService:
    @staticmethod
    def seed_initial_demo_data(db: Session):
        """
        Seed realistic lab workstations and historical telemetry across 3 college labs.
        All records clearly labeled demo_mode=True and source_type="simulated".
        """
        # If devices already exist, skip re-seeding
        if db.query(Device).count() > 0:
            return

        print("Seeding realistic college computer lab demo devices and telemetry...")

        # 1. Seed Knowledge Base Documents
        kb_docs = RAGEngine.load_knowledge_base()
        for doc in kb_docs:
            existing_kb = db.query(KnowledgeDocument).filter(KnowledgeDocument.doc_id == doc["doc_id"]).first()
            if not existing_kb:
                kb_record = KnowledgeDocument(
                    doc_id=doc["doc_id"],
                    title=doc["title"],
                    fault_category=doc["fault_category"],
                    symptoms=json.dumps(doc["symptoms"]),
                    required_evidence=json.dumps(doc["required_evidence"]),
                    verification_procedure=json.dumps(doc["verification_procedure"]),
                    safe_repair_instructions=json.dumps(doc["safe_repair_instructions"]),
                    risk_level=doc["risk_level"],
                    post_repair_checks=json.dumps(doc["post_repair_checks"]),
                    source_reference=doc["source_reference"],
                    updated_at=utcnow()
                )
                db.add(kb_record)
        db.commit()

        # 2. Define Workstation Profiles
        # Profiles: normal, high_cpu, high_ram, low_disk, network_drop, offline
        workstations = [
            # Lab A - Computer Science Lab
            {"device_id": "LAB-A-01", "name": "Workstation A01", "lab": "Lab A (CS Lab)", "location": "Row 1, Seat 1", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-A-02", "name": "Workstation A02", "lab": "Lab A (CS Lab)", "location": "Row 1, Seat 2", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-A-03", "name": "Workstation A03", "lab": "Lab A (CS Lab)", "location": "Row 1, Seat 3", "os": "Windows 11 Pro", "profile": "high_cpu"},
            {"device_id": "LAB-A-04", "name": "Workstation A04", "lab": "Lab A (CS Lab)", "location": "Row 2, Seat 1", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-A-05", "name": "Workstation A05", "lab": "Lab A (CS Lab)", "location": "Row 2, Seat 2", "os": "Ubuntu 24.04 LTS", "profile": "normal"},
            {"device_id": "LAB-A-06", "name": "Workstation A06", "lab": "Lab A (CS Lab)", "location": "Row 2, Seat 3", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-A-07", "name": "Workstation A07", "lab": "Lab A (CS Lab)", "location": "Row 3, Seat 1", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-A-08", "name": "Workstation A08", "lab": "Lab A (CS Lab)", "location": "Row 3, Seat 2", "os": "Windows 11 Pro", "profile": "high_ram"},
            {"device_id": "LAB-A-09", "name": "Workstation A09", "lab": "Lab A (CS Lab)", "location": "Row 3, Seat 3", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-A-10", "name": "Workstation A10", "lab": "Lab A (CS Lab)", "location": "Row 4, Seat 1", "os": "Windows 11 Pro", "profile": "normal"},

            # Lab B - AI & Data Science Lab
            {"device_id": "LAB-B-01", "name": "AI Station B01", "lab": "Lab B (AI Lab)", "location": "Station B1", "os": "Ubuntu 24.04 LTS", "profile": "normal"},
            {"device_id": "LAB-B-02", "name": "AI Station B02", "lab": "Lab B (AI Lab)", "location": "Station B2", "os": "Ubuntu 24.04 LTS", "profile": "normal"},
            {"device_id": "LAB-B-03", "name": "AI Station B03", "lab": "Lab B (AI Lab)", "location": "Station B3", "os": "Ubuntu 24.04 LTS", "profile": "normal"},
            {"device_id": "LAB-B-04", "name": "AI Station B04", "lab": "Lab B (AI Lab)", "location": "Station B4", "os": "Ubuntu 24.04 LTS", "profile": "low_disk"},
            {"device_id": "LAB-B-05", "name": "AI Station B05", "lab": "Lab B (AI Lab)", "location": "Station B5", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-B-06", "name": "AI Station B06", "lab": "Lab B (AI Lab)", "location": "Station B6", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-B-07", "name": "AI Station B07", "lab": "Lab B (AI Lab)", "location": "Station B7", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-B-08", "name": "AI Station B08", "lab": "Lab B (AI Lab)", "location": "Station B8", "os": "Ubuntu 24.04 LTS", "profile": "normal"},

            # Lab C - Cybersecurity & Networks Lab
            {"device_id": "LAB-C-01", "name": "Cyber Station C01", "lab": "Lab C (Cyber Lab)", "location": "Pod 1, Desk 1", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-C-02", "name": "Cyber Station C02", "lab": "Lab C (Cyber Lab)", "location": "Pod 1, Desk 2", "os": "Windows 11 Pro", "profile": "network_drop"},
            {"device_id": "LAB-C-03", "name": "Cyber Station C03", "lab": "Lab C (Cyber Lab)", "location": "Pod 2, Desk 1", "os": "Kali Linux 2024", "profile": "normal"},
            {"device_id": "LAB-C-04", "name": "Cyber Station C04", "lab": "Lab C (Cyber Lab)", "location": "Pod 2, Desk 2", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-C-05", "name": "Cyber Station C05", "lab": "Lab C (Cyber Lab)", "location": "Pod 3, Desk 1", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-C-06", "name": "Cyber Station C06", "lab": "Lab C (Cyber Lab)", "location": "Pod 3, Desk 2", "os": "Windows 11 Pro", "profile": "normal"},
            {"device_id": "LAB-C-07", "name": "Cyber Station C07", "lab": "Lab C (Cyber Lab)", "location": "Pod 4, Desk 1", "os": "Windows 11 Pro", "profile": "offline"},
        ]

        now = utcnow()

        for ws in workstations:
            prof = ws["profile"]
            is_offline = (prof == "offline")

            conn_status = "offline" if is_offline else "online"
            last_heartbeat = now - timedelta(minutes=random.randint(15, 45)) if is_offline else now - timedelta(seconds=random.randint(5, 40))

            health_status = "healthy"
            if prof in ["high_cpu", "high_ram", "low_disk", "network_drop"]:
                health_status = "critical" if prof in ["high_cpu", "low_disk"] else "warning"
            elif is_offline:
                health_status = "unknown"  # Offline != hardware failure!

            dev = Device(
                device_id=ws["device_id"],
                display_name=ws["name"],
                lab_name=ws["lab"],
                location=ws["location"],
                operating_system=ws["os"],
                agent_version="1.0.0-sim",
                connection_status=conn_status,
                health_status=health_status,
                last_heartbeat_at=last_heartbeat,
                enrolled_at=now - timedelta(days=random.randint(5, 30)),
                is_active=True,
                demo_mode=True
            )
            db.add(dev)
            db.flush()

            # Generate 12 historical metric snapshots over the last 60 minutes
            for step in range(12, 0, -1):
                snap_time = now - timedelta(minutes=step * 5)

                if prof == "normal":
                    cpu = round(random.uniform(15.0, 42.0), 1)
                    ram = round(random.uniform(35.0, 60.0), 1)
                    disk = round(random.uniform(45.0, 65.0), 1)
                    free_disk = round(500 * (1 - disk / 100), 1)
                    avail_ram = round(16384 * (1 - ram / 100), 1)
                    pings = 0
                    net_st = "connected"
                    errs = 0

                elif prof == "high_cpu":
                    # Sustained high CPU over last 4 snapshots
                    cpu = round(random.uniform(88.0, 97.5), 1) if step <= 5 else round(random.uniform(40.0, 65.0), 1)
                    ram = round(random.uniform(50.0, 65.0), 1)
                    disk = 52.0
                    free_disk = 240.0
                    avail_ram = 7200.0
                    pings = 0
                    net_st = "connected"
                    errs = 1 if step == 1 else 0

                elif prof == "high_ram":
                    cpu = round(random.uniform(25.0, 50.0), 1)
                    ram = round(min(97.0, 70.0 + (12 - step) * 2.3), 1)  # Gradual memory leak trend!
                    avail_ram = round(16384 * (1 - ram / 100), 1)
                    disk = 58.0
                    free_disk = 210.0
                    pings = 0
                    net_st = "connected"
                    errs = 1

                elif prof == "low_disk":
                    cpu = round(random.uniform(20.0, 45.0), 1)
                    ram = 50.0
                    avail_ram = 8192.0
                    disk = round(random.uniform(93.5, 96.8), 1)
                    free_disk = round(random.uniform(1.8, 3.2), 1)
                    pings = 0
                    net_st = "connected"
                    errs = 2

                elif prof == "network_drop":
                    cpu = 20.0
                    ram = 45.0
                    avail_ram = 9000.0
                    disk = 40.0
                    free_disk = 300.0
                    pings = 4 if step <= 3 else 1
                    net_st = "disconnected" if step <= 3 else "degraded"
                    errs = 3

                elif is_offline:
                    # Offline device has no recent snapshots within the last 30 minutes
                    if step > 6:
                        continue
                    cpu = 18.0
                    ram = 38.0
                    avail_ram = 10100.0
                    disk = 48.0
                    free_disk = 260.0
                    pings = 0
                    net_st = "connected"
                    errs = 0

                snap = MetricSnapshot(
                    device_id=ws["device_id"],
                    captured_at=snap_time,
                    cpu_usage_pct=cpu,
                    ram_usage_pct=ram,
                    available_memory_mb=avail_ram,
                    disk_usage_pct=disk,
                    free_disk_gb=free_disk,
                    network_status=net_st,
                    failed_connectivity_checks=pings,
                    log_error_count=errs,
                    source_type="simulated"
                )
                db.add(snap)

            # Pre-populate specific realistic Incidents and Early Warnings
            if prof == "high_cpu":
                w = EarlyWarning(
                    device_id=ws["device_id"],
                    category="High CPU",
                    severity="high",
                    trigger_type="trend",
                    explanation="Sustained CPU utilization above 88% detected across last 4 metric collections.",
                    supporting_evidence=json.dumps({"current_cpu": 94.2, "sustained_minutes": 20, "process": "student_compile_loop.py"}),
                    status="new",
                    created_at=now - timedelta(minutes=18)
                )
                db.add(w)

                inc = Incident(
                    incident_id="INC-2026-001",
                    device_id=ws["device_id"],
                    fault_category="Excessive CPU Usage",
                    severity="high",
                    status="investigating",
                    source="early_warning",
                    created_at=now - timedelta(minutes=15),
                    assigned_to="Tech Kumar",
                    notes="Technician assigned to inspect runaway student compiler script on Workstation A03."
                )
                db.add(inc)

            elif prof == "high_ram":
                w = EarlyWarning(
                    device_id=ws["device_id"],
                    category="High RAM",
                    severity="critical",
                    trigger_type="trend",
                    explanation="RAM utilization reached 94.5% with increasing memory consumption slope (Leak detected).",
                    supporting_evidence=json.dumps({"current_ram_pct": 94.5, "free_ram_mb": 450.0}),
                    status="acknowledged",
                    acknowledged_at=now - timedelta(minutes=10),
                    created_at=now - timedelta(minutes=25)
                )
                db.add(w)

            elif prof == "low_disk":
                w = EarlyWarning(
                    device_id=ws["device_id"],
                    category="Low Disk",
                    severity="critical",
                    trigger_type="threshold",
                    explanation="Disk volume utilization is 95.2% with only 2.4 GB remaining on primary volume.",
                    supporting_evidence=json.dumps({"disk_pct": 95.2, "free_gb": 2.4}),
                    status="new",
                    created_at=now - timedelta(minutes=30)
                )
                db.add(w)

                inc = Incident(
                    incident_id="INC-2026-002",
                    device_id=ws["device_id"],
                    fault_category="Low Disk Space",
                    severity="critical",
                    status="confirmed",
                    source="early_warning",
                    created_at=now - timedelta(minutes=28),
                    assigned_to="Tech Sarah",
                    notes="Confirmed large scratch datasets from prior deep learning lab occupying 180 GB in C:\\scratch."
                )
                db.add(inc)

            elif prof == "network_drop":
                w = EarlyWarning(
                    device_id=ws["device_id"],
                    category="Network Drop",
                    severity="high",
                    trigger_type="repeated_error",
                    explanation="4 consecutive ICMP ping failures to lab default gateway (10.0.3.1).",
                    supporting_evidence=json.dumps({"failed_pings": 4, "adapter": "Ethernet 1"}),
                    status="new",
                    created_at=now - timedelta(minutes=12)
                )
                db.add(w)

        db.commit()
        print("Successfully seeded demo devices, metrics, warnings, and incidents.")
