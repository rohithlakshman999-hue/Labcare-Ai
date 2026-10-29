from datetime import datetime, timezone, timedelta
import pytest
from app.models.all_models import Device, MetricSnapshot, EarlyWarning, Incident, DiagnosticReport
from app.core.security import hash_token

def utcnow():
    return datetime.now(timezone.utc)

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "LabCare AI"

def test_device_online_after_heartbeat(client, db):
    # Register device
    dev = Device(
        device_id="TEST-DEV-01",
        display_name="Test Station 1",
        lab_name="Lab A",
        connection_status="unknown",
        health_status="healthy",
        last_heartbeat_at=None,
        demo_mode=True
    )
    db.add(dev)
    db.commit()

    # Send heartbeat
    res = client.post("/api/agent/heartbeat?device_id=TEST-DEV-01")
    assert res.status_code == 200

    # Query device
    dev_res = client.get("/api/devices/TEST-DEV-01")
    assert dev_res.status_code == 200
    assert dev_res.json()["connection_status"] == "online"

def test_device_offline_after_timeout_not_hardware_failed(client, db):
    # Device with old heartbeat (10 minutes ago)
    past_time = utcnow() - timedelta(minutes=10)
    dev = Device(
        device_id="TEST-DEV-OFFLINE",
        display_name="Offline Station",
        lab_name="Lab A",
        connection_status="online",
        health_status="unknown",
        last_heartbeat_at=past_time,
        demo_mode=True
    )
    db.add(dev)
    db.commit()

    # Query device status
    res = client.get("/api/devices/TEST-DEV-OFFLINE")
    assert res.status_code == 200
    data = res.json()
    assert data["connection_status"] == "offline"
    # An offline device must NOT automatically be labeled hardware-failed / critical
    assert data["health_status"] != "critical"

def test_metric_validation(client):
    # Negative CPU or > 100 should fail Pydantic validation
    bad_payload = {
        "device_id": "TEST-DEV-01",
        "cpu_usage_pct": 150.0,
        "ram_usage_pct": 50.0,
        "available_memory_mb": 4000.0,
        "disk_usage_pct": 60.0,
        "free_disk_gb": 100.0
    }
    res = client.post("/api/agent/metrics", json=bad_payload)
    assert res.status_code == 422

def test_high_cpu_warning_detection_and_duplicate_suppression(client, db):
    dev = Device(
        device_id="TEST-DEV-CPU",
        display_name="CPU Test Station",
        lab_name="Lab A",
        connection_status="online",
        health_status="healthy",
        last_heartbeat_at=utcnow(),
        demo_mode=True
    )
    db.add(dev)
    db.commit()

    # Send 3 sustained high CPU metrics
    for _ in range(3):
        m_payload = {
            "device_id": "TEST-DEV-CPU",
            "cpu_usage_pct": 92.5,
            "ram_usage_pct": 40.0,
            "available_memory_mb": 8000.0,
            "disk_usage_pct": 50.0,
            "free_disk_gb": 200.0,
            "network_status": "connected",
            "source_type": "simulated"
        }
        res = client.post("/api/agent/metrics", json=m_payload)
        assert res.status_code == 200

    # Query warnings
    w_res = client.get("/api/warnings?device_id=TEST-DEV-CPU")
    assert w_res.status_code == 200
    warnings = w_res.json()
    assert len(warnings) == 1
    assert warnings[0]["category"] == "High CPU"

    # Send a 4th high CPU metric — duplicate warning should be suppressed
    client.post("/api/agent/metrics", json=m_payload)
    w_res2 = client.get("/api/warnings?device_id=TEST-DEV-CPU")
    assert len(w_res2.json()) == 1

def test_diagnosis_evidence_and_guided_verification(client, db):
    dev = Device(
        device_id="TEST-DEV-DIAG",
        display_name="Diag Test Station",
        lab_name="Lab A",
        connection_status="online",
        health_status="warning",
        last_heartbeat_at=utcnow(),
        demo_mode=True
    )
    db.add(dev)
    db.flush()

    # Add snapshot
    snap = MetricSnapshot(
        device_id="TEST-DEV-DIAG",
        captured_at=utcnow(),
        cpu_usage_pct=95.0,
        ram_usage_pct=50.0,
        available_memory_mb=7000.0,
        disk_usage_pct=50.0,
        free_disk_gb=200.0,
        network_status="connected",
        failed_connectivity_checks=0,
        log_error_count=0,
        source_type="simulated"
    )
    db.add(snap)
    db.commit()

    # Run Diagnosis
    diag_res = client.post("/api/devices/TEST-DEV-DIAG/diagnose")
    assert diag_res.status_code == 200
    report = diag_res.json()
    assert "report_id" in report
    assert report["prediction"] == "Excessive CPU Usage"
    assert report["confidence_level"] in ["high", "moderate"]
    assert report["evidence"] is not None

    # Technician Guided Verification: Confirmed
    v_payload = {
        "report_id": report["id"],
        "technician_outcome": "confirmed",
        "checks_completed": ["Checked Task Manager", "Identified runaway student script PID 4920"],
        "observations": "Student infinite while loop found in Python project script."
    }
    v_res = client.post(f"/api/diagnostics/{report['report_id']}/verification", json=v_payload)
    assert v_res.status_code == 200
    assert v_res.json()["technician_outcome"] == "confirmed"

