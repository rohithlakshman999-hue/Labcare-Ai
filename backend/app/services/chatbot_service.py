import os
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import httpx

from app.core.config import settings
from app.models.all_models import Device, MetricSnapshot, EarlyWarning, Incident, DiagnosticReport, ChatMessage
from app.services.rag_engine import RAGEngine

class ChatbotService:
    @staticmethod
    async def process_chat(db: Session, message: str, session_id: str = "default_session", device_id: Optional[str] = None) -> Dict[str, Any]:
        """
        AI Troubleshooting Chatbot with local RAG retrieval, device context injection,
        and deterministic troubleshooting fallback.
        """
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            device_id=device_id,
            role="user",
            content=message
        )
        db.add(user_msg)
        db.commit()

        # 1. Context Construction
        device_context = None
        device_summary = ""
        if device_id:
            dev = db.query(Device).filter(Device.device_id == device_id).first()
            if dev:
                latest_m = db.query(MetricSnapshot).filter(
                    MetricSnapshot.device_id == device_id
                ).order_by(MetricSnapshot.captured_at.desc()).first()

                active_w = db.query(EarlyWarning).filter(
                    EarlyWarning.device_id == device_id,
                    EarlyWarning.status.in_(["new", "acknowledged", "investigating"])
                ).all()

                active_inc = db.query(Incident).filter(
                    Incident.device_id == device_id,
                    Incident.status.in_(["new", "investigating", "confirmed", "fix_in_progress"])
                ).first()

                device_context = {
                    "device_id": dev.device_id,
                    "display_name": dev.display_name,
                    "lab_name": dev.lab_name,
                    "connection_status": dev.connection_status,
                    "health_status": dev.health_status,
                    "cpu_pct": latest_m.cpu_usage_pct if latest_m else "N/A",
                    "ram_pct": latest_m.ram_usage_pct if latest_m else "N/A",
                    "disk_pct": latest_m.disk_usage_pct if latest_m else "N/A",
                    "active_warnings": [w.category for w in active_w],
                    "active_incident": active_inc.fault_category if active_inc else None
                }

                device_summary = (
                    f"Workstation {dev.display_name} ({dev.device_id}) in {dev.lab_name}: "
                    f"Status={dev.connection_status}, Health={dev.health_status}, "
                    f"CPU={device_context['cpu_pct']}%, RAM={device_context['ram_pct']}%, Disk={device_context['disk_pct']}%. "
                    f"Active Warnings: {', '.join(device_context['active_warnings']) if device_context['active_warnings'] else 'None'}. "
                    f"Incident: {device_context['active_incident'] or 'None'}."
                )

        # 2. Local Knowledge Retrieval
        kb_results = RAGEngine.search(f"{message} {device_summary}", top_k=2)

        # 3. LLM API or Deterministic Fallback
        is_fallback = True
        reply_content = ""

        # Try external LLM if key configured
        if settings.OPENAI_API_KEY:
            try:
                system_prompt = (
                    "You are LabCare AI Assistant, an enterprise IT diagnostics and lab computer maintenance expert. "
                    "You provide strictly evidence-based, safe, and factual guidance for college computer labs. "
                    "Never invent unmeasured telemetry or claim unverified repairs succeeded. "
                    "Clearly distinguish observed telemetry from hypotheses. Provide safe, non-destructive step-by-step checks."
                )
                kb_context_str = "\n\n".join([
                    f"Document: {d['title']} ({d['doc_id']})\nSymptoms: {', '.join(d['symptoms'])}\nRepair Procedure: {' '.join(d['safe_repair_instructions'])}"
                    for d in kb_results
                ])

                user_prompt = f"User Question: {message}\n"
                if device_summary:
                    user_prompt += f"\nDevice Telemetry Context:\n{device_summary}\n"
                if kb_context_str:
                    user_prompt += f"\nRelevant Verified SOP Knowledge:\n{kb_context_str}\n"

                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={
                            "model": settings.OPENAI_MODEL,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "temperature": 0.2
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        reply_content = data["choices"][0]["message"]["content"]
                        is_fallback = False
            except Exception as e:
                print(f"External LLM invocation failed, using deterministic fallback: {e}")

        # Deterministic Troubleshooting Fallback
        if not reply_content:
            is_fallback = True
            reply_content = ChatbotService._generate_deterministic_reply(message, device_context, kb_results)

        # Save assistant message
        assistant_msg = ChatMessage(
            session_id=session_id,
            device_id=device_id,
            role="assistant",
            content=reply_content,
            sources_used=json.dumps([{"doc_id": d["doc_id"], "title": d["title"]} for d in kb_results])
        )
        db.add(assistant_msg)
        db.commit()

        return {
            "reply": reply_content,
            "sources": [{"doc_id": d["doc_id"], "title": d["title"], "source": d["source_reference"]} for d in kb_results],
            "is_fallback": is_fallback,
            "device_context_included": device_context is not None
        }

    @staticmethod
    def _generate_deterministic_reply(message: str, device_context: Optional[Dict[str, Any]], kb_results: list) -> str:
        msg_lower = message.lower()
        parts = []

        # Context header
        if device_context:
            parts.append(
                f"### Workstation Context: {device_context['display_name']} ({device_context['device_id']})\n"
                f"- **Lab Location**: {device_context['lab_name']}\n"
                f"- **Connectivity / Health**: {device_context['connection_status'].capitalize()} | {device_context['health_status'].capitalize()}\n"
                f"- **Observed Metrics**: CPU: `{device_context['cpu_pct']}%`, RAM: `{device_context['ram_pct']}%`, Disk: `{device_context['disk_pct']}%`\n"
            )
            if device_context.get("active_warnings"):
                parts.append(f"> [!WARNING]\n> Active Early Warnings: **{', '.join(device_context['active_warnings'])}**\n")

        # Specific Query Matching
        if any(w in msg_lower for w in ["cpu", "slow", "freeze", "runaway", "fan", "hang"]):
            parts.append("### High CPU & Workstation Slowness Guidance\n")
            parts.append(
                "**Observed Pattern**: Sustained high processor utilization in lab environments is commonly caused by runaway student compilation, infinite execution loops in code, or hung background indexing.\n\n"
                "**Safe Verification Steps**:\n"
                "1. **Identify Offending Process**: Launch Task Manager (`Ctrl+Shift+Esc`) or execute `Get-Process | Sort-Object CPU -Descending | Select-Object -First 5`.\n"
                "2. **Determine Process Ownership**: Check whether the process is an interactive user project (e.g. `python.exe`, `gcc.exe`, `node.exe`) or a system service.\n"
                "3. **Safe Mitigation**: Request user to save active editor files, then close or terminate the specific PID cleanly.\n"
                "4. **Verification**: Confirm CPU utilization drops below 30% for at least 2 minutes.\n"
            )
        elif any(w in msg_lower for w in ["ram", "memory", "leak", "oom", "out of memory"]):
            parts.append("### Memory Exhaustion & RAM Leak Guidance\n")
            parts.append(
                "**Observed Pattern**: High memory commitment (> 85%) leads to intense paging file thrashing, causing heavy lag and Out-Of-Memory application terminations.\n\n"
                "**Safe Verification Steps**:\n"
                "1. **Check Resource Monitor**: Inspect the Memory tab to identify whether private working set or non-paged pool is dominating.\n"
                "2. **Check Inactive Student Sessions**: Confirm if previous student sessions are still logged in and holding multi-gigabyte memory footprints.\n"
                "3. **Safe Mitigation**: Cleanly close heavy idle instances (e.g. Docker, Android Studio, multiple Chrome tabs) or log off disconnected user sessions.\n"
            )
        elif any(w in msg_lower for w in ["disk", "storage", "full", "space", "clean"]):
            parts.append("### Storage Volume & Low Disk Space Guidance\n")
            parts.append(
                "**Observed Pattern**: Disk volume utilization approaching 90%+ prevents OS updates, compiler temp files, and virtual memory expansion.\n\n"
                "**Safe Verification Steps**:\n"
                "1. **Check Volume Capacities**: Inspect `Get-PSDrive C` to see precise free gigabytes.\n"
                "2. **Safe Mitigation**: Run Windows built-in `cleanmgr.exe` to safely purge temporary system files and previous update caches.\n"
                "3. **Caution**: Never delete student data or user directory files without explicit laboratory technician authorization.\n"
            )
        elif any(w in msg_lower for w in ["net", "network", "ethernet", "ping", "disconnect", "offline", "cable"]):
            parts.append("### Network Connectivity & Packet Loss Guidance\n")
            parts.append(
                "**Observed Pattern**: Repeated ping drops or missing heartbeats indicate physical link loss, DHCP lease timeout, or local adapter state.\n\n"
                "**Safe Verification Steps**:\n"
                "1. **Physical Inspection**: Inspect the RJ-45 cable on the workstation and verify ethernet link LEDs are lit.\n"
                "2. **Verify IP Assignment**: Run `ipconfig /all`. Check if an address in the lab subnet is assigned (avoid APIPA `169.254.x.x`).\n"
                "3. **Safe Mitigation**: Re-seat cable firmly, run `ipconfig /release` and `ipconfig /renew` to refresh lease.\n"
            )
        else:
            parts.append("### LabCare IT Diagnostics Assistant\n")
            parts.append(
                "I am ready to assist with lab computer monitoring, early fault prediction, guided checklist verification, and safe repair procedures.\n\n"
                "**Common areas I can assist with**:\n"
                "- Analyzing high CPU utilization and identifying runaway student scripts\n"
                "- Investigating memory exhaustion and RAM leaks\n"
                "- Low disk space remediation and safe cleanup procedures\n"
                "- Resolving ethernet network connectivity drops and heartbeat timeouts\n"
                "- Explaining diagnostic reports and verifying post-repair recovery\n"
            )

        # Knowledge Base Citations
        if kb_results:
            parts.append("\n**Referenced Knowledge Base Procedures**:\n")
            for doc in kb_results:
                parts.append(f"- **{doc['title']}** (`{doc['doc_id']}`) — *{doc['source_reference']}*\n")

        parts.append("\n*(Deterministic Evidence-Based Mode — No external LLM key required)*")
        return "\n".join(parts)
