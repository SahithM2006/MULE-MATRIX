"""
Algorithm 4: Graph Feature Extraction.
Constructs a unified, versioned graph feature table (schema v1.0) shared across
Rule Scoring, Isolation Forest, and GraphSAGE training/inference.
"""
import networkx as nx
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from backend.app.models.schemas import GraphFeaturesMetrics
from backend.app.core.config import config

FEATURE_COLUMNS = [
    "in_degree",
    "out_degree",
    "degree_ratio",
    "weighted_inflow",
    "weighted_outflow",
    "fan_in_ratio",
    "fan_out_ratio",
    "clustering_coefficient",
    "connected_component_size",
    "transaction_velocity",
    "pass_through_ratio"
]

def build_networkx_graph(
    transactions: List[Dict[str, Any]],
    accounts: Optional[List[Dict[str, Any]]] = None
) -> Tuple[nx.MultiDiGraph, nx.Graph]:
    """
    Builds directed multigraph and its undirected weighted projection.
    """
    di_graph = nx.MultiDiGraph()
    
    # Add accounts as nodes if provided
    if accounts:
        for acc in accounts:
            di_graph.add_node(
                acc["account_id"],
                account_type=acc.get("account_type", "retail"),
                kyc_risk=acc.get("kyc_risk_score", 0.0)
            )

    # Add transaction edges
    for tx in transactions:
        src = tx["source_account_id"]
        dst = tx["destination_account_id"]
        amt = float(tx.get("amount", 0.0))
        di_graph.add_edge(
            src, dst,
            key=tx["transaction_id"],
            amount=amt,
            timestamp=tx.get("timestamp", "")
        )

    # Build undirected weighted projection (aggregating multi-edges and self-loops removed)
    undirected_graph = nx.Graph()
    for node in di_graph.nodes:
        undirected_graph.add_node(node)

    for u, v, data in di_graph.edges(data=True):
        if u == v:
            continue  # Ignore self-loops for projection
        amt = data.get("amount", 1.0)
        if undirected_graph.has_edge(u, v):
            undirected_graph[u][v]["weight"] += amt
        else:
            undirected_graph.add_edge(u, v, weight=amt)

    return di_graph, undirected_graph

def extract_graph_features(
    accounts: List[Dict[str, Any]],
    transactions: List[Dict[str, Any]]
) -> Tuple[pd.DataFrame, Dict[str, GraphFeaturesMetrics]]:
    """
    Extracts versioned graph features for all accounts.
    Returns:
    - DataFrame indexed by account_id with normalized numeric features.
    - Dict of account_id -> GraphFeaturesMetrics typed models.
    """
    di_graph, undirected_graph = build_networkx_graph(transactions, accounts)
    
    # Pre-calculate graph-wide properties
    clustering_map = nx.clustering(undirected_graph)
    components = list(nx.weakly_connected_components(di_graph))
    component_size_map = {}
    for comp in components:
        size = len(comp)
        for node in comp:
            component_size_map[node] = size

    # Pre-calculate transaction metrics per account
    in_neighbors: Dict[str, set] = {}
    out_neighbors: Dict[str, set] = {}
    inflow_sums: Dict[str, float] = {}
    outflow_sums: Dict[str, float] = {}
    tx_counts: Dict[str, int] = {}
    time_bounds: Dict[str, List[str]] = {}

    for tx in transactions:
        src = tx["source_account_id"]
        dst = tx["destination_account_id"]
        amt = float(tx.get("amount", 0.0))
        ts = tx.get("timestamp", "")

        out_neighbors.setdefault(src, set()).add(dst)
        in_neighbors.setdefault(dst, set()).add(src)

        outflow_sums[src] = outflow_sums.get(src, 0.0) + amt
        inflow_sums[dst] = inflow_sums.get(dst, 0.0) + amt

        tx_counts[src] = tx_counts.get(src, 0) + 1
        tx_counts[dst] = tx_counts.get(dst, 0) + 1

        time_bounds.setdefault(src, []).append(ts)
        time_bounds.setdefault(dst, []).append(ts)

    feature_rows = []
    account_ids = []
    metrics_map: Dict[str, GraphFeaturesMetrics] = {}

    for acc in accounts:
        acc_id = acc["account_id"]
        account_ids.append(acc_id)

        in_deg = di_graph.in_degree(acc_id) if di_graph.has_node(acc_id) else 0
        out_deg = di_graph.out_degree(acc_id) if di_graph.has_node(acc_id) else 0
        deg_ratio = round((in_deg + 1.0) / (out_deg + 1.0), 3)

        w_in = inflow_sums.get(acc_id, 0.0)
        w_out = outflow_sums.get(acc_id, 0.0)

        # Fan-in and Fan-out ratios
        unique_senders = len(in_neighbors.get(acc_id, set()))
        unique_receivers = len(out_neighbors.get(acc_id, set()))
        fan_in_ratio = round(unique_senders / max(1, in_deg), 3)
        fan_out_ratio = round(unique_receivers / max(1, out_deg), 3)

        clust_coeff = round(clustering_map.get(acc_id, 0.0), 4)
        comp_size = component_size_map.get(acc_id, 1)

        # Velocity
        total_tx = tx_counts.get(acc_id, 0)
        # Approximate active hours (assume min 1 hour window)
        velocity = round(total_tx / 24.0, 2)

        # Pass-through ratio: min(in, out) / max(in, out)
        if w_in > 0 and w_out > 0:
            pt_ratio = round(min(w_in, w_out) / max(w_in, w_out), 3)
        else:
            pt_ratio = 0.0

        metrics_obj = GraphFeaturesMetrics(
            in_degree=in_deg,
            out_degree=out_deg,
            degree_ratio=deg_ratio,
            weighted_inflow=round(w_in, 2),
            weighted_outflow=round(w_out, 2),
            fan_in_ratio=fan_in_ratio,
            fan_out_ratio=fan_out_ratio,
            clustering_coefficient=clust_coeff,
            connected_component_size=comp_size,
            transaction_velocity=velocity,
            pass_through_ratio=pt_ratio
        )
        metrics_map[acc_id] = metrics_obj

        feature_rows.append([
            in_deg,
            out_deg,
            deg_ratio,
            w_in,
            w_out,
            fan_in_ratio,
            fan_out_ratio,
            clust_coeff,
            comp_size,
            velocity,
            pt_ratio
        ])

    df = pd.DataFrame(feature_rows, columns=FEATURE_COLUMNS, index=account_ids)
    return df, metrics_map
