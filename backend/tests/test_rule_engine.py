"""
Unit tests for Algorithm 5: Rule-Based Risk Scoring.
"""
import pytest
from backend.app.engines.rule_engine import evaluate_account_rules
from backend.app.models.schemas import SlidingWindowMetrics, GraphFeaturesMetrics

def test_rapid_passthrough_rule_trigger():
    """Verify rapid pass-through rule fires on fast fund turnover."""
    acc = {"account_id": "MULE_01", "account_type": "mule_suspect"}
    w10m = SlidingWindowMetrics(
        window_name="10_min",
        window_duration_seconds=600,
        tx_count=2,
        velocity_tx_per_hour=12.0,
        burst_score=1.5,
        inflow_amount=100000.0,
        outflow_amount=98000.0,
        rapid_passthrough_detected=True,
        median_passthrough_delay_seconds=120.0,
        passthrough_ratio=0.98,
        supporting_tx_ids=["T1", "T2"]
    )
    
    signals = evaluate_account_rules(acc, {"10_min": w10m})
    rule_names = [s.rule_or_model for s in signals]
    assert "RULE_RAPID_PASSTHROUGH_v1.0" in rule_names
    
    signal = next(s for s in signals if s.rule_or_model == "RULE_RAPID_PASSTHROUGH_v1.0")
    assert 0.70 <= signal.normalized_score <= 1.0
    assert "Rapid pass-through detected" in signal.reason

def test_merchant_context_awareness():
    """Verify legitimate merchants do not trigger smurfing alerts despite high fan-in."""
    merchant_acc = {"account_id": "ACC_MERCHANT_01", "account_type": "merchant"}
    gf = GraphFeaturesMetrics(
        in_degree=25,
        out_degree=1,
        degree_ratio=13.0,
        weighted_inflow=500000.0,
        weighted_outflow=450000.0,
        fan_in_ratio=0.95,
        fan_out_ratio=1.0,
        clustering_coefficient=0.02,
        connected_component_size=100,
        transaction_velocity=10.0,
        pass_through_ratio=0.9
    )
    w1h = SlidingWindowMetrics(
        window_name="1_hour",
        window_duration_seconds=3600,
        tx_count=25,
        velocity_tx_per_hour=25.0,
        burst_score=1.8,
        inflow_amount=500000.0,
        outflow_amount=0.0,
        rapid_passthrough_detected=False
    )
    
    signals = evaluate_account_rules(merchant_acc, {"1_hour": w1h}, gf)
    rule_names = [s.rule_or_model for s in signals]
    # Smurfing rule should NOT fire for merchant
    assert "RULE_SMURFING_FAN_IN_v1.0" not in rule_names
