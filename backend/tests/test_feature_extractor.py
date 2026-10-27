"""
Unit tests for Algorithm 4: Graph Feature Extraction.
"""
import pytest
from backend.app.engines.feature_extractor import (
    extract_graph_features, build_networkx_graph, FEATURE_COLUMNS
)

def test_feature_table_schema_and_columns():
    """Verify extracted DataFrame contains all documented features."""
    accounts = [
        {"account_id": "A1", "account_type": "retail", "kyc_risk_score": 0.1},
        {"account_id": "A2", "account_type": "mule_suspect", "kyc_risk_score": 0.8},
        {"account_id": "A3", "account_type": "cashout", "kyc_risk_score": 0.9}
    ]
    transactions = [
        {"transaction_id": "T1", "source_account_id": "A1", "destination_account_id": "A2", "amount": 50000.0, "timestamp": "2026-10-27T10:00:00Z"},
        {"transaction_id": "T2", "source_account_id": "A2", "destination_account_id": "A3", "amount": 49000.0, "timestamp": "2026-10-27T10:04:00Z"}
    ]

    df, metrics_map = extract_graph_features(accounts, transactions)
    
    assert list(df.columns) == FEATURE_COLUMNS
    assert len(df) == 3
    assert "A2" in metrics_map
    
    # A2 has in_degree=1, out_degree=1, pass_through_ratio ~ 49000/50000 = 0.98
    m2 = metrics_map["A2"]
    assert m2.in_degree == 1
    assert m2.out_degree == 1
    assert m2.weighted_inflow == 50000.0
    assert m2.weighted_outflow == 49000.0
    assert 0.97 <= m2.pass_through_ratio <= 0.99

def test_isolated_node_feature_handling():
    """Verify isolated nodes with 0 inflows and outflows are handled without division by zero."""
    accounts = [{"account_id": "ISOLATED_1", "account_type": "retail", "kyc_risk_score": 0.0}]
    df, metrics_map = extract_graph_features(accounts, [])
    
    m = metrics_map["ISOLATED_1"]
    assert m.in_degree == 0
    assert m.out_degree == 0
    assert m.weighted_inflow == 0.0
    assert m.weighted_outflow == 0.0
    assert m.pass_through_ratio == 0.0
    assert m.clustering_coefficient == 0.0
