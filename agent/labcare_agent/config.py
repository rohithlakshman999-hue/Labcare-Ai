import os
from dataclasses import dataclass

@dataclass
class AgentConfig:
    backend_url: str = os.getenv("LABCARE_BACKEND_URL", "http://127.0.0.1:8000/api")
    device_id: str = os.getenv("LABCARE_DEVICE_ID", "LAB-A-01")
    agent_token: str = os.getenv("LABCARE_AGENT_TOKEN", "demo-token")
    collection_interval_seconds: int = int(os.getenv("LABCARE_INTERVAL_SECONDS", "15"))
    ping_host: str = os.getenv("LABCARE_PING_HOST", "8.8.8.8")
    enable_process_collection: bool = os.getenv("LABCARE_COLLECT_PROCESSES", "false").lower() == "true"
    max_retries: int = 3
    retry_delay_seconds: int = 2

config = AgentConfig()
