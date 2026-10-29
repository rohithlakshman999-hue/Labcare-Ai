# LabCare AI — API Reference Documentation

All endpoints follow RESTful conventions under the prefix `/api`.

## 1. System & Health
- `GET /api/health`
  - Returns backend service health, database status, and demo mode.
- `GET /api/settings`
  - Returns configurable threshold settings.
- `POST /api/settings`
  - Updates warning thresholds and heartbeat timeout settings.

## 2. Dashboard Analytics
- `GET /api/dashboard/summary`
  - Aggregates live device counts, health states, active warnings, and incidents awaiting confirmation/repair.
- `GET /api/dashboard/trends`
  - Returns health distribution, incident category counts, 7-day trend, and device CPU/RAM trend samples.

## 3. Workstations (Devices)
- `GET /api/devices`
  - Query parameters: `search`, `lab`, `health`, `connection`, `os`.
- `POST /api/devices`
  - Register new device.
- `GET /api/devices/{device_id}`
  - Returns workstation detail, health, and latest telemetry snapshot.
- `PATCH /api/devices/{device_id}`
  - Edit workstation location, display name, or active status.
- `POST /api/devices/{device_id}/enroll`
  - Generates a cryptographically secure agent enrollment token.
- `GET /api/devices/{device_id}/metrics`
  - Historical telemetry snapshots (CPU %, RAM %, Disk %, Network).
- `GET /api/devices/{device_id}/logs`
  - Recent relevant log events.

## 4. Diagnostics & Verification
- `POST /api/devices/{device_id}/diagnose`
  - Invokes AI diagnostic engine; returns structured report with model score, evidence, checklist, and safe repair guidance.
- `GET /api/diagnostics/{report_id}`
  - Retrieve diagnostic report by report ID.
- `POST /api/diagnostics/{report_id}/verification`
  - Record guided verification outcome (`confirmed`, `not_confirmed`, `inconclusive`) with technician observations.
- `POST /api/diagnostics/{report_id}/repair-records`
  - Record executed repair SOP and action notes.
- `POST /api/diagnostics/{report_id}/verify-recovery`
  - Fresh telemetry verification comparing post-repair metrics against baseline before incident closure.

## 5. Early Warnings
- `GET /api/warnings`
  - Query parameters: `status` (`new`, `acknowledged`, `investigating`, `resolved`, `dismissed`), `device_id`.
- `POST /api/warnings/{warning_id}/acknowledge`
- `POST /api/warnings/{warning_id}/resolve`
- `POST /api/warnings/{warning_id}/dismiss`
- `POST /api/warnings/{warning_id}/create-incident`

## 6. Incident Management
- `GET /api/incidents`
  - Query parameters: `status`, `severity`, `lab`, `device_id`.
- `POST /api/incidents`
  - Manually log an incident.
- `GET /api/incidents/{incident_id}`
- `PATCH /api/incidents/{incident_id}`
  - Update lifecycle state, assigned technician, or notes.

## 7. AI Troubleshooting Chat & Knowledge Base
- `POST /api/chat`
  - Request: `{ message: string, session_id?: string, device_id?: string }`.
  - Response: `{ reply: string, sources: array, is_fallback: bool, device_context_included: bool }`.
- `GET /api/chat/history`
- `DELETE /api/chat/history`
- `GET /api/knowledge`
  - Query parameters: `query`, `category`.
- `GET /api/knowledge/{doc_id}`

## 8. Agent Ingestion & Simulator
- `POST /api/agent/heartbeat?device_id=...`
  - Header: `Authorization: Bearer <token>`.
- `POST /api/agent/metrics`
  - Header: `Authorization: Bearer <token>`.
  - Ingests CPU, RAM, Disk, and Network telemetry; automatically triggers early warning rules.
- `POST /api/agent/logs`
- `POST /api/simulator/tick`
  - Injects realistic telemetry fluctuations across demo workstations.
