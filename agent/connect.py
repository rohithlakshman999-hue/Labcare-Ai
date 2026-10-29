#!/usr/bin/env python3
"""
LabCare AI — Easy Workstation Connect Utility
One-command setup to onboard any computer to the LabCare AI monitoring system.
"""

import os
import sys
import json
import socket
import platform
import argparse

def ensure_dependencies():
    missing = []
    try:
        import requests
    except ImportError:
        missing.append("requests")
    try:
        import psutil
    except ImportError:
        missing.append("psutil")

    if missing:
        print(f"Missing required packages: {', '.join(missing)}")
        print("Installing automatically via pip...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", *missing])
            print("Dependencies installed successfully!\n")
        except Exception as e:
            print(f"Failed to install dependencies: {e}")
            print(f"Please run manually: pip install {' '.join(missing)}")
            sys.exit(1)

ensure_dependencies()
import requests

DEFAULT_SERVER_IP = "10.10.198.220"

def clean_url(server: str) -> str:
    s = server.strip().rstrip("/")
    if not s.startswith("http://") and not s.startswith("https://"):
        s = f"http://{s}"
    if ":" not in s.replace("http://", "").replace("https://", ""):
        s = f"{s}:8000"
    if not s.endswith("/api"):
        s = f"{s}/api"
    return s

def test_server(base_url: str):
    try:
        health_url = f"{base_url}/health"
        res = requests.get(health_url, timeout=4)
        if res.status_code == 200:
            return True, res.json()
        return False, f"Server responded with HTTP {res.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    parser = argparse.ArgumentParser(description="LabCare AI — Easy Workstation Connect")
    parser.add_argument("--server", help=f"Central server IP or URL (default: {DEFAULT_SERVER_IP})")
    parser.add_argument("--device", help="Workstation Device ID (e.g. JB1, PC-02)")
    parser.add_argument("--name", help="Display name for this workstation")
    parser.add_argument("--token", help="Agent enrollment token (leave empty for auto-enroll)")
    parser.add_argument("--interval", type=int, default=5, help="Telemetry collection interval (seconds)")
    parser.add_argument("--start", action="store_true", help="Start agent immediately after connecting")

    args = parser.parse_args()

    print("====================================================")
    print("      LabCare AI — Easy Workstation Connect         ")
    print("====================================================")
    print("Connect this computer to the LabCare AI dashboard.")
    print("----------------------------------------------------")

    # Step 1: Server URL
    server_input = args.server
    if not server_input:
        prompt_val = input(f"Enter Server IP/URL [default: {DEFAULT_SERVER_IP}]: ").strip()
        server_input = prompt_val if prompt_val else DEFAULT_SERVER_IP

    backend_url = clean_url(server_input)
    print(f"\n[1/4] Checking connection to server at {backend_url}...")
    reachable, info = test_server(backend_url)

    if not reachable:
        print(f"[!] Warning: Could not reach server: {info}")
        print("    Troubleshooting checklist:")
        print(f"    1. Are both computers connected to the same Wi-Fi / Hotspot?")
        print(f"    2. Is the server running (uvicorn app.main:app)?")
        print(f"    3. On the server laptop, is Wi-Fi set to 'Private network' in Windows Settings?")
        proceed = input("\nDo you still want to save this configuration? [y/N]: ").strip().lower()
        if proceed != "y":
            print("Aborted.")
            sys.exit(1)
    else:
        print(f"    [OK] Central server is reachable! Service: {info.get('service', 'LabCare AI')}")

    # Step 2: Device Identifier
    hostname = socket.gethostname()
    os_name = f"{platform.system()} {platform.release()}"

    device_id = args.device
    if not device_id:
        prompt_dev = input(f"\n[2/4] Workstation ID (e.g. JB1, LAB-PC-02) [default: {hostname}]: ").strip().upper()
        device_id = prompt_dev if prompt_dev else hostname

    display_name = args.name or device_id

    # Step 3: Token
    token = args.token
    if not token:
        token_input = input(f"\n[3/4] Enter Agent Token (press ENTER to auto-enroll): ").strip()
        if token_input:
            token = token_input
        else:
            print(f"    Requesting automatic enrollment for '{device_id}' from server...")
            try:
                enroll_res = requests.post(
                    f"{backend_url}/agent/quick-enroll",
                    json={
                        "device_id": device_id,
                        "display_name": display_name,
                        "operating_system": os_name
                    },
                    timeout=5
                )
                if enroll_res.status_code == 200:
                    data = enroll_res.json()
                    token = data.get("token")
                    print(f"    [OK] Enrolled! Received authorized token: {token[:12]}...")
                else:
                    print(f"    [!] Auto-enroll returned HTTP {enroll_res.status_code}: {enroll_res.text}")
                    token = input("    Please paste your Agent Token manually: ").strip()
            except Exception as e:
                print(f"    [!] Auto-enroll request failed: {e}")
                token = input("    Please paste your Agent Token manually: ").strip()

    if not token:
        print("[!] Error: No agent token provided. Cannot proceed.")
        sys.exit(1)

    # Step 4: Save configuration
    config_data = {
        "server_ip": server_input,
        "backend_url": backend_url,
        "device_id": device_id,
        "token": token,
        "interval": args.interval
    }

    target_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(target_dir, "agent_config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2)

    print(f"\n[4/4] Configuration successfully saved to:")
    print(f"      {config_path}")

    # Create start_agent.bat for Windows
    bat_path = os.path.join(target_dir, "start_agent.bat")
    with open(bat_path, "w", encoding="utf-8") as f:
        f.write("@echo off\n")
        f.write("title LabCare AI Agent\n")
        f.write("echo Starting LabCare AI Monitoring Agent...\n")
        f.write(f'"{sys.executable}" main.py\n')
        f.write("pause\n")

    print(f"      Created 1-click launcher: {os.path.basename(bat_path)}")

    # Send initial heartbeat test
    print("\nSending initial test heartbeat...")
    try:
        hb_res = requests.post(
            f"{backend_url}/agent/heartbeat?device_id={device_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=4
        )
        if hb_res.status_code == 200:
            print("    [OK] Heartbeat accepted! Workstation is now ONLINE on dashboard.")
        else:
            print(f"    [!] Heartbeat returned HTTP {hb_res.status_code}: {hb_res.text}")
    except Exception as e:
        print(f"    [!] Heartbeat ping failed: {e}")

    print("\n====================================================")
    print("               SETUP COMPLETE!                      ")
    print("====================================================")
    print(f"Workstation {device_id} is now configured.")
    print("To start monitoring in future, simply run:")
    print("    python main.py")
    print("or double-click 'start_agent.bat'")
    print("====================================================")

    auto_start = args.start
    if not auto_start:
        choice = input("\nWould you like to start monitoring now? [Y/n]: ").strip().lower()
        if choice != "n":
            auto_start = True

    if auto_start:
        print("\nStarting monitoring agent...\n")
        import subprocess
        subprocess.run([sys.executable, os.path.join(target_dir, "main.py")])

if __name__ == "__main__":
    main()
