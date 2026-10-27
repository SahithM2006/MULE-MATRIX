"""
Unit tests for synthetic dataset generator, reproducible seeds, and database population.
"""
import pytest
import os
import tempfile
from backend.app.data.synthetic_generator import generate_synthetic_dataset, populate_database
from backend.app.db.database import db_session

def test_synthetic_dataset_reproducibility():
    """Verify that using the same seed produces identical datasets."""
    accs1, txs1, evts1 = generate_synthetic_dataset(target_accounts=100, target_transactions=500, random_seed=42)
    accs2, txs2, evts2 = generate_synthetic_dataset(target_accounts=100, target_transactions=500, random_seed=42)

    assert len(accs1) == len(accs2)
    assert len(txs1) == len(txs2)
    assert len(evts1) == len(evts2)
    assert [a["account_id"] for a in accs1] == [a["account_id"] for a in accs2]
    assert [t["transaction_id"] for t in txs1] == [t["transaction_id"] for t in txs2]

def test_scenario_diversity_and_labels():
    """Verify that diverse scenarios and isolated ground-truth labels exist."""
    accs, txs, evts = generate_synthetic_dataset(target_accounts=300, target_transactions=1500, random_seed=99)
    
    scenario_tags = {a["scenario_tag"] for a in accs}
    expected_tags = {"hero_victim", "hero_mule_l1", "payroll_employer", "merchant_fanin", "smurfing_collector", "rapid_passthrough"}
    assert expected_tags.issubset(scenario_tags), f"Missing expected scenario tags: {expected_tags - scenario_tags}"

    # Labels must be strictly 0 or 1
    labels = {a["ground_truth_label"] for a in accs}
    assert labels == {0, 1}

    # Verify that transactions are strictly chronologically sorted
    for i in range(len(txs) - 1):
        assert txs[i]["timestamp"] <= txs[i + 1]["timestamp"]

def test_populate_database_execution():
    """Test full database population with synthetic data."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        num_accs, num_txs, num_evts = populate_database(
            db_path=path,
            num_accounts=150,
            num_transactions=1000,
            seed=77
        )
        assert num_accs > 0
        assert num_txs > 0
        assert num_evts > 0

        with db_session(path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM accounts;")
            assert cursor.fetchone()[0] == num_accs

            cursor.execute("SELECT COUNT(*) FROM transactions;")
            assert cursor.fetchone()[0] == num_txs

            cursor.execute("SELECT COUNT(*) FROM lineage_events;")
            assert cursor.fetchone()[0] == num_evts

            cursor.execute("SELECT COUNT(*) FROM audit_events;")
            assert cursor.fetchone()[0] >= 1
    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
            except PermissionError:
                pass
