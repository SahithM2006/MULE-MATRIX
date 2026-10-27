"""
Unit tests for Section 9: Explainable Risk Aggregator.
"""
import pytest
from backend.app.engines.risk_engine import aggregate_account_risk
from backend.app.models.schemas import (
    AlertSignal, IsolationForestOutput, GraphSAGEOutput
)

def test_full_pipeline_risk_aggregation():
    """Verify combined signals produce a 0-100 risk score and critical severity."""
    rule_signals = [
        AlertSignal(
            rule_or_model="RULE_RAPID_PASSTHROUGH_v1.0",
            normalized_score=0.92,
            contribution_weight=0.25,
            reason="Rapid pass-through within 180 seconds.",
            evidence_references=["TX_01", "TX_02"]
        )
    ]
    if_out = IsolationForestOutput(
        status="READY",
        anomaly_score=0.88,
        is_anomaly=True,
        top_contributing_features=[],
        version="iforest_v1.0"
    )
    gs_out = GraphSAGEOutput(
        status="READY",
        mule_probability=0.94,
        embedding_vector_sample=[0.1, 0.2],
        model_version="graphsage_v1.0"
    )

    score, severity, reason, signals, avail = aggregate_account_risk(rule_signals, if_out, gs_out)
    
    assert 85.0 <= score <= 96.0
    assert severity == "CRITICAL"
    assert "Rapid pass-through" in reason or "GraphSAGE" in reason
    assert len(signals) == 3
    assert avail["rule_engine"] == "READY"
    assert avail["isolation_forest"] == "READY"
    assert avail["graphsage"] == "READY"

def test_renormalization_when_graphsage_not_trained():
    """Verify that if GraphSAGE is NOT_TRAINED, weights are cleanly renormalized across active components."""
    rule_signals = [
        AlertSignal(
            rule_or_model="RULE_RAPID_PASSTHROUGH_v1.0",
            normalized_score=0.80,
            contribution_weight=0.25,
            reason="Pass-through pattern observed."
        )
    ]
    if_out = IsolationForestOutput(
        status="READY",
        anomaly_score=0.80,
        is_anomaly=True,
        version="iforest_v1.0"
    )
    gs_out = GraphSAGEOutput(status="NOT_TRAINED", mule_probability=None)

    score, severity, reason, signals, avail = aggregate_account_risk(rule_signals, if_out, gs_out)
    
    # Renormalized score should be approximately 80.0
    assert 78.0 <= score <= 82.0
    assert avail["graphsage"] == "NOT_TRAINED"
    assert len(signals) == 2  # GraphSAGE excluded from contributing signals
