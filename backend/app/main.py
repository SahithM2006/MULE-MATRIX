"""
MULE MATRIX Backend Application Gateway.
FastAPI ASGI application with typed routes, CORS middleware, and unified error handling.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import config
from backend.app.core.logging import logger
from backend.app.db.database import init_db
from backend.app.data.synthetic_generator import populate_database
from backend.app.services.detection_service import run_full_detection_pipeline
from backend.app.api.system import router as system_router
from backend.app.api.observe import router as observe_router
from backend.app.api.trace import router as trace_router
from backend.app.api.detect import router as detect_router
from backend.app.api.respond import router as respond_router
from backend.app.api.simulate import router as simulate_router
from backend.app.evaluation.benchmark import run_benchmark_evaluation, BENCHMARK_FILE

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database initialized and ready
    logger.info("Initializing MULE MATRIX backend services...")
    init_db()
    
    # Check if DB has data; if not, seed default dataset
    from backend.app.db.database import get_connection
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM accounts;")
        count = cursor.fetchone()[0]
        if count == 0:
            logger.info("Database is empty. Seeding initial synthetic dataset...")
            populate_database()
            run_full_detection_pipeline()
            run_benchmark_evaluation()
    finally:
        conn.close()

    yield
    logger.info("Shutting down MULE MATRIX services.")

app = FastAPI(
    title=config.app_name,
    description="TRACE THE FLOW. EXPOSE THE NETWORK. High-throughput graph intelligence and token lineage platform.",
    version=config.version,
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standardized Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": str(exc),
            "path": request.url.path
        }
    )

# Mount API v1 Routers
app.include_router(system_router, prefix="/api/v1")
app.include_router(observe_router, prefix="/api/v1")
app.include_router(trace_router, prefix="/api/v1")
app.include_router(detect_router, prefix="/api/v1")
app.include_router(respond_router, prefix="/api/v1")
app.include_router(simulate_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": config.app_name,
        "tagline": config.tagline,
        "version": config.version,
        "status": "ONLINE",
        "simulation_mode": config.simulation_mode,
        "documentation": "/docs"
    }
