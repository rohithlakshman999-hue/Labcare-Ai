import sys
import os
import argparse

# Add agent directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from labcare_agent.config import config
from labcare_agent.agent import LabCareAgent

def main():
    parser = argparse.ArgumentParser(description="LabCare AI — Cross-Platform Monitoring Agent")
    parser.add_argument("--device-id", default=config.device_id, help="Unique workstation ID (e.g. LAB-A-01)")
    parser.add_argument("--token", default=config.agent_token, help="Agent authorization token")
    parser.add_argument("--backend", default=config.backend_url, help="FastAPI backend URL (e.g. http://127.0.0.1:8000/api)")
    parser.add_argument("--interval", type=int, default=config.collection_interval_seconds, help="Collection interval in seconds")
    parser.add_argument("--once", action="store_true", help="Collect and send a single snapshot, then exit")
    
    args = parser.parse_args()

    config.device_id = args.device_id
    config.agent_token = args.token
    config.backend_url = args.backend
    config.collection_interval_seconds = args.interval

    agent = LabCareAgent(config)
    if args.once:
        success = agent.run_once()
        sys.exit(0 if success else 1)
    else:
        try:
            agent.start()
        except KeyboardInterrupt:
            agent.stop()

if __name__ == "__main__":
    main()
