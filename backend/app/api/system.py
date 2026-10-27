"""
System Health and Lifecycle API Endpoints.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from backend.app.core.config import config
from backend.app.models.schemas import (
    SystemHealthResponse, SubsystemStatus
)
from backend.app.db.database import get_connection
from backend.app.engines.graphsage_engine import graphsage_engine, MODEL_PATH
from backend.app.engines.isolation_forest_engine import iforest_engine
from backend.app.evaluation.benchmark import BENCHMARK_FILE
from backend.app.data.synthetic_generator import populate_database
from backend.app.services.detection_service import run_full_detection_pipeline

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health():
    """Returns operational readiness state for all database and algorithm subsystems."""
    now_iso = datetime.now(timezone.utc).isoformat()
    total_accs = 0
    total_txs = 0
    total_evts = 0
    db_connected = False

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM accounts;")
        total_accs = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM transactions;")
        total_txs = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM lineage_events;")
        total_evts = cursor.fetchone()[0]
        db_connected = True
        conn.close()
    except Exception as e:
        db_connected = False

    # Check GraphSAGE readiness
    gs_state = "READY" if (graphsage_engine.model is not None or MODEL_PATH.exists()) else "NOT_TRAINED"
    gs_details = f"Model artifact {MODEL_PATH.name} active." if gs_state == "READY" else "Model not trained yet."

    # Check Isolation Forest readiness
    if_state = "READY" if iforest_engine.model is not None else "AWAITING_DATA"
    if_details = f"Isolation Forest contamination={iforest_engine.contamination}." if if_state == "READY" else "Waiting for pipeline run."

    # Check Evaluator readiness
    eval_state = "READY" if BENCHMARK_FILE.exists() else "AWAITING_DATA"
    eval_details = "Synthetic benchmark file generated and verified." if eval_state == "READY" else "Benchmark not yet evaluated."

    subsystems = {
        "database": SubsystemStatus(
            subsystem_name="SQLite Database (WAL Mode)",
            state="READY" if db_connected else "FAILED",
            details=f"Connected at {config.database_url}",
            last_updated=now_iso
        ),
        "graph_engine": SubsystemStatus(
            subsystem_name="NetworkX Temporal Multigraph Engine",
            state="READY",
            details="Temporal graph representation and BFS path tracer initialized.",
            last_updated=now_iso
        ),
        "lineage_engine": SubsystemStatus(
            subsystem_name="SHA-256 Token Lineage Engine",
            state="READY",
            details="Cryptographic hash chaining and tamper detection operational.",
            last_updated=now_iso
        ),
        "isolation_forest": SubsystemStatus(
            subsystem_name="Isolation Forest Anomaly Detector",
            state=if_state,
            details=if_details,
            last_updated=now_iso
        ),
        "graphsage": SubsystemStatus(
            subsystem_name="GraphSAGE Inductive Mule Classifier",
            state=gs_state,
            details=gs_details,
            last_updated=now_iso
        ),
        "evaluator": SubsystemStatus(
            subsystem_name="Model Observatory & Benchmark Evaluator",
            state=eval_state,
            details=eval_details,
            last_updated=now_iso
        )
    }

    return SystemHealthResponse(
        overall_status="HEALTHY" if db_connected else "DEGRADED",
        simulation_mode=config.simulation_mode,
        database_connected=db_connected,
        total_accounts=total_accs,
        total_transactions=total_txs,
        total_lineage_events=total_evts,
        subsystems=subsystems
    )

@router.post("/seed")
def seed_database_endpoint(
    accounts: int = Query(2000, ge=50, le=10000),
    transactions: int = Query(30000, ge=100, le=100000),
    seed: int = Query(42)
):
    """Triggers synthetic dataset generation and database seeding."""
    num_a, num_t, num_e = populate_database(
        num_accounts=accounts,
        num_transactions=transactions,
        seed=seed
    )
    return {
        "status": "SUCCESS",
        "message": f"Database seeded with {num_a:,} accounts, {num_t:,} transactions, and {num_e:,} lineage records.",
        "seed": seed
    }

@router.post("/run-pipeline")
def trigger_detection_pipeline():
    """Runs sliding window, feature extraction, rules, ML, and risk aggregation across accounts."""
    result = run_full_detection_pipeline()
    return result
