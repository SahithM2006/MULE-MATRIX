"""
Core configuration settings and thresholds for MULE MATRIX.
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from pathlib import Path
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


class AppConfig(BaseModel):
    app_name: str = "MULE MATRIX"
    tagline: str = "TRACE THE FLOW. EXPOSE THE NETWORK."
    version: str = "1.0.0"
    simulation_mode: bool = True
    database_url: str = str(DATA_DIR / "mule_matrix.db")
    artifacts_dir: str = str(ARTIFACTS_DIR)
    
    # Feature & Algorithm Versions
    feature_schema_version: str = "v1.0"
    model_version: str = "graphsage_v1.0"
    isolation_forest_version: str = "iforest_v1.0"
    louvain_seed: int = 42
    random_seed: int = 42

    # Sliding-Window Boundaries (in seconds)
    window_short_sec: int = 600       # 10 minutes
    window_medium_sec: int = 3600     # 1 hour
    window_long_sec: int = 86400      # 24 hours
    
    # Rapid Pass-Through Heuristic Limits
    rapid_passthrough_max_delay_sec: int = 900  # 15 minutes
    rapid_passthrough_min_ratio: float = 0.85
    rapid_passthrough_max_ratio: float = 1.05

    # Risk Aggregation Component Weights (Total = 1.0)
    weight_rule_passthrough: float = 0.25
    weight_rule_smurfing: float = 0.20
    weight_rule_velocity: float = 0.15
    weight_isolation_forest: float = 0.20
    weight_graphsage: float = 0.20

    # Risk Severity Thresholds (0 - 100)
    risk_threshold_critical: float = 80.0
    risk_threshold_high: float = 60.0
    risk_threshold_medium: float = 35.0


config = AppConfig()
