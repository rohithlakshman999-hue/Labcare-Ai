@echo off
title LabCare AI Agent
echo ====================================================
echo         LabCare AI - Workstation Monitoring
echo ====================================================
echo Starting agent from agent_config.json...
python main.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Agent could not start or configuration missing.
    echo Launching easy setup wizard...
    echo.
    python connect.py
)
pause
