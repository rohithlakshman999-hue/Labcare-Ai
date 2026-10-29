import os
import re
from typing import List, Dict, Any

class RAGEngine:
    """
    Lightweight, deterministic, provider-independent local RAG engine.
    Indexes knowledge base documents and matches user query with fault symptoms and procedures.
    """
    _docs: List[Dict[str, Any]] = []

    @classmethod
    def load_knowledge_base(cls):
        if cls._docs:
            return cls._docs

        # Preloaded verified troubleshooting repository for college computer labs
        cls._docs = [
            {
                "doc_id": "KB-CPU-001",
                "title": "Diagnosis and Remediation of Runaway CPU Workloads in Lab Workstations",
                "fault_category": "Excessive CPU Usage",
                "symptoms": ["System unresponsiveness", "Cooling fan noise", "High task latency", "CPU usage > 85% sustained"],
                "required_evidence": ["Top CPU PID from Task Manager / top", "User context (student project or background daemon)"],
                "verification_procedure": [
                    "Open Task Manager (Ctrl+Shift+Esc) or run 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5'.",
                    "Check if the high CPU process is an interactive development session (e.g., Python, gcc, Java) or system service.",
                    "Verify if processor thermal throttling is occurring."
                ],
                "safe_repair_instructions": [
                    "1. Request the student or user to save any unsaved editor buffers.",
                    "2. If it is an infinite loop or runaway script, terminate the process gracefully using normal close or SIGTERM.",
                    "3. If an antivirus scanner is stuck, check if an excluded lab directory (e.g. large build directories) needs temporary bypass.",
                    "4. Refresh telemetry to confirm CPU usage drops below 30%."
                ],
                "risk_level": "Low",
                "post_repair_checks": ["Monitor CPU for 2 minutes to confirm stable baseline (< 40%).", "Verify student editor remains functional."],
                "source_reference": "LabCare IT SOP: Workstation Performance Tuning v2.1"
            },
            {
                "doc_id": "KB-RAM-002",
                "title": "Investigation and Recovery of Memory Exhaustion and RAM Leaks",
                "fault_category": "High Memory Utilization",
                "symptoms": ["Heavy disk thrashing / paging", "Application freeze / Out-Of-Memory errors", "Available memory < 500 MB"],
                "required_evidence": ["Committed memory vs physical RAM", "Process working set sizes", "Non-paged pool memory allocation"],
                "verification_procedure": [
                    "Open Resource Monitor -> Memory tab.",
                    "Inspect commit charge and identify whether browser processes, Docker, or JVM have unbounded memory allocation.",
                    "Check whether multiple disconnected student user sessions are logged in simultaneously."
                ],
                "safe_repair_instructions": [
                    "1. Close inactive browser tabs or background development tools.",
                    "2. If a disconnected background student session is holding 8+ GB RAM, log off the disconnected session through Task Manager Users tab.",
                    "3. If Docker daemon is consuming excessive RAM, restart the Docker Desktop service or limit memory allocation in .wslconfig.",
                    "4. Recollect fresh RAM metrics."
                ],
                "risk_level": "Low",
                "post_repair_checks": ["Available memory must recover to >= 2048 MB.", "System responsiveness restored."],
                "source_reference": "LabCare IT SOP: Memory Management in Shared Workstations"
            },
            {
                "doc_id": "KB-DISK-003",
                "title": "Remediation of Critical Low Disk Space on Lab Operating System Volumes",
                "fault_category": "Low Disk Space",
                "symptoms": ["'Low Disk Space' warning banners", "Software installs failing", "System update failures", "Free space < 5 GB"],
                "required_evidence": ["Disk volume breakdown", "Size of student temp directories", "Windows Update cleanup availability"],
                "verification_procedure": [
                    "Check drive properties in File Explorer or run 'Get-PSDrive C'.",
                    "Inspect C:\\Users for orphaned student accounts from prior semesters.",
                    "Examine C:\\Windows\\Temp and %TEMP% directory sizes."
                ],
                "safe_repair_instructions": [
                    "1. Run cleanmgr.exe (Windows Disk Cleanup) with system file cleanup enabled to purge old update files and shadow copies.",
                    "2. Never delete student files automatically without authorization.",
                    "3. Prune cached pip, npm, or conda packages in shared lab profiles.",
                    "4. Empty workstation Recycle Bin."
                ],
                "risk_level": "Low - Medium (Never delete user files without review)",
                "post_repair_checks": ["Free disk space exceeds 15 GB or volume utilization drops below 80%."],
                "source_reference": "LabCare IT SOP: Storage Maintenance & Cleanliness"
            },
            {
                "doc_id": "KB-NET-004",
                "title": "Network Drop and Ethernet Connectivity Troubleshooting",
                "fault_category": "Network Connectivity Failure",
                "symptoms": ["Network icon displays disconnected or 'No Internet'", "Failed gateway ping", "DHCP APIPA address (169.254.x.x)"],
                "required_evidence": ["Physical link LED status", "IP configuration (ipconfig /all)", "Default gateway ping response"],
                "verification_procedure": [
                    "Physically inspect the RJ-45 cable on the back of the desktop and the lab wall jack.",
                    "Check if the link lights (green/amber) are blinking.",
                    "Open Command Prompt and run 'ipconfig /all'. Check if an IPv4 address in the lab subnet is assigned."
                ],
                "safe_repair_instructions": [
                    "1. Unplug and securely reseat the ethernet cable on both ends until a distinct click is heard.",
                    "2. Run 'ipconfig /release' then 'ipconfig /renew' to request a new lease from the campus DHCP server.",
                    "3. If adapter is stuck, disable and re-enable the network adapter via Network Connections control panel.",
                    "4. If still down, test with a known good patch cable or plug into adjacent switch port."
                ],
                "risk_level": "Low",
                "post_repair_checks": ["Ping 8.8.8.8 and local lab gateway successfully with 0% packet loss."],
                "source_reference": "LabCare IT SOP: Campus Network & Subnet Troubleshooting"
            },
            {
                "doc_id": "KB-SVC-005",
                "title": "Lab System Service and Application Crash Loop Resolution",
                "fault_category": "Software / Application Errors",
                "symptoms": ["Service fails on startup with code 1067", "Application event log filled with crash entries", "Software closes immediately upon launch"],
                "required_evidence": ["Event Viewer Event ID (1000/1001 for app crash, 7034 for service crash)", "Faulting module name"],
                "verification_procedure": [
                    "Open Event Viewer -> Windows Logs -> Application.",
                    "Find Error events for the crashed executable and record 'Faulting module path'.",
                    "Check if a recent antivirus quarantine action removed a lab library file."
                ],
                "safe_repair_instructions": [
                    "1. Check services.msc to verify dependent services (e.g., RPC, Remote Desktop, or Database daemon) are running.",
                    "2. Run repair installation from Windows Add/Remove programs or re-register corrupted DLLs if indicated.",
                    "3. Restart the specific lab service safely.",
                    "4. Verify the application launches successfully."
                ],
                "risk_level": "Low",
                "post_repair_checks": ["Event log shows 0 crash events during test launch.", "Service status is 'Running'."],
                "source_reference": "LabCare IT SOP: Application & Service Diagnostics"
            }
        ]
        return cls._docs

    @classmethod
    def search(cls, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Search knowledge base using token matching and relevance scoring.
        """
        docs = cls.load_knowledge_base()
        query_words = set(re.findall(r"\w+", query.lower()))
        scored = []
        for doc in docs:
            score = 0
            doc_text = (
                f"{doc['title']} {doc['fault_category']} {' '.join(doc['symptoms'])} "
                f"{' '.join(doc['required_evidence'])} {' '.join(doc['safe_repair_instructions'])}"
            ).lower()
            doc_words = set(re.findall(r"\w+", doc_text))
            
            # Category match bonus
            if doc['fault_category'].lower() in query.lower():
                score += 10

            # Word overlap
            overlap = query_words.intersection(doc_words)
            score += len(overlap)

            scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored[:top_k] if score > 0]
