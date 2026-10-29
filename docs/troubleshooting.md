# LabCare AI — Guided Troubleshooting & SOP Manual

## 1. Guided Verification Workflow
When an AI diagnosis predicts a potential fault, technicians do not execute destructive actions automatically. Instead, they complete an evidence checklist:

```
[ AI Model Prediction ]
         │
         ▼
[ Guided Verification Checklist ]
         │
         ├── 1. Physical inspection of workstation (LED, cable, fan noise)
         ├── 2. Process attribution in Task Manager / top
         └── 3. Corroboration with student session context
         │
         ▼
[ Technician Finding Recorded ]
  ├── Confirmed   ──> Proceeds to Safe Repair SOP
  ├── Not Confirmed ──> Documented as false positive; alternative triage
  └── Inconclusive  ──> Gathers additional diagnostic logs
```

## 2. Safe Repair Procedures (Recommendation-Only)
- **High CPU**: Save student work -> terminate offending process via clean exit/SIGTERM -> confirm telemetry recovers below 30%.
- **High RAM / Leak**: Close idle browser tabs or background containers -> log off disconnected student sessions holding RAM -> verify free memory > 2048 MB.
- **Low Disk**: Run Windows Disk Cleanup (`cleanmgr.exe`) -> purge outdated build caches -> audit student scratch directories. Never delete user files without review.
- **Network Drop**: Reseat physical RJ-45 cable -> refresh DHCP lease (`ipconfig /renew`) -> verify gateway ping response.

## 3. Recovery Verification Criteria
Incidents cannot be resolved without post-repair telemetry verification:
1. Fresh telemetry snapshot collected after repair action.
2. Target metric returns to normal baseline.
3. Technician inputs confirmation notes and marks recovery successful.
