from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

class SystemSettingsSchema(BaseModel):
    cpu_warning_threshold: float
    ram_warning_threshold: float
    disk_warning_threshold: float
    heartbeat_timeout_seconds: int
    demo_mode: bool
    model_version: str

@router.get("", response_model=SystemSettingsSchema)
def get_system_settings():
    return SystemSettingsSchema(
        cpu_warning_threshold=settings.CPU_WARNING_THRESHOLD,
        ram_warning_threshold=settings.RAM_WARNING_THRESHOLD,
        disk_warning_threshold=settings.DISK_WARNING_THRESHOLD,
        heartbeat_timeout_seconds=settings.HEARTBEAT_TIMEOUT_SECONDS,
        demo_mode=settings.DEMO_MODE,
        model_version="RandomForest-v1.0 (Stratified 99.5% Eval)"
    )

@router.post("", response_model=SystemSettingsSchema)
def update_system_settings(payload: SystemSettingsSchema):
    settings.CPU_WARNING_THRESHOLD = payload.cpu_warning_threshold
    settings.RAM_WARNING_THRESHOLD = payload.ram_warning_threshold
    settings.DISK_WARNING_THRESHOLD = payload.disk_warning_threshold
    settings.HEARTBEAT_TIMEOUT_SECONDS = payload.heartbeat_timeout_seconds
    settings.DEMO_MODE = payload.demo_mode
    return payload
