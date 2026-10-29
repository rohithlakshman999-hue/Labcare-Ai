# LabCare AI — System Architecture & Design

## 1. High-Level Architecture Overview
LabCare AI is a full-stack, AI-powered computer laboratory monitoring, early fault prediction, diagnosis, and intelligent troubleshooting platform designed for college and university IT operations.

```
+-----------------------------------------------------------------------------------------+
|                                    LabCare AI Web UI                                    |
|   (React 19 + TypeScript + Vite + Tailwind CSS + Recharts + React Router)               |
|                                                                                         |
|   [Overview]  [Devices]  [Early Warnings]  [Diagnostic Center]  [Incidents]             |
|   [AI Troubleshooting Chatbot]  [Knowledge Base]  [Reports & History]  [Settings]       |
+--------------------------------------------^--------------------------------------------+
                                             | Authenticated REST APIs
                                             v
+-----------------------------------------------------------------------------------------+
|                                  FastAPI Backend Engine                                 |
|                                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  +------------+  |
|  | Early Warning      |  | AI Diagnostic      |  | Local RAG Engine  |  | Simulator  |  |
|  | Engine             |  | Fusion Engine      |  | (Deterministic /  |  | & Seeder   |  |
|  | (Spikes/Leaks/     |  | (ML Classifier +   |  |  Optional LLM)    |  | Service    |  |
|  |  Network Drops)    |  |  Deterministic)    |  |                   |  |            |  |
|  +--------------------+  +--------------------+  +-------------------+  +------------+  |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | SQLAlchemy 2.0 ORM & SQLite Persistence (PostgreSQL Compatible Schema)            |  |
|  | Devices | MetricSnapshots | LogEvents | EarlyWarnings | Incidents | Reports       |  |
|  +-----------------------------------------------------------------------------------+  |
+--------------------------------------------^--------------------------------------------+
                                             | Authenticated Heartbeat & Metric Ingestion
                                             | (Outbound HTTPS / Token Auth)
+--------------------------------------------+--------------------------------------------+
|                                                                                         |
|  +-------------------------------------+      +-------------------------------------+   |
|  | Client PC 1 (Windows 11)            |      | Client PC 2 (Ubuntu Linux)          |   |
|  | Python labcare-agent (psutil)       |      | Python labcare-agent (psutil)       |   |
|  | CPU / RAM / Disk / Network checks   |      | CPU / RAM / Disk / Network checks   |   |
|  +-------------------------------------+      +-------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

## 2. Key Modules
1. **Centralized Operations Dashboard**:
   Aggregated counts and telemetry charts derived directly from stored database records. Clear persistent DEMO MODE indicator.
2. **Device Registry & Live Monitoring**:
   Workstation enrollment with SHA-256 hashed agent tokens. Heartbeat-based online/offline connectivity distinctly decoupled from hardware health.
3. **Early Warning & Predictive Maintenance**:
   Transparent detection rules detecting sustained CPU spikes, memory leak slopes, low disk volume thresholds, and repeated ping packet drops. Alert deduplication with cooldown.
4. **AI Diagnostic Engine**:
   Combines Random Forest multi-class telemetry predictions (99.52% accuracy) with deterministic expert rules. Discloses observed physical facts, model confidence, likely causes (hypotheses), and missing evidence.
5. **Guided Verification Workflow**:
   Prevents unconfirmed model assumptions. Technicians follow an ordered physical checklist and record findings as Confirmed, Not Confirmed, or Inconclusive.
6. **Safe Repair Guidance (Recommendation-Only)**:
   Preconditions, permissions, risk levels, and numbered safe steps. No arbitrary shell command execution without approval.
7. **Recovery Verification**:
   Fresh post-repair telemetry comparison against baseline before closing incidents.
8. **AI Troubleshooting Chatbot**:
   Local RAG retrieval over verified campus IT Standard Operating Procedures with deterministic fallback requiring no paid external APIs.
