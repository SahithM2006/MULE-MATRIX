"""
Deterministic hero scenario generator for MULE MATRIX.
Provides verified ground-truth and temporal multi-hop flow for end-to-end testing and incident replay.
"""
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Tuple, Any

HERO_ACCOUNTS = [
    {
        "account_id": "ACC_HERO_VICTIM_001",
        "account_number": "IN910000000001",
        "account_type": "victim",
        "kyc_risk_score": 0.05,
        "scenario_tag": "hero_victim",
        "ground_truth_label": 0,
        "created_at": "2026-01-10T00:00:00Z"
    },
    {
        "account_id": "ACC_HERO_MULE_L1_A",
        "account_number": "IN910000000011",
        "account_type": "mule_suspect",
        "kyc_risk_score": 0.72,
        "scenario_tag": "hero_mule_l1",
        "ground_truth_label": 1,
        "created_at": "2026-09-01T00:00:00Z"
    },
    {
        "account_id": "ACC_HERO_MULE_L1_B",
        "account_number": "IN910000000012",
        "account_type": "mule_suspect",
        "kyc_risk_score": 0.68,
        "scenario_tag": "hero_mule_l1",
        "ground_truth_label": 1,
        "created_at": "2026-09-05T00:00:00Z"
    },
    {
        "account_id": "ACC_HERO_MULE_L2_CONVERGE",
        "account_number": "IN910000000021",
        "account_type": "mule_suspect",
        "kyc_risk_score": 0.85,
        "scenario_tag": "hero_mule_l2",
        "ground_truth_label": 1,
        "created_at": "2026-08-15T00:00:00Z"
    },
    {
        "account_id": "ACC_HERO_CASHOUT_DEST_999",
        "account_number": "IN910000000099",
        "account_type": "cashout",
        "kyc_risk_score": 0.95,
        "scenario_tag": "hero_cashout",
        "ground_truth_label": 1,
        "created_at": "2026-09-20T00:00:00Z"
    }
]

def canonical_serialize(payload: Dict[str, Any]) -> str:
    """Sort keys and serialize canonically to guarantee hash determinism."""
    return json.dumps(payload, sort_keys=True, separators=(',', ':'))

def compute_sha256(canonical_data: str, prev_hash: str) -> str:
    hasher = hashlib.sha256()
    hasher.update((canonical_data + prev_hash).encode('utf-8'))
    return hasher.hexdigest()

def generate_hero_data(base_time_iso: str = "2026-10-27T08:00:00Z") -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates deterministic accounts, transactions, and lineage records for the hero scenario.
    Timeline:
    1. T=02m: Victim -> Mule L1_A (250,000 e-INR)
    2. T=03m: Victim -> Mule L1_B (250,000 e-INR)
    3. T=07m: Mule L1_A -> Mule L2_CONVERGE (248,000 e-INR)
    4. T=08m: Mule L1_B -> Mule L2_CONVERGE (247,000 e-INR)
    5. T=15m: Mule L2_CONVERGE -> Cashout DEST_999 (490,000 e-INR)
    """
    base_time = datetime.fromisoformat(base_time_iso.replace("Z", "+00:00"))
    
    tx_specs = [
        {
            "tx_id": "TX_HERO_001",
            "src": "ACC_HERO_VICTIM_001",
            "dst": "ACC_HERO_MULE_L1_A",
            "amount": 250000.0,
            "delay_mins": 2,
            "tx_type": "transfer",
            "event_id": "EVT_HERO_001"
        },
        {
            "tx_id": "TX_HERO_002",
            "src": "ACC_HERO_VICTIM_001",
            "dst": "ACC_HERO_MULE_L1_B",
            "amount": 250000.0,
            "delay_mins": 3.5,
            "tx_type": "transfer",
            "event_id": "EVT_HERO_002"
        },
        {
            "tx_id": "TX_HERO_003",
            "src": "ACC_HERO_MULE_L1_A",
            "dst": "ACC_HERO_MULE_L2_CONVERGE",
            "amount": 248000.0,
            "delay_mins": 7.0,
            "tx_type": "transfer",
            "event_id": "EVT_HERO_003"
        },
        {
            "tx_id": "TX_HERO_004",
            "src": "ACC_HERO_MULE_L1_B",
            "dst": "ACC_HERO_MULE_L2_CONVERGE",
            "amount": 247000.0,
            "delay_mins": 8.5,
            "tx_type": "transfer",
            "event_id": "EVT_HERO_004"
        },
        {
            "tx_id": "TX_HERO_005",
            "src": "ACC_HERO_MULE_L2_CONVERGE",
            "dst": "ACC_HERO_CASHOUT_DEST_999",
            "amount": 490000.0,
            "delay_mins": 15.0,
            "tx_type": "cashout",
            "event_id": "EVT_HERO_005"
        }
    ]

    transactions = []
    lineage_events = []
    token_id = "TOKR_HERO_500K_GENESIS"
    genesis_hash = hashlib.sha256(f"GENESIS:{token_id}".encode("utf-8")).hexdigest()
    prev_hash = genesis_hash
    parent_event_id = None

    for idx, spec in enumerate(tx_specs, start=1):
        tx_time = base_time + timedelta(minutes=spec["delay_mins"])
        time_iso = tx_time.strftime("%Y-%m-%dT%H:%M:%SZ")

        tx_record = {
            "transaction_id": spec["tx_id"],
            "source_account_id": spec["src"],
            "destination_account_id": spec["dst"],
            "amount": spec["amount"],
            "currency": "e-INR",
            "timestamp": time_iso,
            "tx_type": spec["tx_type"],
            "token_lineage_id": token_id,
            "scenario_id": "hero_scenario"
        }
        transactions.append(tx_record)

        # Build canonical lineage event
        canonical_dict = {
            "amount": spec["amount"],
            "destination": spec["dst"],
            "event_id": spec["event_id"],
            "parent_id": parent_event_id or "GENESIS",
            "sequence": idx,
            "source": spec["src"],
            "timestamp": time_iso,
            "token_id": token_id
        }
        canonical_str = canonical_serialize(canonical_dict)
        curr_hash = compute_sha256(canonical_str, prev_hash)

        event_record = {
            "event_id": spec["event_id"],
            "token_id": token_id,
            "transaction_id": spec["tx_id"],
            "parent_event_id": parent_event_id,
            "source_account_id": spec["src"],
            "destination_account_id": spec["dst"],
            "amount": spec["amount"],
            "timestamp": time_iso,
            "sequence_index": idx,
            "canonical_payload": canonical_str,
            "prev_hash": prev_hash,
            "current_hash": curr_hash,
            "is_verified": 1
        }
        lineage_events.append(event_record)

        parent_event_id = spec["event_id"]
        prev_hash = curr_hash

    return HERO_ACCOUNTS, transactions, lineage_events
