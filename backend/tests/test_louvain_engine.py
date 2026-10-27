"""
Unit tests for Algorithm 7: Seeded Louvain Community Detection.
"""
import pytest
import networkx as nx
from backend.app.engines.louvain_engine import (
    detect_louvain_communities, get_account_community_output
)

def test_louvain_determinism_and_partitioning():
    """Verify seeded Louvain produces deterministic communities on a barbell graph."""
    # Create two connected cliques: C1 = (A1, A2, A3) and C2 = (B1, B2, B3) connected by A3-B1
    G = nx.Graph()
    for u, v in [("A1", "A2"), ("A2", "A3"), ("A1", "A3")]:
        G.add_edge(u, v, weight=100.0)
    for u, v in [("B1", "B2"), ("B2", "B3"), ("B1", "B3")]:
        G.add_edge(u, v, weight=100.0)
    # Weak bridge
    G.add_edge("A3", "B1", weight=1.0)

    acc_map1, summs1 = detect_louvain_communities(G, flagged_account_ids={"A1"}, seed=42)
    acc_map2, summs2 = detect_louvain_communities(G, flagged_account_ids={"A1"}, seed=42)

    # Determinism check
    assert acc_map1 == acc_map2
    assert len(summs1) == 2
    assert len(summs2) == 2

    # A1, A2, A3 should be in the same community
    assert acc_map1["A1"] == acc_map1["A2"] == acc_map1["A3"]
    # B1, B2, B3 should be in the same community
    assert acc_map1["B1"] == acc_map1["B2"] == acc_map1["B3"]
    # But C1 and C2 should be distinct
    assert acc_map1["A1"] != acc_map1["B1"]

    # Verify flagged account concentration in C1
    out_a1 = get_account_community_output("A1", acc_map1, summs1)
    assert out_a1 is not None
    assert out_a1.community_size == 3
    assert out_a1.mule_concentration_ratio > 0.0
