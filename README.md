<<<<<<< HEAD
# Labcare-Ai
=======
# LabCare AI — AI-Powered Computer Lab Monitoring & Fault Diagnosis System

> **Enterprise IT Operations, Early Fault Prediction, Guided Diagnosis & Intelligent Troubleshooting System for College Computer Laboratories**

[![Python 3.11](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4%2B-F7931E.svg)](https://scikit-learn.org/)
[![Accuracy](https://img.shields.io/badge/Validation%20Accuracy-99.52%25-brightgreen.svg)]()

---

## 1. System Mission & Architecture
LabCare AI is built specifically for college and university computer laboratories. It empowers IT technicians and lab administrators to monitor hundreds of student workstations across multiple computer labs, detect early warning indicators before disruptive failure, perform evidence-based AI diagnostics, complete guided physical checklists, execute safe repair procedures, verify post-repair recovery, and consult an AI troubleshooting chatbot with local knowledge-base retrieval.

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

---

## 2. Core Functional Modules

| Module | Description |
| :--- | :--- |
| **Module A — Centralized Dashboard** | Aggregated counts, health distributions, incident charts, and prioritized early warning alerts derived from stored records. Clear DEMO MODE indicator. |
| **Module B — Device Registry & Monitoring** | Complete workstation registry across 3 college labs. Online/offline heartbeat connectivity decoupled from hardware health. Real-time CPU, RAM, disk, and network telemetry. |
| **Module C — Early Warning Engine** | Sustained processor spike detection, memory leak slope analysis, low storage threshold alerts, and repeated ICMP ping packet drop warnings. Cooldown deduplication. |
| **Module D — AI Diagnostic Engine** | Multi-modal fault inference combining a trained Random Forest classifier with deterministic telemetry rules. Discloses observed facts, model confidence score, likely causes, and missing evidence. |
| **Module E — Guided Verification Workflow** | Interactive technician verification checklists. Prevents unconfirmed model assumptions. Records outcomes as `Confirmed`, `Not Confirmed`, or `Inconclusive`. |
| **Module F — Safe Repair Guidance** | Recommendation-only SOP repair guidance. Preconditions, permissions, risk levels, and expected results. No unapproved destructive command execution. |
| **Module G — Recovery Verification** | Post-repair telemetry recollected and compared against baseline. Technicians confirm recovery before incidents can be marked `Resolved`. |
| **Module H — AI Troubleshooting Chatbot** | Local RAG retrieval over verified campus IT SOPs. Context-aware troubleshooting for specific workstations. Zero paid API dependency with deterministic fallback. |
| **Module I — Incident Lifecycle Management** | Full state transitions (`New` → `Investigating` → `Confirmed` → `Fix in Progress` → `Resolved` + `Not Confirmed`, `Inconclusive`, `Reopened`, `Escalated`). |
| **Module J — Knowledge Base** | Searchable Standard Operating Procedures repository covering high CPU, memory leaks, disk cleanup, network reconnection, and service crashes. |
| **Module K — Reports & History** | Incident metrics, MTTR (Mean Time to Resolution) computed from timestamps, lab distributions, and one-click CSV export. |
| **Module L — Cross-Platform Agent** | Outbound-only Python monitoring service using `psutil` with SHA-256 token authorization and bounded retries. |

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Python**: 3.9+ (Tested on Python 3.11.3)
- **Node.js**: 18+ (Tested on Node v24.14.1 / npm 11.11.0)

### Step 1: Install Backend & ML Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Run ML Pipeline & Train Classifier
```bash
# From repository root:
python ml/scripts/generate_data.py
python ml/scripts/train_classifier.py
python ml/scripts/evaluate_model.py
```
> Generated 2,100 samples with stratified 80/20 train/test split. Serialized model saved to `ml/artifacts/fault_classifier.joblib` and copied to backend services.

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

### Step 4: Run the Application

#### Terminal 1 — Start FastAPI Backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
- API Docs & Swagger UI: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

#### Terminal 2 — Start Vite React Frontend:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 4. Running the Automated Test Suite
Execute the comprehensive Pytest test suite covering all minimum requirements:
```bash
cd backend
python -m pytest tests/ -v
```
All 9 core scenario test suites pass:
1. `test_health_endpoint` — Validates API health check.
2. `test_device_online_after_heartbeat` — Proves online status transition upon heartbeat.
3. `test_device_offline_after_timeout_not_hardware_failed` — Confirms offline status is not mislabeled as hardware failure.
4. `test_metric_validation` — Enforces Pydantic schema validation boundaries.
5. `test_high_cpu_warning_detection_and_duplicate_suppression` — Validates sustained spike detection and alert deduplication.
6. `test_diagnosis_evidence_and_guided_verification` — Verifies evidence-based diagnosis and technician checklist recording.
7. `test_safe_repair_and_recovery_verification` — Validates repair logging and recovery confirmation before resolution.
8. `test_chatbot_deterministic_fallback_without_api_key` — Confirms chatbot operation without external API keys.
9. `test_unauthorized_agent_token_rejection` — Enforces SHA-256 token authorization for agents.

---

## 5. Enrolling a Real Physical Lab Workstation
1. Open the web dashboard and navigate to **Devices** → **Register Device**.
2. Enter the workstation details (e.g., `LAB-PHYSICAL-01`, Lab A, Row 1).
3. On the device page, click **Agent Token** to generate an enrollment token (`lca_agent_...`).
4. On the client computer (Windows or Linux):
   ```bash
   cd agent
   pip install -r requirements.txt
   python main.py --device-id LAB-PHYSICAL-01 --token <YOUR_TOKEN> --backend http://<SERVER_IP>:8000/api
   ```
5. The workstation will immediately report **Online** with live CPU, RAM, disk, and ping telemetry streaming into the dashboard.

---

## 6. Demonstration Walkthrough
1. **Explore the Centralized Dashboard**:
   - Notice the prominent `[DEMO MODE ACTIVE]` banner and stat cards.
   - Click the **Pulse Telemetry** button in the sidebar to simulate live heartbeat pulses and watch workstation metrics fluctuate.
2. **Investigate an Early Warning**:
   - Go to **Early Warnings** and view `LAB-A-03` (High CPU) or `LAB-A-08` (Memory Leak).
   - Review the supporting metric telemetry and click **Escalate to Incident**.
3. **Execute AI Diagnosis & Guided Verification**:
   - Navigate to **Diagnostic Center**. Select `LAB-A-03` and click **Run Diagnosis**.
   - Review the model score, observed facts vs hypotheses, and complete the physical verification checklist.
   - Select **Confirmed** and record technician observations.
4. **Follow Safe Repair & Recovery Verification**:
   - Follow the recommended SOP steps and click **Execute & Log Repair SOP**.
   - Perform the post-repair recovery check and verify that the incident transitions to **Resolved**.
5. **Consult the AI Troubleshooting Chatbot**:
   - Navigate to **AI Troubleshooting Chat**. Select `LAB-A-03` as workstation context.
   - Ask: *"The computer has 95% CPU and is lagging. How do I troubleshoot it?"*
   - Notice the deterministic RAG response citing the exact campus SOP document (`KB-CPU-001`).
6. **Generate Reports**:
   - Navigate to **Reports** to view incident counts by lab and category, MTTR, and export the audit log to CSV.

---

## 7. Security & Compliance
- **Zero Arbitrary Execution**: Never executes arbitrary AI-generated shell commands.
- **SHA-256 Token Storage**: Agent tokens are hashed before storage in the database.
- **Untrusted Log Handling**: Log text is sanitized to prevent prompt injection attempts.
>>>>>>> b8dc8d3 (initial stage completed)
