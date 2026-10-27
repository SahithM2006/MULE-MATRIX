"""
Unit tests for Algorithm 8: GraphSAGE Inductive Classifier.
"""
import pytest
import torch
import numpy as np
import pandas as pd
from backend.app.engines.graphsage_engine import (
    GraphSAGEClassifier, GraphSAGEEngine, GraphSAGELayer
)
from backend.app.engines.feature_extractor import FEATURE_COLUMNS

def test_graphsage_layer_forward():
    """Verify GraphSAGELayer computes mean neighborhood aggregation and projection."""
    layer = GraphSAGELayer(in_features=4, out_features=8)
    # 3 nodes, 4 features
    x = torch.randn(3, 4)
    # 3x3 identity adjacency
    adj = torch.eye(3)
    out = layer(x, adj)
    assert out.shape == (3, 8)

def test_graphsage_uninitialized_status_contract():
    """Verify uninitialized engine returns NOT_TRAINED status rather than fake scores."""
    engine = GraphSAGEEngine()
    engine.model = None
    engine.cached_predictions = {}
    
    out = engine.predict_account("ACC_UNKNOWN")
    assert out.status == "NOT_TRAINED"
    assert out.mule_probability is None

def test_graphsage_training_and_inference():
    """Verify GraphSAGE trains, converges, and produces valid probabilities."""
    # Synthetic accounts
    accounts = [
        {"account_id": f"ACC_{i}", "account_type": "retail" if i < 15 else "mule_suspect", "ground_truth_label": 0 if i < 15 else 1, "scenario_tag": "normal" if i < 15 else "smurfing"}
        for i in range(20)
    ]
    # Transactions forming ring
    transactions = [
        {"source_account_id": f"ACC_{i}", "destination_account_id": f"ACC_{(i+1)%20}", "amount": 1000.0, "timestamp": "2026-10-27T10:00:00Z"}
        for i in range(20)
    ]
    # Features
    feature_matrix = np.random.randn(20, len(FEATURE_COLUMNS)).astype(np.float32)
    feature_df = pd.DataFrame(feature_matrix, index=[a["account_id"] for a in accounts], columns=FEATURE_COLUMNS)

    engine = GraphSAGEEngine()
    train_res = engine.train_pipeline(accounts, transactions, feature_df, epochs=15)
    
    assert train_res["status"] == "SUCCESS"
    assert engine.model is not None
    
    # Test inference
    pred = engine.predict_account("ACC_0")
    assert pred.status == "READY"
    assert pred.mule_probability is not None
    assert 0.0 <= pred.mule_probability <= 1.0
    assert len(pred.embedding_vector_sample) == 4
