"""
Unit tests for Algorithm 3: Time-Constrained Breadth-First Search (BFS).
"""
import pytest
from backend.app.data.hero_scenario import generate_hero_data
from backend.app.engines.bfs_engine import trace_time_constrained_bfs
from backend.app.models.schemas import BFSRequest

def test_hero_scenario_bfs_path_discovery():
    """Verify that BFS discovers the multi-hop paths from victim to cashout."""
    _, hero_txs, _ = generate_hero_data()
    
    req = BFSRequest(
        seed_account_id="ACC_HERO_VICTIM_001",
        max_hops=4,
        time_window_seconds=3600,
        direction="forward"
    )
    res = trace_time_constrained_bfs(req, hero_txs)
    
    assert res.total_paths > 0
    assert "ACC_HERO_CASHOUT_DEST_999" in res.visited_nodes
    
    # Verify at least one path reaches the cashout node
    cashout_paths = [
        p for p in res.paths if p.accounts_in_path[-1] == "ACC_HERO_CASHOUT_DEST_999"
    ]
    assert len(cashout_paths) >= 1
    sample_path = cashout_paths[0]
    assert len(sample_path.hops) == 3  # Victim -> Mule L1 -> Mule L2 -> Cashout
    assert sample_path.accounts_in_path[0] == "ACC_HERO_VICTIM_001"
    assert sample_path.accounts_in_path[-1] == "ACC_HERO_CASHOUT_DEST_999"

def test_bfs_max_hop_enforcement():
    """Verify that BFS does not traverse beyond max_hops."""
    _, hero_txs, _ = generate_hero_data()
    req = BFSRequest(
        seed_account_id="ACC_HERO_VICTIM_001",
        max_hops=1,
        time_window_seconds=3600,
        direction="forward"
    )
    res = trace_time_constrained_bfs(req, hero_txs)
    for p in res.paths:
        assert len(p.hops) <= 1

def test_bfs_cycle_suppression():
    """Verify that a circular loop does not cause infinite recursion."""
    cyclic_txs = [
        {"transaction_id": "TX_C1", "source_account_id": "ACC_1", "destination_account_id": "ACC_2", "amount": 100.0, "timestamp": "2026-10-27T10:00:00Z"},
        {"transaction_id": "TX_C2", "source_account_id": "ACC_2", "destination_account_id": "ACC_3", "amount": 100.0, "timestamp": "2026-10-27T10:05:00Z"},
        {"transaction_id": "TX_C3", "source_account_id": "ACC_3", "destination_account_id": "ACC_1", "amount": 100.0, "timestamp": "2026-10-27T10:10:00Z"},
    ]
    req = BFSRequest(
        seed_account_id="ACC_1",
        max_hops=6,
        time_window_seconds=3600,
        direction="forward"
    )
    res = trace_time_constrained_bfs(req, cyclic_txs)
    assert res.total_paths <= 3
    # Check that no path contains duplicate accounts
    for p in res.paths:
        assert len(p.accounts_in_path) == len(set(p.accounts_in_path))
