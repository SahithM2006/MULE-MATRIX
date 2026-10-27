"""
Unit tests for Algorithm 1: Sliding-Window Transaction Analysis.
"""
import pytest
from datetime import datetime, timezone, timedelta
from backend.app.engines.sliding_window import analyze_sliding_window, analyze_account_windows

def test_sliding_window_boundaries():
    """Verify that transactions immediately outside boundaries are excluded."""
    t_ref = datetime(2026, 10, 27, 12, 0, 0, tzinfo=timezone.utc)
    ref_iso = t_ref.strftime("%Y-%m-%dT%H:%M:%SZ")

    txs = [
        # Inside window (1 hour = 11:00 to 12:00)
        {"transaction_id": "TX_IN_01", "source_account_id": "ACC_A", "destination_account_id": "ACC_B", "amount": 1000.0, "timestamp": "2026-10-27T11:00:00Z"},
        {"transaction_id": "TX_IN_02", "source_account_id": "ACC_B", "destination_account_id": "ACC_C", "amount": 1000.0, "timestamp": "2026-10-27T12:00:00Z"},
        # Outside window (1 second before 11:00)
        {"transaction_id": "TX_OUT_01", "source_account_id": "ACC_A", "destination_account_id": "ACC_B", "amount": 5000.0, "timestamp": "2026-10-27T10:59:59Z"},
        # Outside window (1 second after 12:00)
        {"transaction_id": "TX_OUT_02", "source_account_id": "ACC_B", "destination_account_id": "ACC_C", "amount": 9000.0, "timestamp": "2026-10-27T12:00:01Z"}
    ]

    metrics = analyze_sliding_window(
        account_id="ACC_B",
        transactions=txs,
        window_duration_seconds=3600,
        reference_timestamp=ref_iso,
        window_name="1_hour"
    )

    assert metrics.tx_count == 2
    assert "TX_IN_01" in metrics.supporting_tx_ids
    assert "TX_IN_02" in metrics.supporting_tx_ids
    assert "TX_OUT_01" not in metrics.supporting_tx_ids
    assert "TX_OUT_02" not in metrics.supporting_tx_ids
    assert metrics.inflow_amount == 1000.0
    assert metrics.outflow_amount == 1000.0

def test_sliding_window_empty():
    """Verify empty window produces zero values and graceful fallback."""
    metrics = analyze_sliding_window("ACC_EMPTY", [], 3600)
    assert metrics.tx_count == 0
    assert metrics.velocity_tx_per_hour == 0.0
    assert metrics.burst_score == 0.0
    assert metrics.rapid_passthrough_detected is False
    assert metrics.supporting_tx_ids == []

def test_rapid_passthrough_detection():
    """Verify that rapid inflow and subsequent outflow triggers detection."""
    txs = [
        {"transaction_id": "TX_IN", "source_account_id": "ACC_VICTIM", "destination_account_id": "ACC_MULE", "amount": 100000.0, "timestamp": "2026-10-27T10:00:00Z"},
        # Outflow occurs 3 minutes later with 98% of funds
        {"transaction_id": "TX_OUT", "source_account_id": "ACC_MULE", "destination_account_id": "ACC_CASHOUT", "amount": 98000.0, "timestamp": "2026-10-27T10:03:00Z"}
    ]

    metrics = analyze_sliding_window(
        account_id="ACC_MULE",
        transactions=txs,
        window_duration_seconds=3600,
        reference_timestamp="2026-10-27T10:30:00Z"
    )

    assert metrics.rapid_passthrough_detected is True
    assert metrics.median_passthrough_delay_seconds == 180.0
    assert 0.97 <= metrics.passthrough_ratio <= 0.99
