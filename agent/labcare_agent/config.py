import os
import json
from dataclasses import dataclass
from typing import Optional

def load_file_config():
    """Search for agent_config.json in current directory or agent package folder."""
    candidates = [
        os.path.join(os.getcwd(), "agent_config.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "agent_config.json"),
        os.path.join(os.getcwd(), "config.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config.json")
    ]
    for p in candidates:
        if os.path.isfile(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data, p
            except Exception as e:
                print(f"[CONFIG] Warning: could not parse {p}: {e}")
    return {}, None

_file_data, loaded_config_file = load_file_config()

def _resolve_backend():
    raw = _file_data.get("backend_url") or _file_data.get("backend") or _file_data.get("server") or os.getenv("LABCARE_BACKEND_URL")
    if raw:
        clean = raw.strip().rstrip("/")
        if not clean.startswith("http://") and not clean.startswith("https://"):
            clean = f"http://{clean}"
        if not clean.endswith("/api"):
            clean = f"{clean}/api"
        return clean
    return "http://127.0.0.1:8000/api"

@dataclass
class AgentConfig:
    backend_url: str = _resolve_backend()
    device_id: str = _file_data.get("device_id") or _file_data.get("device") or os.getenv("LABCARE_DEVICE_ID", "LAB-A-01")
    agent_token: str = _file_data.get("token") or _file_data.get("agent_token") or os.getenv("LABCARE_AGENT_TOKEN", "demo-token")
    collection_interval_seconds: int = int(_file_data.get("interval") or _file_data.get("collection_interval_seconds") or os.getenv("LABCARE_INTERVAL_SECONDS", "5"))
    ping_host: str = os.getenv("LABCARE_PING_HOST", "8.8.8.8")
    enable_process_collection: bool = os.getenv("LABCARE_COLLECT_PROCESSES", "false").lower() == "true"
    max_retries: int = 3
    retry_delay_seconds: int = 2
    config_file_path: Optional[str] = loaded_config_file

config = AgentConfig()
