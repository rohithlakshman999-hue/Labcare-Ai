from typing import Dict, Any, List
from app.core.config import settings

class RulesEngine:
    """
    Deterministic rules engine for system telemetry diagnostics and early warnings.
    Always uses evidence-based reasoning without guessing unobserved components.
    """
    
    @staticmethod
    def evaluate_telemetry(metrics: Dict[str, Any], historical: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Evaluate single snapshot and optional historical context against configurable rules.
        """
        cpu = metrics.get("cpu_usage_pct", 0.0)
        ram = metrics.get("ram_usage_pct", 0.0)
        avail_ram = metrics.get("available_memory_mb", 16384.0)
        disk = metrics.get("disk_usage_pct", 0.0)
        free_disk = metrics.get("free_disk_gb", 100.0)
        net_status = metrics.get("network_status", "connected")
        failed_pings = metrics.get("failed_connectivity_checks", 0)
        log_errors = metrics.get("log_error_count", 0)

        findings = []
        suspected_fault = "Healthy"
        severity = "low"
        confidence = "high"

        # Check for Network Connectivity Failure
        if failed_pings >= settings.FAILED_PING_THRESHOLD or net_status == "disconnected":
            suspected_fault = "Network Connectivity Failure"
            severity = "critical" if net_status == "disconnected" else "high"
            findings.append(f"Network connectivity check failed with {failed_pings} consecutive packet drops. Status: {net_status}.")

        # Check for Low Disk Space
        elif disk >= settings.DISK_WARNING_THRESHOLD or free_disk < 5.0:
            suspected_fault = "Low Disk Space"
            severity = "critical" if free_disk < 2.0 or disk >= 95.0 else "high"
            findings.append(f"Storage volume utilization is critical at {disk}% ({free_disk} GB remaining).")

        # Check for High Memory Utilization
        elif ram >= settings.RAM_WARNING_THRESHOLD or avail_ram < 500.0:
            suspected_fault = "High Memory Utilization"
            severity = "critical" if avail_ram < 300.0 or ram >= 95.0 else "high"
            findings.append(f"RAM utilization is elevated at {ram}% (only {avail_ram} MB available memory).")

        # Check for Excessive CPU Usage
        elif cpu >= settings.CPU_WARNING_THRESHOLD:
            suspected_fault = "Excessive CPU Usage"
            severity = "critical" if cpu >= 95.0 else "high"
            findings.append(f"CPU utilization is critical at {cpu}%.")

        # Check for Software/Application and Log Errors
        elif log_errors >= 3:
            suspected_fault = "Software / Application Errors"
            severity = "medium"
            findings.append(f"Elevated application/system log error rate ({log_errors} errors recorded in recent collection).")

        return {
            "suspected_fault": suspected_fault,
            "severity": severity,
            "confidence": confidence,
            "findings": findings,
            "rule_matched": suspected_fault != "Healthy"
        }
