"""
Algorithm 5: Rule-Based Risk Scoring Engine.
Implements configurable, explainable detection rules that evaluate observable
transaction patterns, sliding-window evidence, and graph topology.
"""
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import AlertSignal, SlidingWindowMetrics, GraphFeaturesMetrics
from backend.app.core.config import config

def evaluate_account_rules(
    account: Dict[str, Any],
    window_metrics: Dict[str, SlidingWindowMetrics],
    graph_features: Optional[GraphFeaturesMetrics] = None,
    bfs_paths: Optional[List[Any]] = None
) -> List[AlertSignal]:
    """
    Evaluates explainable detection rules for an account.
    Distinguishes absent conditions from triggered conditions,
    and contextualizes patterns to avoid falsely penalizing legitimate merchants or payroll.
    """
    signals: List[AlertSignal] = []
    acc_id = account["account_id"]
    acc_type = account.get("account_type", "retail")
    w10m = window_metrics.get("10_min")
    w1h = window_metrics.get("1_hour")
    w24h = window_metrics.get("24_hour")

    # RULE 1: Rapid Pass-Through Detection
    # Fast forwarding of inbound funds with minimal holding time
    if w10m and w10m.rapid_passthrough_detected:
        delay = w10m.median_passthrough_delay_seconds or 180.0
        # Shorter delay -> higher suspicion
        delay_factor = max(0.0, min(1.0, 1.0 - (delay / config.rapid_passthrough_max_delay_sec)))
        score = round(0.70 + 0.30 * delay_factor, 3)

        signals.append(AlertSignal(
            rule_or_model="RULE_RAPID_PASSTHROUGH_v1.0",
            normalized_score=score,
            contribution_weight=config.weight_rule_passthrough,
            reason=(
                f"Rapid pass-through detected: inbound funds forwarded within {delay:.1f} seconds "
                f"with pass-through ratio of {w10m.passthrough_ratio or 1.0:.2f}."
            ),
            evidence_references=w10m.supporting_tx_ids[:4]
        ))
    elif w1h and w1h.rapid_passthrough_detected and acc_type != "merchant":
        delay = w1h.median_passthrough_delay_seconds or 600.0
        score = round(0.60 + 0.25 * max(0.0, 1.0 - (delay / 3600.0)), 3)
        signals.append(AlertSignal(
            rule_or_model="RULE_RAPID_PASSTHROUGH_v1.0",
            normalized_score=score,
            contribution_weight=config.weight_rule_passthrough,
            reason=f"Hourly pass-through pattern: inflow followed by outflow in {delay/60.0:.1f} minutes.",
            evidence_references=w1h.supporting_tx_ids[:4]
        ))

    # RULE 2: Smurfing / Structuring Fan-In
    # Multiple deposits just below regulatory limits (< 50,000) into a single collector
    if acc_type != "merchant" and graph_features:
        if graph_features.in_degree >= 4 and graph_features.fan_in_ratio >= 0.75:
            # Check window volume and velocity
            if w1h and w1h.tx_count >= 4 and w1h.inflow_amount > 100000.0:
                avg_inflow = w1h.inflow_amount / max(1, w1h.tx_count)
                # Smurfing range: typical deposits between 30,000 and 49,999
                if 25000.0 <= avg_inflow <= 49999.0:
                    smurf_score = round(min(1.0, 0.65 + 0.05 * graph_features.in_degree), 3)
                    signals.append(AlertSignal(
                        rule_or_model="RULE_SMURFING_FAN_IN_v1.0",
                        normalized_score=smurf_score,
                        contribution_weight=config.weight_rule_smurfing,
                        reason=(
                            f"Smurfing fan-in pattern: {graph_features.in_degree} distinct senders deposited "
                            f"structured amounts (avg ₹{avg_inflow:,.2f}) within active window."
                        ),
                        evidence_references=w1h.supporting_tx_ids[:6]
                    ))

    # RULE 3: Sudden Burst Velocity
    # Transaction velocity spike exceeding baseline behavior
    if w1h and w1h.burst_score >= 1.1 and w1h.velocity_tx_per_hour >= 8.0:
        if acc_type != "merchant":  # Legitimate merchants naturally have continuous high velocity
            burst_norm = round(min(1.0, (w1h.burst_score - 1.0) * 0.8 + 0.4), 3)
            signals.append(AlertSignal(
                rule_or_model="RULE_HIGH_BURST_VELOCITY_v1.0",
                normalized_score=burst_norm,
                contribution_weight=config.weight_rule_velocity,
                reason=(
                    f"Burst activity spike: velocity surged to {w1h.velocity_tx_per_hour:.1f} tx/hr "
                    f"with burst coefficient {w1h.burst_score:.2f}."
                ),
                evidence_references=w1h.supporting_tx_ids[:4]
            ))

    # RULE 4: Multi-Hop Mule Path Connectivity
    # Identified by BFS tracing on active fund paths
    if bfs_paths:
        for p in bfs_paths:
            # Check if this account is intermediate or destination
            accounts_in_path = getattr(p, "accounts_in_path", [])
            if acc_id in accounts_in_path:
                hop_idx = accounts_in_path.index(acc_id)
                if hop_idx > 0:  # Not the victim seed
                    is_endpoint = (hop_idx == len(accounts_in_path) - 1)
                    score = 0.95 if is_endpoint else 0.85
                    signals.append(AlertSignal(
                        rule_or_model="RULE_MULE_HOP_POSITION_v1.0",
                        normalized_score=score,
                        contribution_weight=0.20,
                        reason=(
                            f"Account occupies hop #{hop_idx} on verified multi-hop temporal flow "
                            f"(Path: {' -> '.join(accounts_in_path[:4])})."
                        ),
                        evidence_references=[h.transaction_id for h in getattr(p, "hops", [])[:4]]
                    ))
                    break

    return signals
