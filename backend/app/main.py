import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.api.api_router import api_router
from app.services.simulator_service import SimulatorService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("labcare.backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial demo data
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        SimulatorService.seed_initial_demo_data(db)
    except Exception as e:
        logger.error(f"Error seeding demo data: {e}")
    finally:
        db.close()
        
    logger.info("LabCare AI backend startup complete.")
    yield
    logger.info("LabCare AI backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="LabCare AI — AI-Powered Lab Computer Monitoring, Early Fault Prediction, Diagnosis and Intelligent Troubleshooting System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected",
        "demo_mode": settings.DEMO_MODE,
        "version": "1.0.0"
    }

# Master API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
