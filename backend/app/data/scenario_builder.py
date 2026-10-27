"""
Targeted synthetic scenario generator for Scenario Simulator.
Constructs reproducible archetypes, saves them to SQLite database,
and triggers full pipeline detection to produce authentic detection evidence.
"""
import random
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple
from backend.app.data.hero_scenario import canonical_serialize, compute_sha256
from backend.app.db.database import get_connection
from backend.app.services.detection_service import run_full_detection_pipeline

def build_and_execute_scenario(scenario_type: str, seed: int = 101) -> Dict[str, Any]:
    random.seed(seed)
    now = datetime.now(timezone.utc)
    base_time = now - timedelta(hours=2)

    accounts: List[Dict[str, Any]] = []
    transactions: List[Dict[str, Any]] = []
    lineage_events: List[Dict[str, Any]] = []

    prefix = f"SIM_{seed}"

    if scenario_type == "smurfing":
        coll_id = f"ACC_{prefix}_SMURF_COLL"
        exit_id = f"ACC_{prefix}_SMURF_EXIT"

        accounts.append({
            "account_id": coll_id,
            "account_number": f"IN951{seed:04d}0001",
            "account_type": "mule_suspect",
            "kyc_risk_score": 0.78,
            "scenario_tag": "smurfing_collector",
            "ground_truth_label": 1,
            "created_at": base_time.isoformat()
        })
        accounts.append({
            "account_id": exit_id,
            "account_number": f"IN951{seed:04d}9999",
            "account_type": "cashout",
            "kyc_risk_score": 0.89,
            "scenario_tag": "smurfing_exit",
            "ground_truth_label": 1,
            "created_at": base_time.isoformat()
        })

        total_collected = 0.0
        smurf_count = 8
        for i in range(smurf_count):
            s_id = f"ACC_{prefix}_SMURF_SRC_{i+1:02d}"
            accounts.append({
                "account_id": s_id,
                "account_number": f"IN951{seed:04d}{i+2:04d}",
                "account_type": "mule_suspect",
                "kyc_risk_score": 0.65,
                "scenario_tag": "smurfing_source",
                "ground_truth_label": 1,
                "created_at": base_time.isoformat()
            })
            amount = round(random.uniform(43000.0, 48500.0), 2)
            total_collected += amount
            tx_time = base_time + timedelta(minutes=i * 3 + random.randint(1, 2))
            transactions.append({
                "transaction_id": f"TX_{prefix}_SMURF_IN_{i+1:02d}",
                "source_account_id": s_id,
                "destination_account_id": coll_id,
                "amount": amount,
                "currency": "e-INR",
                "timestamp": tx_time.isoformat(),
                "tx_type": "transfer",
                "token_lineage_id": None,
                "scenario_id": f"sim_smurfing_{seed}"
            })

        exit_time = base_time + timedelta(minutes=smurf_count * 3 + 8)
        transactions.append({
            "transaction_id": f"TX_{prefix}_SMURF_OUT",
            "source_account_id": coll_id,
            "destination_account_id": exit_id,
            "amount": round(total_collected * 0.98, 2),
            "currency": "e-INR",
            "timestamp": exit_time.isoformat(),
            "tx_type": "cashout",
            "token_lineage_id": None,
            "scenario_id": f"sim_smurfing_{seed}"
        })

    elif scenario_type == "rapid_passthrough":
        src_id = f"ACC_{prefix}_PT_VICTIM"
        mule_id = f"ACC_{prefix}_PT_MULE"
        dest_id = f"ACC_{prefix}_PT_CASHOUT"

        accounts.append({
            "account_id": src_id,
            "account_number": f"IN961{seed:04d}0001",
            "account_type": "retail",
            "kyc_risk_score": 0.15,
            "scenario_tag": "victim",
            "ground_truth_label": 0,
            "created_at": base_time.isoformat()
        })
        accounts.append({
            "account_id": mule_id,
            "account_number": f"IN961{seed:04d}0002",
            "account_type": "mule_suspect",
            "kyc_risk_score": 0.82,
            "scenario_tag": "rapid_passthrough",
            "ground_truth_label": 1,
            "created_at": base_time.isoformat()
        })
        accounts.append({
            "account_id": dest_id,
            "account_number": f"IN961{seed:04d}9999",
            "account_type": "cashout",
            "kyc_risk_score": 0.92,
            "scenario_tag": "cashout_dest",
            "ground_truth_label": 1,
            "created_at": base_time.isoformat()
        })

        in_amt = round(random.uniform(220000.0, 340000.0), 2)
        out_amt = round(in_amt * 0.985, 2)
        tok_id = f"TOKR_SIM_PT_{seed}"

        t1 = base_time
        t2 = base_time + timedelta(minutes=4)

        transactions.append({
            "transaction_id": f"TX_{prefix}_PT_IN",
            "source_account_id": src_id,
            "destination_account_id": mule_id,
            "amount": in_amt,
            "currency": "e-INR",
            "timestamp": t1.isoformat(),
            "tx_type": "transfer",
            "token_lineage_id": tok_id,
            "scenario_id": f"sim_rapid_passthrough_{seed}"
        })
        transactions.append({
            "transaction_id": f"TX_{prefix}_PT_OUT",
            "source_account_id": mule_id,
            "destination_account_id": dest_id,
            "amount": out_amt,
            "currency": "e-INR",
            "timestamp": t2.isoformat(),
            "tx_type": "transfer",
            "token_lineage_id": tok_id,
            "scenario_id": f"sim_rapid_passthrough_{seed}"
        })

        # Lineage events
        gen_hash = hashlib.sha256(f"GENESIS:{tok_id}".encode("utf-8")).hexdigest()
        p1 = canonical_serialize({"amount": in_amt, "destination": mule_id, "event_id": f"EVT_{prefix}_1", "sequence": 1, "source": src_id, "timestamp": t1.isoformat(), "token_id": tok_id})
        h1 = compute_sha256(p1, gen_hash)
        lineage_events.append({
            "event_id": f"EVT_{prefix}_1", "token_id": tok_id, "transaction_id": f"TX_{prefix}_PT_IN",
            "parent_event_id": None, "source_account_id": src_id, "destination_account_id": mule_id,
            "amount": in_amt, "timestamp": t1.isoformat(), "sequence_index": 1, "canonical_payload": p1,
            "prev_hash": gen_hash, "current_hash": h1, "is_verified": 1
        })
        p2 = canonical_serialize({"amount": out_amt, "destination": dest_id, "event_id": f"EVT_{prefix}_2", "sequence": 2, "source": mule_id, "timestamp": t2.isoformat(), "token_id": tok_id})
        h2 = compute_sha256(p2, h1)
        lineage_events.append({
            "event_id": f"EVT_{prefix}_2", "token_id": tok_id, "transaction_id": f"TX_{prefix}_PT_OUT",
            "parent_event_id": f"EVT_{prefix}_1", "source_account_id": mule_id, "destination_account_id": dest_id,
            "amount": out_amt, "timestamp": t2.isoformat(), "sequence_index": 2, "canonical_payload": p2,
            "prev_hash": h1, "current_hash": h2, "is_verified": 1
        })

    elif scenario_type == "layering":
        entry_id = f"ACC_{prefix}_LAY_ENTRY"
        t1_a = f"ACC_{prefix}_LAY_T1_A"
        t1_b = f"ACC_{prefix}_LAY_T1_B"
        t2_hub = f"ACC_{prefix}_LAY_T2_HUB"
        exit_id = f"ACC_{prefix}_LAY_EXIT"

        accounts.extend([
            {"account_id": entry_id, "account_number": f"IN971{seed:04d}0001", "account_type": "retail", "kyc_risk_score": 0.2, "scenario_tag": "layering_entry", "ground_truth_label": 0, "created_at": base_time.isoformat()},
            {"account_id": t1_a, "account_number": f"IN971{seed:04d}0002", "account_type": "mule_suspect", "kyc_risk_score": 0.75, "scenario_tag": "layering_tier1", "ground_truth_label": 1, "created_at": base_time.isoformat()},
            {"account_id": t1_b, "account_number": f"IN971{seed:04d}0003", "account_type": "mule_suspect", "kyc_risk_score": 0.75, "scenario_tag": "layering_tier1", "ground_truth_label": 1, "created_at": base_time.isoformat()},
            {"account_id": t2_hub, "account_number": f"IN971{seed:04d}0004", "account_type": "mule_suspect", "kyc_risk_score": 0.88, "scenario_tag": "layering_tier2", "ground_truth_label": 1, "created_at": base_time.isoformat()},
            {"account_id": exit_id, "account_number": f"IN971{seed:04d}9999", "account_type": "cashout", "kyc_risk_score": 0.95, "scenario_tag": "layering_exit", "ground_truth_label": 1, "created_at": base_time.isoformat()}
        ])

        transactions.append({"transaction_id": f"TX_{prefix}_LAY_1", "source_account_id": entry_id, "destination_account_id": t1_a, "amount": 180000.0, "currency": "e-INR", "timestamp": (base_time + timedelta(minutes=2)).isoformat(), "tx_type": "transfer", "token_lineage_id": None, "scenario_id": f"sim_layering_{seed}"})
        transactions.append({"transaction_id": f"TX_{prefix}_LAY_2", "source_account_id": entry_id, "destination_account_id": t1_b, "amount": 180000.0, "currency": "e-INR", "timestamp": (base_time + timedelta(minutes=4)).isoformat(), "tx_type": "transfer", "token_lineage_id": None, "scenario_id": f"sim_layering_{seed}"})
        transactions.append({"transaction_id": f"TX_{prefix}_LAY_3", "source_account_id": t1_a, "destination_account_id": t2_hub, "amount": 178000.0, "currency": "e-INR", "timestamp": (base_time + timedelta(minutes=10)).isoformat(), "tx_type": "transfer", "token_lineage_id": None, "scenario_id": f"sim_layering_{seed}"})
        transactions.append({"transaction_id": f"TX_{prefix}_LAY_4", "source_account_id": t1_b, "destination_account_id": t2_hub, "amount": 178000.0, "currency": "e-INR", "timestamp": (base_time + timedelta(minutes=12)).isoformat(), "tx_type": "transfer", "token_lineage_id": None, "scenario_id": f"sim_layering_{seed}"})
        transactions.append({"transaction_id": f"TX_{prefix}_LAY_5", "source_account_id": t2_hub, "destination_account_id": exit_id, "amount": 350000.0, "currency": "e-INR", "timestamp": (base_time + timedelta(minutes=20)).isoformat(), "tx_type": "cashout", "token_lineage_id": None, "scenario_id": f"sim_layering_{seed}"})

    elif scenario_type == "mule_ring":
        ring_nodes = [f"ACC_{prefix}_RING_{i+1:02d}" for i in range(6)]
        for i, nid in enumerate(ring_nodes):
            accounts.append({
                "account_id": nid,
                "account_number": f"IN981{seed:04d}{i+1:04d}",
                "account_type": "mule_suspect" if i < 5 else "cashout",
                "kyc_risk_score": 0.85,
                "scenario_tag": "connected_mule_ring",
                "ground_truth_label": 1,
                "created_at": base_time.isoformat()
            })

        for i in range(len(ring_nodes) - 1):
            src = ring_nodes[i]
            dst = ring_nodes[(i + 1) % len(ring_nodes)]
            tx_t = base_time + timedelta(minutes=i * 6 + random.randint(1, 3))
            transactions.append({
                "transaction_id": f"TX_{prefix}_RING_{i+1}",
                "source_account_id": src,
                "destination_account_id": dst,
                "amount": round(random.uniform(45000.0, 85000.0), 2),
                "currency": "e-INR",
                "timestamp": tx_t.isoformat(),
                "tx_type": "transfer",
                "token_lineage_id": None,
                "scenario_id": f"sim_mule_ring_{seed}"
            })

    elif scenario_type == "merchant_fanin":
        merch_id = f"ACC_{prefix}_MERCHANT"
        accounts.append({
            "account_id": merch_id,
            "account_number": f"IN931{seed:04d}0001",
            "account_type": "merchant",
            "kyc_risk_score": 0.08,
            "scenario_tag": "merchant_fanin",
            "ground_truth_label": 0,
            "created_at": base_time.isoformat()
        })
        for i in range(15):
            cust_id = f"ACC_{prefix}_CUST_{i+1:02d}"
            accounts.append({
                "account_id": cust_id,
                "account_number": f"IN931{seed:04d}{i+2:04d}",
                "account_type": "retail",
                "kyc_risk_score": 0.04,
                "scenario_tag": "retail_customer",
                "ground_truth_label": 0,
                "created_at": base_time.isoformat()
            })
            tx_t = base_time + timedelta(minutes=i * 8 + random.randint(1, 4))
            transactions.append({
                "transaction_id": f"TX_{prefix}_MERCH_{i+1:02d}",
                "source_account_id": cust_id,
                "destination_account_id": merch_id,
                "amount": round(random.uniform(300.0, 4500.0), 2),
                "currency": "e-INR",
                "timestamp": tx_t.isoformat(),
                "tx_type": "merchant_pay",
                "token_lineage_id": None,
                "scenario_id": f"sim_merchant_{seed}"
            })

    else:  # payroll_fanout
        corp_id = f"ACC_{prefix}_CORP"
        accounts.append({
            "account_id": corp_id,
            "account_number": f"IN921{seed:04d}0001",
            "account_type": "merchant",
            "kyc_risk_score": 0.05,
            "scenario_tag": "payroll_employer",
            "ground_truth_label": 0,
            "created_at": base_time.isoformat()
        })
        for i in range(15):
            emp_id = f"ACC_{prefix}_EMP_{i+1:02d}"
            accounts.append({
                "account_id": emp_id,
                "account_number": f"IN921{seed:04d}{i+2:04d}",
                "account_type": "retail",
                "kyc_risk_score": 0.03,
                "scenario_tag": "payroll_employee",
                "ground_truth_label": 0,
                "created_at": base_time.isoformat()
            })
            tx_t = base_time + timedelta(minutes=random.randint(1, 10))
            transactions.append({
                "transaction_id": f"TX_{prefix}_PAY_{i+1:02d}",
                "source_account_id": corp_id,
                "destination_account_id": emp_id,
                "amount": round(random.uniform(55000.0, 95000.0), 2),
                "currency": "e-INR",
                "timestamp": tx_t.isoformat(),
                "tx_type": "payroll",
                "token_lineage_id": None,
                "scenario_id": f"sim_payroll_{seed}"
            })

    # Persist generated scenario to SQLite
    conn = get_connection()
    try:
        cursor = conn.cursor()
        for a in accounts:
            cursor.execute(
                """
                INSERT OR REPLACE INTO accounts (account_id, account_number, account_type, kyc_risk_score, scenario_tag, ground_truth_label, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (a["account_id"], a["account_number"], a["account_type"], a["kyc_risk_score"], a["scenario_tag"], a["ground_truth_label"], a["created_at"])
            )

        for t in transactions:
            cursor.execute(
                """
                INSERT OR REPLACE INTO transactions (transaction_id, source_account_id, destination_account_id, amount, currency, timestamp, tx_type, token_lineage_id, scenario_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (t["transaction_id"], t["source_account_id"], t["destination_account_id"], t["amount"], t["currency"], t["timestamp"], t["tx_type"], t["token_lineage_id"], t["scenario_id"])
            )

        for le in lineage_events:
            cursor.execute(
                """
                INSERT OR REPLACE INTO lineage_events (event_id, token_id, transaction_id, parent_event_id, source_account_id, destination_account_id, amount, timestamp, sequence_index, canonical_payload, prev_hash, current_hash, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (le["event_id"], le["token_id"], le["transaction_id"], le["parent_event_id"], le["source_account_id"], le["destination_account_id"], le["amount"], le["timestamp"], le["sequence_index"], le["canonical_payload"], le["prev_hash"], le["current_hash"], le["is_verified"])
            )
        conn.commit()
    finally:
        conn.close()

    # Run detection pipeline over updated database
    pipeline_res = run_full_detection_pipeline()

    # Query newly generated alerts for these accounts
    conn = get_connection()
    alerts_found = []
    try:
        cursor = conn.cursor()
        acc_ids = [a["account_id"] for a in accounts]
        placeholders = ",".join(["?"] * len(acc_ids))
        cursor.execute(f"SELECT alert_id, account_id, risk_score, severity, primary_reason FROM alerts WHERE account_id IN ({placeholders}) ORDER BY risk_score DESC;", acc_ids)
        for r in cursor.fetchall():
            alerts_found.append({
                "alert_id": r[0],
                "account_id": r[1],
                "risk_score": r[2],
                "severity": r[3],
                "primary_reason": r[4]
            })
    finally:
        conn.close()

    return {
        "status": "SUCCESS",
        "scenario_type": scenario_type,
        "seed": seed,
        "accounts_generated": [a["account_id"] for a in accounts],
        "transactions_count": len(transactions),
        "lineage_events_count": len(lineage_events),
        "alerts_triggered": alerts_found,
        "pipeline_evaluated": pipeline_res.get("accounts_evaluated", len(accounts)),
        "message": f"Generated {len(accounts)} accounts and {len(transactions)} transactions for archetype '{scenario_type}'. Pipeline executed: {len(alerts_found)} alerts triggered."
    }
