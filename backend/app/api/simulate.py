"""
Simulation and Investigation Replay API Endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import HeroReplayStep
from backend.app.data.hero_scenario import generate_hero_data
from backend.app.data.synthetic_generator import generate_synthetic_dataset

router = APIRouter(prefix="/simulate", tags=["Simulation"])

@router.get("/replay/hero", response_model=List[HeroReplayStep])
def get_hero_scenario_replay():
    """Returns the 9 chronological investigation replay steps for the deterministic hero scenario."""
    accounts, transactions, lineage_events = generate_hero_data()
    
    steps = [
        HeroReplayStep(
            step_number=1,
            title="Victim Phishing Compromise & Outbound Transfer",
            timestamp=transactions[0]["timestamp"],
            source_account="ACC_HERO_VICTIM_001",
            destination_account="ACC_HERO_MULE_L1_A",
            amount=250000.0,
            tx_type="transfer",
            lineage_event_id=lineage_events[0]["event_id"],
            detection_events=["High Value Inflow to New Counterparty"],
            alert_triggered=None,
            explanation="Victim initiates first split payment of ₹250,000 e-INR following social engineering attack."
        ),
        HeroReplayStep(
            step_number=2,
            title="Parallel Structuring to Layer 1 Mule B",
            timestamp=transactions[1]["timestamp"],
            source_account="ACC_HERO_VICTIM_001",
            destination_account="ACC_HERO_MULE_L1_B",
            amount=250000.0,
            tx_type="transfer",
            lineage_event_id=lineage_events[1]["event_id"],
            detection_events=["Split Fan-Out Pattern Detected (2x ₹250,000)"],
            alert_triggered="MEDIUM - Structured Fan-Out",
            explanation="Second transaction occurs 90 seconds later, splitting ₹500,000 across two newly created mule accounts."
        ),
        HeroReplayStep(
            step_number=3,
            title="Rapid Pass-Through Forwarding (Mule L1_A)",
            timestamp=transactions[2]["timestamp"],
            source_account="ACC_HERO_MULE_L1_A",
            destination_account="ACC_HERO_MULE_L2_CONVERGE",
            amount=248000.0,
            tx_type="transfer",
            lineage_event_id=lineage_events[2]["event_id"],
            detection_events=["RULE_RAPID_PASSTHROUGH (Delay: 5.0 mins, Ratio: 99.2%)"],
            alert_triggered="HIGH - Rapid Pass-Through Forwarding",
            explanation="Mule L1_A holds funds for only 5 minutes before transferring 99.2% downstream to intermediate collector hub."
        ),
        HeroReplayStep(
            step_number=4,
            title="Convergence Layering (Mule L1_B)",
            timestamp=transactions[3]["timestamp"],
            source_account="ACC_HERO_MULE_L1_B",
            destination_account="ACC_HERO_MULE_L2_CONVERGE",
            amount=247000.0,
            tx_type="transfer",
            lineage_event_id=lineage_events[3]["event_id"],
            detection_events=["RULE_RAPID_PASSTHROUGH (Delay: 5.0 mins, Ratio: 98.8%)"],
            alert_triggered="HIGH - Multi-Branch Inflow Convergence",
            explanation="Mule L1_B forwards remaining funds to the same collector hub, achieving funneling convergence."
        ),
        HeroReplayStep(
            step_number=5,
            title="Terminal Cash-Out Conversion Attempt",
            timestamp=transactions[4]["timestamp"],
            source_account="ACC_HERO_MULE_L2_CONVERGE",
            destination_account="ACC_HERO_CASHOUT_DEST_999",
            amount=490000.0,
            tx_type="cashout",
            lineage_event_id=lineage_events[4]["event_id"],
            detection_events=["Terminal Cashout Endpoint", "Large Aggregated Outflow"],
            alert_triggered="CRITICAL - Potential Cash-Out Conversion",
            explanation="Consolidated funds directed to high-risk digital asset on-ramp destination for final cash-out."
        ),
        HeroReplayStep(
            step_number=6,
            title="SHA-256 Token Provenance Verification",
            timestamp=transactions[4]["timestamp"],
            source_account="SYSTEM_LINEAGE",
            destination_account="ALL_HERO_NODES",
            amount=490000.0,
            tx_type="lineage_verify",
            lineage_event_id="FULL_CHAIN_VERIFIED",
            detection_events=["5 Chained SHA-256 Hashes Verified", "Zero Broken Pointers"],
            alert_triggered=None,
            explanation="Lineage Engine verifies full cryptographic hash chain (Genesis -> Hop 1 -> Hop 2 -> Hop 3) without integrity errors."
        ),
        HeroReplayStep(
            step_number=7,
            title="Graph Intelligence & BFS Reconstruction",
            timestamp=transactions[4]["timestamp"],
            source_account="GRAPH_ENGINE",
            destination_account="ATTACK_GRAPH",
            amount=0.0,
            tx_type="graph_analysis",
            lineage_event_id="BFS_PATH_4HOPS",
            detection_events=["Temporal BFS discovers 3-hop directed tree", "High In/Out Degree Asymmetry"],
            alert_triggered="HIGH - Temporal Flow Path Verified",
            explanation="Time-constrained BFS maps the directed transfer tree connecting Victim -> Mule A/B -> Hub -> Cash-Out within 15 minutes."
        ),
        HeroReplayStep(
            step_number=8,
            title="GraphSAGE Inductive Neighborhood Classification",
            timestamp=transactions[4]["timestamp"],
            source_account="ML_ENGINE",
            destination_account="ACC_HERO_MULE_L2_CONVERGE",
            amount=0.0,
            tx_type="model_inference",
            lineage_event_id="GRAPHSAGE_INFERENCE",
            detection_events=["GraphSAGE Mule Probability: 94.2%", "Isolation Forest Score: 0.88"],
            alert_triggered="CRITICAL - Machine Learning High-Risk Node",
            explanation="GraphSAGE neural aggregation identifies intermediate hub node as possessing high-probability mule topological signature."
        ),
        HeroReplayStep(
            step_number=9,
            title="Explainable Risk Synthesis & Case Escalation",
            timestamp=transactions[4]["timestamp"],
            source_account="RISK_ENGINE",
            destination_account="INCIDENT_RESPONSE",
            amount=490000.0,
            tx_type="case_escalation",
            lineage_event_id="CASE_DISPATCHED",
            detection_events=["Composite Risk Score: 94.0/100", "Pre-Conversion Review Workflow Triggered"],
            alert_triggered="CRITICAL ALERT DISPATCHED",
            explanation="Risk Engine synthesizes combined non-duplicated evidence into a 94/100 alert, prompting immediate analyst pre-conversion review."
        )
    ]
    return steps

@router.post("/scenario")
def generate_scenario_endpoint(payload: Dict[str, Any] = Body(...)):
    """Simulates targeted synthetic fraud scenarios on demand, saves records, and executes detection pipeline."""
    scenario_type = payload.get("scenario_type", "smurfing")
    seed = payload.get("seed", 101)
    
    from backend.app.data.scenario_builder import build_and_execute_scenario
    return build_and_execute_scenario(scenario_type, seed)
