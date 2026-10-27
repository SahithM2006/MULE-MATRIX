"""
Unit tests for Algorithm 6: Isolation Forest Anomaly Detection.
"""
import pytest
import numpy as np
import pandas as pd
from backend.app.engines.isolation_forest_engine import IsolationForestEngine
from backend.app.engines.feature_extractor import FEATURE_COLUMNS

def test_isolation_forest_normalization_and_explainability():
    """Verify Isolation Forest outputs normalized [0, 1] scores and perturbation explanations."""
    np.random.seed(42)
    # Generate 100 normal accounts and 5 extreme outliers
    normal_data = np.random.normal(loc=10.0, scale=2.0, size=(100, len(FEATURE_COLUMNS)))
    outlier_data = np.random.normal(loc=500.0, scale=20.0, size=(5, len(FEATURE_COLUMNS)))
    
    all_data = np.vstack([normal_data, outlier_data])
    df = pd.DataFrame(all_data, columns=FEATURE_COLUMNS)

    engine = IsolationForestEngine(n_estimators=100, contamination=0.05, random_seed=42)
    engine.fit(df)

    # Score normal account
    normal_res = engine.score_account("NORM_01", normal_data[0])
    assert normal_res.status == "READY"
    assert normal_res.anomaly_score is not None
    assert 0.0 <= normal_res.anomaly_score <= 1.0

    # Score outlier account
    outlier_res = engine.score_account("OUTLIER_01", outlier_data[0])
    assert outlier_res.status == "READY"
    assert outlier_res.anomaly_score is not None
    assert outlier_res.anomaly_score > normal_res.anomaly_score
    assert outlier_res.is_anomaly is True

    # Check that top contributing features are present and defensible
    assert len(outlier_res.top_contributing_features) == 3
    for feat in outlier_res.top_contributing_features:
        assert feat.feature_name in FEATURE_COLUMNS
        assert feat.account_value > feat.reference_median

def test_isolation_forest_unfitted_state():
    """Verify clean NOT_TRAINED status when model has not been fitted."""
    fresh_engine = IsolationForestEngine()
    res = fresh_engine.score_account("ACC_01", np.zeros(len(FEATURE_COLUMNS)))
    assert res.status == "NOT_TRAINED"
    assert res.anomaly_score is None