def test_safe_repair_and_recovery_verification(client, db):
    dev = Device(
        device_id="TEST-DEV-REPAIR",
        display_name="Repair Test Station",
        lab_name="Lab B",
        connection_status="online",
        health_status="critical",
        last_heartbeat_at=utcnow(),
        demo_mode=True
    )
    db.add(dev)
    db.flush()

    # Create Incident
    inc = Incident(
        incident_id="INC-TEST-001",
        device_id="TEST-DEV-REPAIR",
        fault_category="Low Disk Space",
        severity="critical",
        status="confirmed",
        source="manual_report"
    )
    db.add(inc)
    db.flush()

    report = DiagnosticReport(
        report_id="RPT-TEST-001",
        incident_id=inc.id,
        device_id="TEST-DEV-REPAIR",
        prediction="Low Disk Space",
        model_score=0.95,
        confidence_level="high"
    )
    db.add(report)
    db.commit()

    # Record Safe Repair Action
    repair_payload = {
        "incident_id": inc.id,
        "procedure_identifier": "KB-DISK-003",
        "action_notes": "Executed cleanmgr.exe and cleared outdated build cache.",
        "outcome": "successful"
    }
    r_res = client.post(f"/api/diagnostics/RPT-TEST-001/repair-records", json=repair_payload)
    assert r_res.status_code == 200

    # Incident should now be fix_in_progress
    inc_res = client.get(f"/api/incidents/{inc.incident_id}")
    assert inc_res.json()["status"] == "fix_in_progress"

    # Recovery verification: confirm_resolved = True
    recover_payload = {
        "incident_id": inc.id,
        "technician_notes": "Free disk space verified at 35 GB. System healthy.",
        "confirm_resolved": True
    }
    rec_res = client.post(f"/api/diagnostics/RPT-TEST-001/verify-recovery", json=recover_payload)
    assert rec_res.status_code == 200
    assert rec_res.json()["status"] == "resolved"

    # Verify incident is resolved in database
    inc_res_final = client.get(f"/api/incidents/{inc.incident_id}")
    assert inc_res_final.json()["status"] == "resolved"

def test_chatbot_deterministic_fallback_without_api_key(client):
    chat_payload = {
        "message": "The computer in Lab A has 95% CPU and is lagging. How do I fix it?",
        "session_id": "test_session_1",
        "device_id": None
    }
    res = client.post("/api/chat", json=chat_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_fallback"] is True
    assert "High CPU & Workstation Slowness Guidance" in data["reply"]
    assert len(data["sources"]) > 0

def test_unauthorized_agent_token_rejection(client, db):
    dev = Device(
        device_id="TEST-SECURE-DEV",
        display_name="Secure Station",
        lab_name="Lab C",
        connection_status="unknown",
        health_status="healthy",
        demo_mode=False,
        agent_token_hash=hash_token("correct_token_123")
    )
    db.add(dev)
    db.commit()

    # Request with wrong token
    res = client.post(
        "/api/agent/heartbeat?device_id=TEST-SECURE-DEV",
        headers={"Authorization": "Bearer wrong_token"}
    )
    assert res.status_code == 403

    # Request with correct token
    res_ok = client.post(
        "/api/agent/heartbeat?device_id=TEST-SECURE-DEV",
        headers={"Authorization": "Bearer correct_token_123"}
    )
    assert res_ok.status_code == 200

def test_device_update_and_delete(client, db):
    dev = Device(
        device_id="TEST-EDIT-DEV",
        display_name="Original Name",
        lab_name="Lab A",
        location="Row 1, Seat 1",
        operating_system="Windows 10",
        connection_status="unknown",
        health_status="healthy",
        demo_mode=True
    )
    db.add(dev)
    db.commit()

    # Update system details
    patch_res = client.patch(
        "/api/devices/TEST-EDIT-DEV",
        json={
            "display_name": "Updated System Name",
            "lab_name": "Lab B (AI Lab)",
            "location": "Row 4, Seat 2",
            "operating_system": "Ubuntu 22.04 LTS",
            "demo_mode": False
        }
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["display_name"] == "Updated System Name"
    assert updated_data["lab_name"] == "Lab B (AI Lab)"
    assert updated_data["location"] == "Row 4, Seat 2"
    assert updated_data["operating_system"] == "Ubuntu 22.04 LTS"
    assert updated_data["demo_mode"] is False

    # Delete device
    del_res = client.delete("/api/devices/TEST-EDIT-DEV")
    assert del_res.status_code == 200
    assert client.get("/api/devices/TEST-EDIT-DEV").status_code == 404
