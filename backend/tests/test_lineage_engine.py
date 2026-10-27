"""
Unit tests for Algorithm 2: SHA-256 Hash Chaining (Lineage Engine).
"""
import pytest
import copy
from backend.app.data.hero_scenario import generate_hero_data
from backend.app.engines.lineage_engine import (
    verify_lineage_chain, run_tamper_test, canonical_serialize, compute_sha256_hash
)

def test_valid_chain_verification():
    """Verify that untampered lineage events pass full verification."""
    _, _, hero_events = generate_hero_data()
    res = verify_lineage_chain(hero_events)
    assert res.valid is True
    assert res.first_broken_event_id is None
    assert res.total_events == len(hero_events)

def test_tamper_detection_in_payload():
    """Verify that tampering with an amount is caught immediately."""
    _, _, hero_events = generate_hero_data()
    tampered_events = copy.deepcopy(hero_events)
    
    # Modify second event amount without rehashing
    tampered_events[1]["canonical_payload"] = canonical_serialize({"amount": 999999.0, "event_id": "EVT_HERO_002"})
    
    res = verify_lineage_chain(tampered_events)
    assert res.valid is False
    assert res.first_broken_event_id == "EVT_HERO_002"

def test_tamper_detection_broken_parent_pointer():
    """Verify that modifying a parent pointer is identified as broken link."""
    _, _, hero_events = generate_hero_data()
    tampered_events = copy.deepcopy(hero_events)
    
    tampered_events[2]["parent_event_id"] = "EVT_NON_EXISTENT"
    
    res = verify_lineage_chain(tampered_events)
    assert res.valid is False
    assert res.first_broken_event_id == "EVT_HERO_003"

def test_run_tamper_test_isolation():
    """Verify that run_tamper_test runs on an isolated copy and does not mutate originals."""
    _, _, hero_events = generate_hero_data()
    orig_copy = copy.deepcopy(hero_events)
    
    tamper_res = run_tamper_test(hero_events, target_event_index=2)
    assert tamper_res.detected is True
    assert tamper_res.tampered_event_id == hero_events[2]["event_id"]

    # Verify original events were NOT modified
    assert hero_events == orig_copy
    # And original verify passes
    assert verify_lineage_chain(hero_events).valid is True
