"""
Algorithm 3: Time-Constrained Breadth-First Search (BFS).
Reconstructs multi-hop financial transfer flows forward or backward from a seed account,
enforcing temporal monotonicity, hop depth boundaries, and cycle suppression.

CRITICAL ARCHITECTURAL NOTE:
The result of this search is an explainable topological reconstruction of recorded fund flows.
It does not establish legal ownership or guilt.
"""
import time
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Set
from backend.app.models.schemas import (
    BFSRequest, BFSResponse, DiscoveredPath, DiscoveredHop
)

def parse_iso(ts_str: str) -> datetime:
    clean = ts_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def trace_time_constrained_bfs(
    request: BFSRequest,
    all_transactions: List[Dict[str, Any]]
) -> BFSResponse:
    """
    Executes time-constrained BFS starting from request.seed_account_id.
    Constraints enforced:
    - Hop count <= request.max_hops
    - Monotonic time order: t_prev <= t_curr (for forward) or t_prev >= t_curr (for backward)
    - Total elapsed time <= request.time_window_seconds
    - Cycle prevention per path: prevents infinite loops while allowing multi-branch convergence
    - Optional min_amount filter
    """
    start_cpu_time = time.perf_counter()
    seed = request.seed_account_id
    max_hops = max(1, min(request.max_hops, 8))
    window_sec = request.time_window_seconds
    direction = request.direction.lower()
    min_amount = request.min_amount or 0.0

    # Index transactions for O(1) adjacency lookup
    # adjacency[acc] = list of outgoing txs (or incoming txs if backward)
    adjacency: Dict[str, List[Dict[str, Any]]] = {}
    for tx in all_transactions:
        amt = float(tx.get("amount", 0.0))
        if amt < min_amount:
            continue

        src = tx["source_account_id"]
        dst = tx["destination_account_id"]

        if direction == "forward":
            adjacency.setdefault(src, []).append(tx)
        else:
            adjacency.setdefault(dst, []).append(tx)

    # Sort each edge list chronologically
    for acc in adjacency:
        adjacency[acc].sort(key=lambda x: parse_iso(x["timestamp"]))

    discovered_paths: List[DiscoveredPath] = []
    visited_nodes: Set[str] = {seed}

    # Queue item: (current_account, current_hops: List[DiscoveredHop], current_path_accounts: Set[str], last_tx_time: datetime, path_start_time: datetime)
    queue = deque()

    # Determine initial candidate edges from seed
    seed_edges = adjacency.get(seed, [])
    if request.start_timestamp:
        req_start_dt = parse_iso(request.start_timestamp)
    else:
        req_start_dt = None

    for tx in seed_edges:
        tx_dt = parse_iso(tx["timestamp"])
        if req_start_dt and direction == "forward" and tx_dt < req_start_dt:
            continue
        if req_start_dt and direction == "backward" and tx_dt > req_start_dt:
            continue

        next_acc = tx["destination_account_id"] if direction == "forward" else tx["source_account_id"]
        if next_acc == seed:
            continue  # Avoid self-loops

        first_hop = DiscoveredHop(
            hop_index=1,
            source_account_id=tx["source_account_id"],
            destination_account_id=tx["destination_account_id"],
            transaction_id=tx["transaction_id"],
            amount=float(tx["amount"]),
            timestamp=tx["timestamp"]
        )

        visited_nodes.add(next_acc)
        queue.append((
            next_acc,
            [first_hop],
            {seed, next_acc},
            tx_dt,
            tx_dt
        ))

    # BFS Traversal Loop
    while queue:
        curr_acc, hops_so_far, path_accs, last_time, path_start_dt = queue.popleft()
        current_depth = len(hops_so_far)

        # Record valid path discovered so far
        total_amt = sum(h.amount for h in hops_so_far)
        path_id = f"PATH_{seed}_{curr_acc}_{hops_so_far[0].transaction_id}_{hops_so_far[-1].transaction_id}"
        duration = abs((last_time - path_start_dt).total_seconds())

        discovered_paths.append(DiscoveredPath(
            path_id=path_id,
            hops=list(hops_so_far),
            total_amount=round(total_amt, 2),
            start_timestamp=hops_so_far[0].timestamp,
            end_timestamp=hops_so_far[-1].timestamp,
            duration_seconds=duration,
            accounts_in_path=[seed] + [h.destination_account_id if direction == "forward" else h.source_account_id for h in hops_so_far]
        ))

        # Check maximum depth cutoff
        if current_depth >= max_hops:
            continue

        # Explore outgoing neighbors from curr_acc
        neighbor_txs = adjacency.get(curr_acc, [])
        for n_tx in neighbor_txs:
            n_dt = parse_iso(n_tx["timestamp"])
            next_node = n_tx["destination_account_id"] if direction == "forward" else n_tx["source_account_id"]

            # Cycle suppression: cannot revisit node already in this specific path prefix
            if next_node in path_accs:
                continue

            # Temporal constraint check
            if direction == "forward":
                if n_dt < last_time:
                    continue  # Violates forward chronological order
                if (n_dt - path_start_dt).total_seconds() > window_sec:
                    continue  # Exceeds maximum temporal window
            else:
                if n_dt > last_time:
                    continue  # Violates backward chronological order
                if (path_start_dt - n_dt).total_seconds() > window_sec:
                    continue  # Exceeds maximum temporal window

            next_hop = DiscoveredHop(
                hop_index=current_depth + 1,
                source_account_id=n_tx["source_account_id"],
                destination_account_id=n_tx["destination_account_id"],
                transaction_id=n_tx["transaction_id"],
                amount=float(n_tx["amount"]),
                timestamp=n_tx["timestamp"]
            )

            visited_nodes.add(next_node)
            new_path_accs = set(path_accs)
            new_path_accs.add(next_node)

            queue.append((
                next_node,
                hops_so_far + [next_hop],
                new_path_accs,
                n_dt,
                path_start_dt
            ))

    elapsed_ms = round((time.perf_counter() - start_cpu_time) * 1000.0, 2)
    return BFSResponse(
        seed_account_id=seed,
        total_paths=len(discovered_paths),
        paths=discovered_paths,
        visited_nodes=sorted(list(visited_nodes)),
        execution_time_ms=elapsed_ms
    )
