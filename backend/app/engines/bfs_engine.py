"""
Algorithm 3: Time-Constrained Breadth-First Search (BFS).
Reconstructs multi-hop financial transfer flows forward, backward, or combined from a seed account,
enforcing temporal monotonicity, hop depth boundaries, and cycle suppression.

CRITICAL ARCHITECTURAL NOTE:
The result of this search is an explainable topological reconstruction of recorded fund flows.
It does not establish legal ownership or guilt.
"""
import time
from collections import deque
from datetime import datetime, timezone
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

def _is_off_ramp(account_id: str) -> bool:
    acc_upper = account_id.upper()
    return "CASHOUT" in acc_upper or "ATM" in acc_upper or "OFFRAMP" in acc_upper or "CRYPTO_EXCHANGE" in acc_upper

def _trace_single_direction(
    seed: str,
    direction: str,
    max_hops: int,
    window_sec: int,
    min_amount: float,
    req_start_dt: Optional[datetime],
    all_transactions: List[Dict[str, Any]]
) -> tuple[List[DiscoveredPath], Set[str]]:
    """Internal helper to trace in one direction (forward or backward)."""
    # Index transactions for O(1) adjacency lookup
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

    # Queue item: (curr_acc, hops_so_far, path_accs, last_time, path_start_dt)
    queue = deque()

    seed_edges = adjacency.get(seed, [])
    for tx in seed_edges:
        tx_dt = parse_iso(tx["timestamp"])
        if req_start_dt and direction == "forward" and tx_dt < req_start_dt:
            continue
        if req_start_dt and direction == "backward" and tx_dt > req_start_dt:
            continue

        next_acc = tx["destination_account_id"] if direction == "forward" else tx["source_account_id"]
        if next_acc == seed:
            continue

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

    while queue:
        curr_acc, hops_so_far, path_accs, last_time, path_start_dt = queue.popleft()
        current_depth = len(hops_so_far)

        # Check neighbor expansions
        neighbor_txs = adjacency.get(curr_acc, [])
        valid_next_hops = []
        window_exceeded_count = 0

        if current_depth < max_hops and not _is_off_ramp(curr_acc):
            for n_tx in neighbor_txs:
                n_dt = parse_iso(n_tx["timestamp"])
                next_node = n_tx["destination_account_id"] if direction == "forward" else n_tx["source_account_id"]

                # Cycle suppression
                if next_node in path_accs:
                    continue

                # Temporal constraint checks
                if direction == "forward":
                    if n_dt < last_time:
                        continue
                    if (n_dt - path_start_dt).total_seconds() > window_sec:
                        window_exceeded_count += 1
                        continue
                else:
                    if n_dt > last_time:
                        continue
                    if (path_start_dt - n_dt).total_seconds() > window_sec:
                        window_exceeded_count += 1
                        continue

                valid_next_hops.append((next_node, n_tx, n_dt))

        # Determine stop reason if this path does not continue or if it reached an off-ramp
        stop_reason = "MAX_HOPS_REACHED"
        if _is_off_ramp(curr_acc):
            stop_reason = "OFF_RAMP_REACHED"
        elif current_depth >= max_hops:
            stop_reason = "MAX_HOPS_REACHED"
        elif window_exceeded_count > 0 and len(valid_next_hops) == 0:
            stop_reason = "LOOKBACK_OR_LOOKAHEAD_WINDOW_EXCEEDED"
        elif len(valid_next_hops) == 0:
            stop_reason = "NO_ELIGIBLE_INCOMING_OR_OUTGOING_TRANSACTIONS"

        # Record path
        total_amt = sum(h.amount for h in hops_so_far)
        path_id = f"PATH_{direction.upper()}_{seed}_{curr_acc}_{hops_so_far[0].transaction_id}_{hops_so_far[-1].transaction_id}"
        duration = abs((last_time - path_start_dt).total_seconds())

        discovered_paths.append(DiscoveredPath(
            path_id=path_id,
            hops=list(hops_so_far),
            total_amount=round(total_amt, 2),
            start_timestamp=hops_so_far[0].timestamp,
            end_timestamp=hops_so_far[-1].timestamp,
            duration_seconds=duration,
            accounts_in_path=[seed] + [h.destination_account_id if direction == "forward" else h.source_account_id for h in hops_so_far],
            stop_reason=stop_reason,
            direction=direction
        ))

        # Enqueue next steps
        for next_node, n_tx, n_dt in valid_next_hops:
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

    return discovered_paths, visited_nodes

def trace_time_constrained_bfs(
    request: BFSRequest,
    all_transactions: List[Dict[str, Any]]
) -> BFSResponse:
    """
    Executes time-constrained BFS starting from request.seed_account_id.
    Supports 'forward', 'backward', and 'combined' trace directions.
    """
    start_cpu_time = time.perf_counter()
    seed = request.seed_account_id
    max_hops = max(1, min(request.max_hops, 8))
    window_sec = request.time_window_seconds
    direction = request.direction.lower()
    min_amount = request.min_amount or 0.0

    req_start_dt = parse_iso(request.start_timestamp) if request.start_timestamp else None

    if direction == "combined":
        fwd_paths, fwd_nodes = _trace_single_direction(
            seed, "forward", max_hops, window_sec, min_amount, req_start_dt, all_transactions
        )
        bwd_paths, bwd_nodes = _trace_single_direction(
            seed, "backward", max_hops, window_sec, min_amount, req_start_dt, all_transactions
        )
        all_paths = fwd_paths + bwd_paths
        all_nodes = fwd_nodes.union(bwd_nodes)
    else:
        all_paths, all_nodes = _trace_single_direction(
            seed, direction, max_hops, window_sec, min_amount, req_start_dt, all_transactions
        )

    # Calculate stop reasons summary
    summary: Dict[str, int] = {}
    for p in all_paths:
        reason = p.stop_reason or "UNKNOWN"
        summary[reason] = summary.get(reason, 0) + 1

    elapsed_ms = round((time.perf_counter() - start_cpu_time) * 1000.0, 2)
    return BFSResponse(
        seed_account_id=seed,
        total_paths=len(all_paths),
        paths=all_paths,
        visited_nodes=sorted(list(all_nodes)),
        execution_time_ms=elapsed_ms,
        stop_reasons_summary=summary
    )
