"""
Trace Stage API Endpoints: Attack Graph & Token Forensics.
"""
from fastapi import APIRouter, Query, HTTPException, Body
from typing import List, Optional, Dict, Any
from backend.app.models.schemas import (
    GraphDataResponse, GraphNode, GraphEdge, CommunitySummary,
    BFSRequest, BFSResponse, LineageEvent, LineageVerifyResponse, TamperTestResponse
)
from backend.app.db.database import get_connection
from backend.app.engines.bfs_engine import trace_time_constrained_bfs
from backend.app.engines.lineage_engine import verify_lineage_chain, run_tamper_test
from backend.app.engines.louvain_engine import detect_louvain_communities
from backend.app.engines.feature_extractor import build_networkx_graph

router = APIRouter(prefix="/trace", tags=["Trace"])

@router.get("/graph", response_model=GraphDataResponse)
def get_graph_data(
    focus_account_id: Optional[str] = None,
    depth: int = Query(2, ge=1, le=5),
    limit_nodes: int = Query(120, ge=10, le=400),
    min_risk: Optional[float] = None
):
    """
    Returns filtered node-edge graph topology for hardware-accelerated Canvas rendering.
    Enforces subgraph bounding to prevent DOM/Canvas degradation on large graphs.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Load accounts and alerts
        cursor.execute("SELECT a.*, al.risk_score as alert_risk, al.severity as alert_sev FROM accounts a LEFT JOIN alerts al ON a.account_id = al.account_id;")
        all_accounts = [dict(r) for r in cursor.fetchall()]
        acc_dict = {a["account_id"]: a for a in all_accounts}

        cursor.execute("SELECT * FROM transactions;")
        all_transactions = [dict(r) for r in cursor.fetchall()]

        # Filter by focus node or suspicious clusters
        selected_node_ids = set()
        if focus_account_id and focus_account_id in acc_dict:
            # Expand neighborhood up to depth hops
            selected_node_ids.add(focus_account_id)
            current_frontier = {focus_account_id}
            for _ in range(depth):
                next_frontier = set()
                for tx in all_transactions:
                    if tx["source_account_id"] in current_frontier:
                        next_frontier.add(tx["destination_account_id"])
                    elif tx["destination_account_id"] in current_frontier:
                        next_frontier.add(tx["source_account_id"])
                current_frontier = next_frontier
                selected_node_ids.update(current_frontier)
                if len(selected_node_ids) >= limit_nodes:
                    break
        else:
            # Focus on highest risk accounts and hero scenario nodes
            hero_and_mule_nodes = [
                a["account_id"] for a in all_accounts 
                if (a.get("alert_risk") or 0.0) >= (min_risk or 50.0) 
                or "hero" in (a.get("scenario_tag") or "")
                or a.get("account_type") in ("mule_suspect", "cashout")
            ]
            selected_node_ids = set(hero_and_mule_nodes[:limit_nodes])

        if not selected_node_ids:
            # Fallback to top accounts by volume
            selected_node_ids = set(list(acc_dict.keys())[:limit_nodes])

        # Filter edges between selected nodes
        filtered_edges = [
            tx for tx in all_transactions
            if tx["source_account_id"] in selected_node_ids and tx["destination_account_id"] in selected_node_ids
        ]

        # Louvain on the subgraph
        _, undirected_g = build_networkx_graph(filtered_edges, [acc_dict[nid] for nid in selected_node_ids])
        flagged_nodes = {nid for nid in selected_node_ids if (acc_dict[nid].get("alert_risk") or 0.0) >= 60.0}
        acc_to_comm, summaries = detect_louvain_communities(undirected_g, flagged_nodes)

        # Build GraphNode list
        nodes = []
        for nid in selected_node_ids:
            a = acc_dict.get(nid, {})
            is_hero = "hero" in (a.get("scenario_tag") or "")
            nodes.append(GraphNode(
                id=nid,
                label=nid,
                account_type=a.get("account_type", "retail"),
                kyc_risk_score=float(a.get("kyc_risk_score", 0.0)),
                aggregate_risk_score=float(a["alert_risk"]) if a.get("alert_risk") is not None else None,
                severity=a.get("alert_sev"),
                in_degree=undirected_g.degree(nid) if undirected_g.has_node(nid) else 0,
                out_degree=undirected_g.degree(nid) if undirected_g.has_node(nid) else 0,
                community_id=acc_to_comm.get(nid),
                is_hero_suspect=is_hero
            ))

        # Build GraphEdge list
        edges = []
        for tx in filtered_edges:
            edges.append(GraphEdge(
                id=f"EDGE_{tx['transaction_id']}",
                from_node=tx["source_account_id"],
                to_node=tx["destination_account_id"],
                amount=float(tx["amount"]),
                timestamp=tx["timestamp"],
                transaction_id=tx["transaction_id"],
                highlighted="hero" in (tx.get("scenario_id") or "")
            ))

        return GraphDataResponse(
            nodes=nodes,
            edges=edges,
            communities=summaries,
            total_accounts=len(all_accounts),
            total_transactions=len(all_transactions)
        )
    finally:
        conn.close()

@router.post("/bfs", response_model=BFSResponse)
def execute_bfs_trace(request: BFSRequest):
    """Executes time-constrained temporal BFS path search from a seed account."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions;")
        transactions = [dict(r) for r in cursor.fetchall()]
        return trace_time_constrained_bfs(request, transactions)
    finally:
        conn.close()

