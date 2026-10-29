import time
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("LabCareAgent.Transport")

class BackendClient:
    def __init__(self, backend_url: str, agent_token: str, max_retries: int = 2, retry_delay: int = 1):
        self.backend_url = backend_url.rstrip("/")
        self.agent_token = agent_token
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.agent_token}",
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true",
            "User-Agent": "LabCareAgent/1.0"
        }

    def send_heartbeat(self, device_id: str) -> bool:
        url = f"{self.backend_url}/agent/heartbeat?device_id={device_id}"
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = requests.post(url, headers=self.headers, timeout=5)
                if resp.status_code in [200, 201]:
                    return True
                logger.warning(f"Heartbeat rejected: HTTP {resp.status_code} ({resp.text})")
                if resp.status_code in [401, 403]:
                    # Authorization error, no use retrying immediately
                    return False
            except Exception as e:
                logger.warning(f"Heartbeat connection error: {e}")
            time.sleep(self.retry_delay)
        return False

    def send_metrics(self, device_id: str, metrics: Dict[str, Any]) -> bool:
        url = f"{self.backend_url}/agent/metrics"
        payload = {"device_id": device_id, **metrics}
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = requests.post(url, headers=self.headers, json=payload, timeout=5)
                if resp.status_code in [200, 201]:
                    return True
                logger.warning(f"Metrics rejected: HTTP {resp.status_code} ({resp.text})")
                if resp.status_code in [401, 403]:
                    return False
            except Exception as e:
                logger.warning(f"Metrics connection error: {e}")
            time.sleep(self.retry_delay)
        return False
