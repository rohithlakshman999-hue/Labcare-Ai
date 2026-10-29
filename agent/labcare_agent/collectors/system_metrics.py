import socket
import time
import psutil
from typing import Dict, Any

class SystemMetricsCollector:
    @staticmethod
    def check_network_connectivity(host: str = "8.8.8.8", port: int = 53, timeout: float = 2.0) -> bool:
        """Lightweight TCP socket check for network connectivity."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((host, port))
            sock.close()
            return True
        except Exception:
            return False

    @classmethod
    def collect(cls, host_to_check: str = "8.8.8.8") -> Dict[str, Any]:
        """
        Collect CPU, RAM, Disk, and Network telemetry.
        Catches collector errors gracefully without crashing.
        """
        try:
            cpu_pct = psutil.cpu_percent(interval=0.5)
        except Exception as e:
            cpu_pct = 0.0

        try:
            mem = psutil.virtual_memory()
            ram_pct = mem.percent
            available_mb = round(mem.available / (1024 * 1024), 1)
        except Exception as e:
            ram_pct = 0.0
            available_mb = 0.0

        try:
            # Check root or C: disk partition
            disk_path = "C:\\" if psutil.WINDOWS else "/"
            disk = psutil.disk_usage(disk_path)
            disk_pct = disk.percent
            free_disk_gb = round(disk.free / (1024 * 1024 * 1024), 1)
        except Exception as e:
            disk_pct = 0.0
            free_disk_gb = 0.0

        # Check connectivity
        is_connected = cls.check_network_connectivity(host=host_to_check)
        network_status = "connected" if is_connected else "disconnected"
        failed_checks = 0 if is_connected else 1

        return {
            "cpu_usage_pct": float(cpu_pct),
            "ram_usage_pct": float(ram_pct),
            "available_memory_mb": float(available_mb),
            "disk_usage_pct": float(disk_pct),
            "free_disk_gb": float(free_disk_gb),
            "network_status": network_status,
            "failed_connectivity_checks": failed_checks,
            "log_error_count": 0,
            "source_type": "live"
        }
