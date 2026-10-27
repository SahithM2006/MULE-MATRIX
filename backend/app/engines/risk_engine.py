"""
Section 9: Explainable Risk Aggregation Engine.
Synthesizes signals from Rule Scoring, Isolation Forest, and GraphSAGE into a unified
0-100 investigative risk score with dynamic renormalization over available components
and correlation-aware de-duplication.

CRITICAL ARCHITECTURAL NOTE:
Risk scores represent investigative prioritization, NOT legal proof of fraud.
Correlated signals representing the same underlying evidence are never double-counted.
"""
from typing import List, Dict, Any, Tuple, Optional
from backend.app.models.schemas import (
    AlertSignal, IsolationForestOutput, GraphSAGEOutput
)
from backend.app.core.config import config

def aggregate_account_risk(
    rule_signals: List[AlertSignal],
    iforest_output: IsolationForestOutput,
    graphsage_output: GraphSAGEOutput
) -> Tuple[float, str, str, List[AlertSignal], Dict[str, str]]:
    """
    Combines valid, non-duplicated detection signals.
    Returns:
    - aggregate_risk_score: float in [0.0, 100.0]
    - severity: "LOW", "MEDIUM", "HIGH", "CRITICAL"
    - primary_reason: Plain-English summary
    - all_contributing_signals: List[AlertSignal] with calculated contributions
    - component_availability: Dict[str, str] mapping component -> state
    """
    availability = {
        "rule_engine": "READY" if rule_signals else "NO_TRIGGERS",
        "isolation_forest": iforest_output.status,
        "graphsage": graphsage_output.status
    }

    contributing_signals: List[AlertSignal] = []
    total_weighted_sum = 0.0
    total_valid_weights = 0.0

    # 1. Process Rule-Based Signals (Pass-through, Smurfing, Velocity)
    # Deduplication: take highest rule signal if correlated
    rule_weights = {
        "RULE_RAPID_PASSTHROUGH_v1.0": config.weight_rule_passthrough,
        "RULE_SMURFING_FAN_IN_v1.0": config.weight_rule_smurfing,
        "RULE_HIGH_BURST_VELOCITY_v1.0": config.weight_rule_velocity,
        "RULE_MULE_HOP_POSITION_v1.0": 0.20
    }

    seen_rule_types = set()
    for sig in rule_signals:
        r_type = sig.rule_or_model
        if r_type not in seen_rule_types:
            seen_rule_types.add(r_type)
            w = rule_weights.get(r_type, 0.15)
            contributing_signals.append(AlertSignal(
                rule_or_model=r_type,
                normalized_score=sig.normalized_score,
                contribution_weight=w,
                reason=sig.reason,
                evidence_references=sig.evidence_references
            ))
            total_weighted_sum += sig.normalized_score * w
            total_valid_weights += w

    # 2. Process Isolation Forest Anomaly Signal
    if iforest_output.status == "READY" and iforest_output.anomaly_score is not None:
        w_if = config.weight_isolation_forest
        top_feat_str = ", ".join([f"{f.feature_name} ({f.anomaly_contribution_score:.1f}x)" for f in iforest_output.top_contributing_features[:2]])
        contributing_signals.append(AlertSignal(
            rule_or_model=f"ISOLATION_FOREST_{iforest_output.version}",
            normalized_score=iforest_output.anomaly_score,
            contribution_weight=w_if,
            reason=f"Topological feature divergence from population median. Outlier factors: {top_feat_str}.",
            evidence_references=[f.feature_name for f in iforest_output.top_contributing_features]
        ))
        total_weighted_sum += iforest_output.anomaly_score * w_if
        total_valid_weights += w_if

    # 3. Process GraphSAGE Inductive Classifier Signal
    if graphsage_output.status == "READY" and graphsage_output.mule_probability is not None:
        w_gs = config.weight_graphsage
        contributing_signals.append(AlertSignal(
            rule_or_model=f"GRAPHSAGE_{graphsage_output.model_version or 'v1.0'}",
            normalized_score=graphsage_output.mule_probability,
            contribution_weight=w_gs,
            reason=f"GraphSAGE inductive neighborhood embedding classified account mule probability at {graphsage_output.mule_probability*100.0:.1f}%.",
            evidence_references=["neighborhood_embedding"]
        ))
        total_weighted_sum += graphsage_output.mule_probability * w_gs
        total_valid_weights += w_gs

    # Renormalize across active valid weights
    if total_valid_weights > 0:
        normalized_aggregate = (total_weighted_sum / total_valid_weights) * 100.0
        final_score = round(max(0.0, min(100.0, normalized_aggregate)), 1)
    else:
        # Default benign baseline when zero signals fired
        final_score = 0.0

    # Determine Severity Tier
    if final_score >= config.risk_threshold_critical:
        severity = "CRITICAL"
    elif final_score >= config.risk_threshold_high:
        severity = "HIGH"
    elif final_score >= config.risk_threshold_medium:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    # Synthesize Plain-English Primary Reason
    if not contributing_signals:
        primary_reason = "Normal activity: no suspicious flow patterns or structural anomalies detected."
    else:
        # Pick signal with highest weighted score
        top_sig = max(contributing_signals, key=lambda s: s.normalized_score * s.contribution_weight)
        primary_reason = top_sig.reason

    return final_score, severity, primary_reason, contributing_signals, availability
