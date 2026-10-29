# LabCare AI — Workstation Monitoring & Agent Architecture

## 1. Connectivity vs Health Logic
A critical architectural principle of LabCare AI is the strict decoupling of **Connectivity** from **Hardware Health**:
- **Connectivity Status**:
  - `Online`: A valid heartbeat has arrived within `HEARTBEAT_TIMEOUT_SECONDS` (default 90s).
  - `Offline`: No heartbeat received beyond the timeout threshold.
  - `Unknown`: Insufficient connection history exists.
  - *Rule*: An offline workstation is **NEVER** automatically labeled as having a hardware failure. A powered-down workstation is simply offline.
- **Health Status**:
  - `Healthy`: All captured metrics and logs are within nominal ranges.
  - `Warning`: Transient high utilization, elevated error count, or active medium severity warning.
  - `Critical`: Sustained hardware threshold violations (e.g. CPU > 92% sustained, Disk > 95%, Network packet drop).
  - `Unknown`: Insufficient evidence or no telemetry snapshots received.

## 2. Python Monitoring Agent (`agent/labcare_agent`)
- Built using `psutil` for cross-platform compatibility across Windows 10/11 and Linux.
- Collects:
  - CPU utilization % via `psutil.cpu_percent(interval=0.5)`
  - RAM utilization % and available memory (MB) via `psutil.virtual_memory()`
  - Primary volume disk utilization % and free gigabytes via `psutil.disk_usage()`
  - Network reachability via lightweight non-blocking TCP socket connect check
- Transmits heartbeats and telemetry over HTTP/HTTPS to `/api/agent/heartbeat` and `/api/agent/metrics`.
- Uses SHA-256 token verification and bounded retries.
