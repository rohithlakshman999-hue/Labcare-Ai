# LabCare AI — Cross-Platform Monitoring Agent

The `labcare-agent` is an outbound-only, lightweight monitoring service designed to collect live telemetry from authorized Windows and Linux lab computers.

## Capabilities
- **CPU Utilization**: Live multi-core utilization via `psutil`.
- **Memory Metrics**: Total, used, percentage, and available RAM (MB).
- **Disk Storage**: Volume percentage and free gigabytes.
- **Network Health**: Periodic gateway connectivity checks.
- **Security**: Outbound-only authenticated requests with SHA-256 token verification.
- **Resilience**: Bounded retry mechanism with exponential backoff; collector errors logged without crashing.

## Enrolling a Real Lab Computer
1. In the LabCare AI Dashboard, click **Devices** -> **Register Device**.
2. Enter Device ID (e.g., `LAB-PHYSICAL-01`), Lab Name, and location.
3. Click **Generate Agent Token** on the device page. Copy the generated token `lca_agent_...`.
4. On the client computer, install Python 3.9+ and dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the agent:
   ```bash
   python main.py --device-id LAB-PHYSICAL-01 --token <YOUR_TOKEN> --backend http://<SERVER_IP>:8000/api
   ```
6. The workstation will immediately report **Online** with fresh live telemetry snapshots appearing on its detail page.
