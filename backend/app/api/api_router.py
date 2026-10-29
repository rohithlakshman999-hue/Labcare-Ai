from fastapi import APIRouter
from app.api.routes import (
    dashboard,
    devices,
    warnings,
    diagnostics,
    incidents,
    knowledge,
    chat,
    reports,
    agent_api,
    settings_api
)

api_router = APIRouter()

api_router.include_router(dashboard.router)
api_router.include_router(devices.router)
api_router.include_router(warnings.router)
api_router.include_router(diagnostics.router)
api_router.include_router(incidents.router)
api_router.include_router(knowledge.router)
api_router.include_router(chat.router)
api_router.include_router(reports.router)
api_router.include_router(agent_api.router)
api_router.include_router(settings_api.router)