@router.get("/lineage/{token_or_tx_id}", response_model=List[LineageEvent])
def get_token_lineage(token_or_tx_id: str):
    """Returns ordered simulated e-rupee token transfer history."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Query by token_id or transaction_id
        cursor.execute(
            """
            SELECT * FROM lineage_events 
            WHERE token_id = ? OR transaction_id = ? 
            ORDER BY sequence_index ASC;
            """,
            (token_or_tx_id, token_or_tx_id)
        )
        rows = cursor.fetchall()
        if not rows:
            # Fallback query if search was transaction_id
            cursor.execute("SELECT token_lineage_id FROM transactions WHERE transaction_id = ?;", (token_or_tx_id,))
            tok = cursor.fetchone()
            if tok and tok[0]:
                cursor.execute("SELECT * FROM lineage_events WHERE token_id = ? ORDER BY sequence_index ASC;", (tok[0],))
                rows = cursor.fetchall()

        events = []
        for r in rows:
            events.append(LineageEvent(
                event_id=r["event_id"],
                token_id=r["token_id"],
                transaction_id=r["transaction_id"],
                parent_event_id=r["parent_event_id"],
                source_account_id=r["source_account_id"],
                destination_account_id=r["destination_account_id"],
                amount=float(r["amount"]),
                timestamp=r["timestamp"],
                sequence_index=r["sequence_index"],
                canonical_payload=r["canonical_payload"],
                prev_hash=r["prev_hash"],
                current_hash=r["current_hash"],
                is_verified=bool(r["is_verified"])
            ))
        return events
    finally:
        conn.close()

@router.post("/lineage/verify", response_model=LineageVerifyResponse)
def verify_token_lineage(payload: Dict[str, Any] = Body(...)):
    """Validates the SHA-256 hash chaining integrity of an e-rupee token lineage sequence."""
    token_id = payload.get("token_id")
    if not token_id:
        raise HTTPException(status_code=400, detail="token_id is required.")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lineage_events WHERE token_id = ? ORDER BY sequence_index ASC;", (token_id,))
        events = [dict(r) for r in cursor.fetchall()]
        return verify_lineage_chain(events)
    finally:
        conn.close()

@router.post("/lineage/tamper-test", response_model=TamperTestResponse)
def run_lineage_tamper_test(payload: Dict[str, Any] = Body(...)):
    """Executes a non-destructive tamper simulation on an isolated clone of a token chain."""
    token_id = payload.get("token_id", "TOKR_HERO_500K_GENESIS")
    target_idx = payload.get("target_event_index", 2)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lineage_events WHERE token_id = ? ORDER BY sequence_index ASC;", (token_id,))
        events = [dict(r) for r in cursor.fetchall()]
        if not events:
            # Fallback to hero events
            cursor.execute("SELECT * FROM lineage_events WHERE token_id LIKE '%HERO%' ORDER BY sequence_index ASC;")
            events = [dict(r) for r in cursor.fetchall()]

        return run_tamper_test(events, target_event_index=target_idx)
    finally:
        conn.close()
