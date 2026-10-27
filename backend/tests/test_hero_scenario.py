"""
Unit tests for deterministic hero scenario generation, temporal monotonicity, and hash chain integrity.
"""
import pytest
import hashlib
from datetime import datetime
from backend.app.data.hero_scenario import (
    generate_hero_data, canonical_serialize, compute_sha256, HERO_ACCOUNTS
)

def test_hero_accounts_structure():
    """Verify hero accounts have expected ground truth and types."""
    acc_map = {a["account_id"]: a for a in HERO_ACCOUNTS}
    assert "ACC_HERO_VICTIM_001" in acc_map
    assert "ACC_HERO_MULE_L1_A" in acc_map
    assert "ACC_HERO_MULE_L1_B" in acc_map
    assert "ACC_HERO_MULE_L2_CONVERGE" in acc_map
    assert "ACC_HERO_CASHOUT_DEST_999" in acc_map

    # Victim is benign
    assert acc_map["ACC_HERO_VICTIM_001"]["ground_truth_label"] == 0
    assert acc_map["ACC_HERO_VICTIM_001"]["account_type"] == "victim"

    # Mules and cashout have ground truth 1
    assert acc_map["ACC_HERO_MULE_L1_A"]["ground_truth_label"] == 1
    assert acc_map["ACC_HERO_MULE_L2_CONVERGE"]["ground_truth_label"] == 1
    assert acc_map["ACC_HERO_CASHOUT_DEST_999"]["ground_truth_label"] == 1

def test_hero_scenario_temporal_monotonicity():
    """Verify that every subsequent hop in the hero scenario occurs at or after previous hops."""
    accounts, transactions, lineage_events = generate_hero_data()
    assert len(transactions) == 5

    prev_dt = datetime.min.replace(tzinfo=datetime.now().astimezone().tzinfo)
    for tx in transactions:
        curr_dt = datetime.fromisoformat(tx["timestamp"].replace("Z", "+00:00"))
        assert curr_dt >= prev_dt, f"Temporal violation: {curr_dt} is earlier than {prev_dt}"
        prev_dt = curr_dt

def test_hero_scenario_lineage_hash_chain_integrity():
    """Verify that every lineage event's current_hash matches SHA256(canonical_payload + prev_hash)."""
    accounts, transactions, lineage_events = generate_hero_data()
    assert len(lineage_events) == 5

    for idx, evt in enumerate(lineage_events):
        canonical_str = evt["canonical_payload"]
        prev_hash = evt["prev_hash"]
        expected_curr = compute_sha256(canonical_str, prev_hash)
        assert evt["current_hash"] == expected_curr, f"Hash mismatch at sequence {evt['sequence_index']}"
        
        # Verify parent linkage
        if idx > 0:
            assert evt["parent_event_id"] == lineage_events[idx - 1]["event_id"]
            assert evt["prev_hash"] == lineage_events[idx - 1]["current_hash"]
        else:
            assert evt["parent_event_id"] is None
