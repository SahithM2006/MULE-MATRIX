"""
Algorithm 1: Sliding-Window Transaction Analysis.
Calculates velocity, burstiness, volume flows, and rapid pass-through behavior
over configurable temporal windows (e.g., 10 minutes, 1 hour, 24 hours).
"""
import numpy as np
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import SlidingWindowMetrics
from backend.app.core.config import config

def parse_iso_timestamp(ts_str: str) -> datetime:
    """Parse ISO8601 string to offset-aware UTC datetime."""
    clean = ts_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def analyze_sliding_window(
    account_id: str,
    transactions: List[Dict[str, Any]],
    window_duration_seconds: int = 3600,
    reference_timestamp: Optional[str] = None,
    window_name: str = "1_hour"
) -> SlidingWindowMetrics:
    """
    Analyzes transactions for a specific account within the window [T_ref - W, T_ref].
    Handles stable boundary conditions, burst calculations, and rapid pass-through detection.
    """
    if not transactions:
        return SlidingWindowMetrics(
            window_name=window_name,
            window_duration_seconds=window_duration_seconds,
            tx_count=0,
            velocity_tx_per_hour=0.0,
            burst_score=0.0,
            inflow_amount=0.0,
            outflow_amount=0.0,
            rapid_passthrough_detected=False,
            median_passthrough_delay_seconds=None,
            passthrough_ratio=None,
            supporting_tx_ids=[]
        )

    # Determine reference end time
    if reference_timestamp:
        t_ref = parse_iso_timestamp(reference_timestamp)
    else:
        # Use latest transaction timestamp involving account
        t_ref = max(parse_iso_timestamp(tx["timestamp"]) for tx in transactions)

    t_start = t_ref - timedelta(seconds=window_duration_seconds)

    # Filter transactions inside [t_start, t_ref]
    in_window_txs = []
    for tx in transactions:
        t_tx = parse_iso_timestamp(tx["timestamp"])
        if t_start <= t_tx <= t_ref:
            if tx["source_account_id"] == account_id or tx["destination_account_id"] == account_id:
                in_window_txs.append((t_tx, tx))

    if not in_window_txs:
        return SlidingWindowMetrics(
            window_name=window_name,
            window_duration_seconds=window_duration_seconds,
            tx_count=0,
            velocity_tx_per_hour=0.0,
            burst_score=0.0,
            inflow_amount=0.0,
            outflow_amount=0.0,
            rapid_passthrough_detected=False,
            median_passthrough_delay_seconds=None,
            passthrough_ratio=None,
            supporting_tx_ids=[]
        )

    # Sort chronologically
    in_window_txs.sort(key=lambda x: x[0])
    tx_count = len(in_window_txs)
    hours = max(window_duration_seconds / 3600.0, 0.001)
    velocity = round(tx_count / hours, 2)

    # Inflow and Outflow sums
    inflows = []
    outflows = []
    inflow_sum = 0.0
    outflow_sum = 0.0
    supporting_tx_ids = []

    for t_tx, tx in in_window_txs:
        supporting_tx_ids.append(tx["transaction_id"])
        amt = float(tx["amount"])
        if tx["destination_account_id"] == account_id:
            inflows.append((t_tx, amt, tx["transaction_id"]))
            inflow_sum += amt
        if tx["source_account_id"] == account_id:
            outflows.append((t_tx, amt, tx["transaction_id"]))
            outflow_sum += amt

    # Burst calculation: partition window into 6 sub-bins
    num_bins = 6
    bin_duration = window_duration_seconds / num_bins
    bin_counts = [0] * num_bins
    for t_tx, _ in in_window_txs:
        offset_sec = (t_tx - t_start).total_seconds()
        b_idx = min(int(offset_sec // bin_duration), num_bins - 1)
        bin_counts[b_idx] += 1
    
    std_dev = float(np.std(bin_counts))
    mean_val = float(np.mean(bin_counts))
    burst_score = round(std_dev / (mean_val + 1.0), 3)

    # Rapid pass-through behavior:
    # Check if an inflow is followed by an outflow of comparable size (85%-105%) within 15 minutes
    rapid_passthrough = False
    passthrough_delays = []
    matched_outflow_indices = set()

    for in_time, in_amt, in_id in inflows:
        for o_idx, (out_time, out_amt, out_id) in enumerate(outflows):
            if o_idx in matched_outflow_indices:
                continue
            if out_time >= in_time:
                delay_sec = (out_time - in_time).total_seconds()
                if delay_sec <= config.rapid_passthrough_max_delay_sec:
                    ratio = out_amt / max(in_amt, 1.0)
                    if config.rapid_passthrough_min_ratio <= ratio <= config.rapid_passthrough_max_ratio:
                        rapid_passthrough = True
                        passthrough_delays.append(delay_sec)
                        matched_outflow_indices.add(o_idx)
                        break

    median_delay = float(np.median(passthrough_delays)) if passthrough_delays else None
    
    # Inflow/outflow ratio
    if inflow_sum > 0 and outflow_sum > 0:
        overall_ratio = round(outflow_sum / inflow_sum, 3)
    else:
        overall_ratio = None

    return SlidingWindowMetrics(
        window_name=window_name,
        window_duration_seconds=window_duration_seconds,
        tx_count=tx_count,
        velocity_tx_per_hour=velocity,
        burst_score=burst_score,
        inflow_amount=round(inflow_sum, 2),
        outflow_amount=round(outflow_sum, 2),
        rapid_passthrough_detected=rapid_passthrough,
        median_passthrough_delay_seconds=median_delay,
        passthrough_ratio=overall_ratio,
        supporting_tx_ids=supporting_tx_ids
    )

def analyze_account_windows(
    account_id: str,
    transactions: List[Dict[str, Any]],
    reference_timestamp: Optional[str] = None
) -> Dict[str, SlidingWindowMetrics]:
    """Computes all three standardized windows: 10 minutes, 1 hour, 24 hours."""
    return {
        "10_min": analyze_sliding_window(
            account_id, transactions, config.window_short_sec, reference_timestamp, "10_minutes"
        ),
        "1_hour": analyze_sliding_window(
            account_id, transactions, config.window_medium_sec, reference_timestamp, "1_hour"
        ),
        "24_hour": analyze_sliding_window(
            account_id, transactions, config.window_long_sec, reference_timestamp, "24_hours"
        )
    }
