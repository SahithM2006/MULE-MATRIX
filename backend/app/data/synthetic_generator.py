"""
Reproducible synthetic data generator for MULE MATRIX.
Generates realistic financial transaction graphs, simulated e-rupee token lineage,
and explicit ground-truth labels for fraud vs. legitimate lookalike scenarios.
"""
import random
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Tuple, Any, Optional
from backend.app.core.logging import logger
from backend.app.data.hero_scenario import generate_hero_data, canonical_serialize, compute_sha256

def generate_synthetic_dataset(
    target_accounts: int = 2000,
    target_transactions: int = 30000,
    random_seed: int = 42,
    base_time_iso: str = "2026-10-20T00:00:00Z"
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates a full synthetic dataset with controlled scenarios:
    - Deterministic hero scenario (victim -> mules -> cashout)
    - Normal retail peer-to-peer (label 0)
    - Payroll fan-out lookalike (label 0)
    - Merchant fan-in lookalike (label 0)
    - Smurfing rings (label 1)
    - Rapid pass-through chains (label 1)
    - Multi-hop layering networks (label 1)
    - Connected money-mule rings (label 1)
    """
    random.seed(random_seed)
    base_time = datetime.fromisoformat(base_time_iso.replace("Z", "+00:00"))
    
    accounts: List[Dict[str, Any]] = []
    transactions: List[Dict[str, Any]] = []
    lineage_events: List[Dict[str, Any]] = []
    
    # Track assigned accounts to prevent ID collision
    existing_acc_ids = set()

    # 1. HERO SCENARIO (Always included first and deterministic)
    hero_accs, hero_txs, hero_events = generate_hero_data(base_time_iso="2026-10-27T08:00:00Z")
    for a in hero_accs:
        accounts.append(a)
        existing_acc_ids.add(a["account_id"])
    transactions.extend(hero_txs)
    lineage_events.extend(hero_events)
    logger.info(f"Generated {len(hero_accs)} hero accounts and {len(hero_txs)} hero transactions.")

    # Calculate scale factor relative to 2,000 accounts
    scale = max(0.1, target_accounts / 2000.0)

    # 2. CORPORATE PAYROLL (Legitimate High Fan-Out Lookalike - Label 0)
    num_payroll_employers = max(1, int(3 * scale))
    payroll_employees_per_employer = max(20, int(60 * scale))
    for ep_idx in range(num_payroll_employers):
        employer_id = f"ACC_CORP_PAYROLL_{ep_idx+1:03d}"
        accounts.append({
            "account_id": employer_id,
            "account_number": f"IN92000000{ep_idx+1:04d}",
            "account_type": "merchant",
            "kyc_risk_score": 0.08,
            "scenario_tag": "payroll_employer",
            "ground_truth_label": 0,
            "created_at": "2025-01-01T00:00:00Z"
        })
        existing_acc_ids.add(employer_id)

        # Generate employees
        for emp_idx in range(payroll_employees_per_employer):
            emp_id = f"ACC_EMP_{ep_idx+1:02d}_{emp_idx+1:04d}"
            accounts.append({
                "account_id": emp_id,
                "account_number": f"IN9201{ep_idx+1:02d}{emp_idx+1:04d}",
                "account_type": "retail",
                "kyc_risk_score": 0.05,
                "scenario_tag": "payroll_employee",
                "ground_truth_label": 0,
                "created_at": "2025-03-01T00:00:00Z"
            })
            existing_acc_ids.add(emp_id)

            # Monthly salary payout transactions
            for payout_day in [1, 5]:
                tx_time = base_time + timedelta(days=payout_day, hours=9, minutes=random.randint(0, 59))
                transactions.append({
                    "transaction_id": f"TX_PAY_{employer_id}_{emp_id}_{payout_day}",
                    "source_account_id": employer_id,
                    "destination_account_id": emp_id,
                    "amount": round(random.uniform(45000.0, 125000.0), 2),
                    "currency": "e-INR",
                    "timestamp": tx_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "tx_type": "payroll",
                    "token_lineage_id": None,
                    "scenario_id": "payroll_fanout"
                })

    # 3. MERCHANT FAN-IN (Legitimate High Fan-In Lookalike - Label 0)
    num_merchants = max(2, int(15 * scale))
    merchant_ids = []
    for m_idx in range(num_merchants):
        m_id = f"ACC_MERCHANT_{m_idx+1:03d}"
        merchant_ids.append(m_id)
        accounts.append({
            "account_id": m_id,
            "account_number": f"IN93000000{m_idx+1:04d}",
            "account_type": "merchant",
            "kyc_risk_score": 0.12,
            "scenario_tag": "merchant_fanin",
            "ground_truth_label": 0,
            "created_at": "2025-02-15T00:00:00Z"
        })
        existing_acc_ids.add(m_id)

    # 4. NORMAL RETAIL P2P (Label 0)
    num_retail = max(100, int(1200 * scale))
    retail_ids = []
    for r_idx in range(num_retail):
        r_id = f"ACC_RETAIL_{r_idx+1:05d}"
        retail_ids.append(r_id)
        accounts.append({
            "account_id": r_id,
            "account_number": f"IN94{r_idx+1:010d}",
            "account_type": "retail",
            "kyc_risk_score": round(random.uniform(0.01, 0.25), 3),
            "scenario_tag": "normal_p2p",
            "ground_truth_label": 0,
            "created_at": "2025-06-01T00:00:00Z"
        })
        existing_acc_ids.add(r_id)

    # Retail transactions: to merchants and to other retail
    for r_id in retail_ids:
        # Spend at merchants
        num_spends = random.randint(3, 10)
        for _ in range(num_spends):
            m_target = random.choice(merchant_ids)
            day_offset = random.randint(0, 6)
            hour_offset = random.randint(8, 22)
            minute_offset = random.randint(0, 59)
            tx_time = base_time + timedelta(days=day_offset, hours=hour_offset, minutes=minute_offset)
            transactions.append({
                "transaction_id": f"TX_RET_M_{len(transactions)+1:07d}",
                "source_account_id": r_id,
                "destination_account_id": m_target,
                "amount": round(random.uniform(150.0, 4800.0), 2),
                "currency": "e-INR",
                "timestamp": tx_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "tx_type": "merchant_pay",
                "token_lineage_id": None,
                "scenario_id": "normal_merchant_spend"
            })

        # Occasional P2P transfers between retail
        if random.random() < 0.6:
            r_target = random.choice(retail_ids)
            if r_target != r_id:
                day_offset = random.randint(0, 6)
                tx_time = base_time + timedelta(days=day_offset, hours=random.randint(9, 21), minutes=random.randint(0, 59))
                transactions.append({
                    "transaction_id": f"TX_RET_P2P_{len(transactions)+1:07d}",
                    "source_account_id": r_id,
                    "destination_account_id": r_target,
                    "amount": round(random.uniform(500.0, 15000.0), 2),
                    "currency": "e-INR",
                    "timestamp": tx_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "tx_type": "transfer",
                    "token_lineage_id": None,
                    "scenario_id": "normal_p2p"
                })

    # 5. SMURFING RINGS (Fraud - Label 1)
    num_smurf_rings = max(1, int(6 * scale))
    for ring_idx in range(num_smurf_rings):
        collector_id = f"ACC_SMURF_COLL_{ring_idx+1:03d}"
        accounts.append({
            "account_id": collector_id,
            "account_number": f"IN95000000{ring_idx+1:04d}",
            "account_type": "mule_suspect",
            "kyc_risk_score": 0.78,
            "scenario_tag": "smurfing_collector",
            "ground_truth_label": 1,
            "created_at": "2026-07-01T00:00:00Z"
        })
        existing_acc_ids.add(collector_id)

        # Upstream cash-out or higher mule
        exit_acc_id = f"ACC_SMURF_EXIT_{ring_idx+1:03d}"
        accounts.append({
            "account_id": exit_acc_id,
            "account_number": f"IN95009999{ring_idx+1:04d}",
            "account_type": "cashout",
            "kyc_risk_score": 0.88,
            "scenario_tag": "smurfing_exit",
            "ground_truth_label": 1,
            "created_at": "2026-08-01T00:00:00Z"
        })
        existing_acc_ids.add(exit_acc_id)

        # 8-12 smurf senders
        ring_base_time = base_time + timedelta(days=random.randint(1, 5), hours=random.randint(10, 16))
        total_collected = 0.0
        smurf_count = random.randint(8, 12)
        
        for s_idx in range(smurf_count):
            smurf_id = f"ACC_SMURF_SRC_{ring_idx+1:02d}_{s_idx+1:03d}"
            accounts.append({
                "account_id": smurf_id,
                "account_number": f"IN9501{ring_idx+1:02d}{s_idx+1:04d}",
                "account_type": "mule_suspect",
                "kyc_risk_score": 0.65,
                "scenario_tag": "smurfing_source",
                "ground_truth_label": 1,
                "created_at": "2026-08-10T00:00:00Z"
            })
            existing_acc_ids.add(smurf_id)

            # Amount just below KYC threshold (₹50,000)
            smurf_amt = round(random.uniform(42000.0, 48500.0), 2)
            total_collected += smurf_amt
            tx_time = ring_base_time + timedelta(minutes=random.randint(1, 40))
            
            transactions.append({
                "transaction_id": f"TX_SMURF_IN_{ring_idx+1:02d}_{s_idx+1:03d}",
                "source_account_id": smurf_id,
                "destination_account_id": collector_id,
                "amount": smurf_amt,
                "currency": "e-INR",
                "timestamp": tx_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "tx_type": "transfer",
                "token_lineage_id": None,
                "scenario_id": f"smurfing_ring_{ring_idx+1}"
            })

        # Collector funnels collected sum to exit account within 15 minutes of completion
        exit_time = ring_base_time + timedelta(minutes=55)
        transactions.append({
            "transaction_id": f"TX_SMURF_OUT_{ring_idx+1:03d}",
            "source_account_id": collector_id,
            "destination_account_id": exit_acc_id,
            "amount": round(total_collected * 0.98, 2),  # 2% fee deducted
            "currency": "e-INR",
            "timestamp": exit_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tx_type": "cashout",
            "token_lineage_id": None,
            "scenario_id": f"smurfing_ring_{ring_idx+1}"
        })

    # 6. RAPID PASS-THROUGH CHAINS (Fraud - Label 1)
    num_passthrough_chains = max(2, int(15 * scale))
    for pt_idx in range(num_passthrough_chains):
        pt_acc_id = f"ACC_PASSTHROUGH_{pt_idx+1:03d}"
        accounts.append({
            "account_id": pt_acc_id,
            "account_number": f"IN96000000{pt_idx+1:04d}",
            "account_type": "mule_suspect",
            "kyc_risk_score": 0.75,
            "scenario_tag": "rapid_passthrough",
            "ground_truth_label": 1,
            "created_at": "2026-08-20T00:00:00Z"
        })
        existing_acc_ids.add(pt_acc_id)

        # Inflow from retail/victim, outflow to next mule/cashout
        inflow_src = random.choice(retail_ids)
        outflow_dst = f"ACC_PT_DEST_{pt_idx+1:03d}"
        accounts.append({
            "account_id": outflow_dst,
            "account_number": f"IN96009999{pt_idx+1:04d}",
            "account_type": "cashout",
            "kyc_risk_score": 0.82,
            "scenario_tag": "passthrough_destination",
            "ground_truth_label": 1,
            "created_at": "2026-09-01T00:00:00Z"
        })
        existing_acc_ids.add(outflow_dst)

        pt_time_base = base_time + timedelta(days=random.randint(1, 6), hours=random.randint(9, 20))
        pt_amount = round(random.uniform(90000.0, 320000.0), 2)
        
        # Inflow
        inflow_time = pt_time_base
        transactions.append({
            "transaction_id": f"TX_PT_IN_{pt_idx+1:03d}",
            "source_account_id": inflow_src,
            "destination_account_id": pt_acc_id,
            "amount": pt_amount,
            "currency": "e-INR",
            "timestamp": inflow_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tx_type": "transfer",
            "token_lineage_id": f"TOKR_PT_{pt_idx+1:03d}",
            "scenario_id": f"rapid_passthrough_{pt_idx+1}"
        })

        # Outflow occurs 2 - 6 minutes later with 96% - 99% of funds
        delay_sec = random.randint(120, 360)
        outflow_time = inflow_time + timedelta(seconds=delay_sec)
        outflow_amount = round(pt_amount * random.uniform(0.96, 0.99), 2)
        transactions.append({
            "transaction_id": f"TX_PT_OUT_{pt_idx+1:03d}",
            "source_account_id": pt_acc_id,
            "destination_account_id": outflow_dst,
            "amount": outflow_amount,
            "currency": "e-INR",
            "timestamp": outflow_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tx_type": "transfer",
            "token_lineage_id": f"TOKR_PT_{pt_idx+1:03d}",
            "scenario_id": f"rapid_passthrough_{pt_idx+1}"
        })

        # Add 2-event lineage chain for rapid passthrough
        tok_id = f"TOKR_PT_{pt_idx+1:03d}"
        gen_hash = hashlib.sha256(f"GENESIS:{tok_id}".encode("utf-8")).hexdigest()
        evt1_payload = canonical_serialize({
            "amount": pt_amount,
            "destination": pt_acc_id,
            "event_id": f"EVT_PT_{pt_idx+1:03d}_1",
            "parent_id": "GENESIS",
            "sequence": 1,
            "source": inflow_src,
            "timestamp": inflow_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "token_id": tok_id
        })
        evt1_hash = compute_sha256(evt1_payload, gen_hash)
        lineage_events.append({
            "event_id": f"EVT_PT_{pt_idx+1:03d}_1",
            "token_id": tok_id,
            "transaction_id": f"TX_PT_IN_{pt_idx+1:03d}",
            "parent_event_id": None,
            "source_account_id": inflow_src,
            "destination_account_id": pt_acc_id,
            "amount": pt_amount,
            "timestamp": inflow_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sequence_index": 1,
            "canonical_payload": evt1_payload,
            "prev_hash": gen_hash,
            "current_hash": evt1_hash,
            "is_verified": 1
        })

        evt2_payload = canonical_serialize({
            "amount": outflow_amount,
            "destination": outflow_dst,
            "event_id": f"EVT_PT_{pt_idx+1:03d}_2",
            "parent_id": f"EVT_PT_{pt_idx+1:03d}_1",
            "sequence": 2,
            "source": pt_acc_id,
            "timestamp": outflow_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "token_id": tok_id
        })
        evt2_hash = compute_sha256(evt2_payload, evt1_hash)
        lineage_events.append({
            "event_id": f"EVT_PT_{pt_idx+1:03d}_2",
            "token_id": tok_id,
            "transaction_id": f"TX_PT_OUT_{pt_idx+1:03d}",
            "parent_event_id": f"EVT_PT_{pt_idx+1:03d}_1",
            "source_account_id": pt_acc_id,
            "destination_account_id": outflow_dst,
            "amount": outflow_amount,
            "timestamp": outflow_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "sequence_index": 2,
            "canonical_payload": evt2_payload,
            "prev_hash": evt1_hash,
            "current_hash": evt2_hash,
            "is_verified": 1
        })

    # 7. CONNECTED MULE NETWORKS (Complex Layering Rings - Label 1)
    num_rings = max(1, int(3 * scale))
    for ring_i in range(num_rings):
        ring_nodes = []
        for n_i in range(12):
            node_id = f"ACC_RING_{ring_i+1:02d}_{n_i+1:02d}"
            ring_nodes.append(node_id)
            accounts.append({
                "account_id": node_id,
                "account_number": f"IN970{ring_i+1:02d}{n_i+1:04d}",
                "account_type": "mule_suspect" if n_i < 10 else "cashout",
                "kyc_risk_score": 0.84,
                "scenario_tag": "connected_mule_ring",
                "ground_truth_label": 1,
                "created_at": "2026-07-15T00:00:00Z"
            })
            existing_acc_ids.add(node_id)

        # Cross-layer transactions within the ring
        ring_time = base_time + timedelta(days=random.randint(2, 5), hours=random.randint(11, 18))
        for u_idx in range(len(ring_nodes) - 2):
            u = ring_nodes[u_idx]
            # Send to next 2 nodes
            for v_offset in [1, 2]:
                v = ring_nodes[u_idx + v_offset]
                tx_offset = timedelta(minutes=u_idx * 15 + v_offset * 5)
                transactions.append({
                    "transaction_id": f"TX_RING_{ring_i+1:02d}_{u_idx}_{v_offset}",
                    "source_account_id": u,
                    "destination_account_id": v,
                    "amount": round(random.uniform(35000.0, 95000.0), 2),
                    "currency": "e-INR",
                    "timestamp": (ring_time + tx_offset).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "tx_type": "transfer",
                    "token_lineage_id": None,
                    "scenario_id": f"connected_mule_ring_{ring_i+1}"
                })

        # Exit node cashouts
        exit_cashout = ring_nodes[-1]
        pre_exit = ring_nodes[-3]
        transactions.append({
            "transaction_id": f"TX_RING_EXIT_{ring_i+1:02d}",
            "source_account_id": pre_exit,
            "destination_account_id": exit_cashout,
            "amount": 185000.0,
            "currency": "e-INR",
            "timestamp": (ring_time + timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tx_type": "cashout",
            "token_lineage_id": None,
            "scenario_id": f"connected_mule_ring_{ring_i+1}"
        })

    # Fill remaining normal transactions to meet target count
    needed_tx = max(0, target_transactions - len(transactions))
    if needed_tx > 0 and len(retail_ids) > 1:
        logger.info(f"Adding {needed_tx} background P2P transactions to reach target volume...")
        for b_idx in range(needed_tx):
            u = random.choice(retail_ids)
            v = random.choice(retail_ids)
            if u == v:
                continue
            day_offset = random.randint(0, 6)
            hour_offset = random.randint(7, 23)
            min_offset = random.randint(0, 59)
            t = base_time + timedelta(days=day_offset, hours=hour_offset, minutes=min_offset)
            transactions.append({
                "transaction_id": f"TX_BG_{b_idx+1:06d}",
                "source_account_id": u,
                "destination_account_id": v,
                "amount": round(random.uniform(100.0, 12000.0), 2),
                "currency": "e-INR",
                "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "tx_type": "transfer",
                "token_lineage_id": None,
                "scenario_id": "background_retail"
            })

    # Sort transactions strictly by timestamp
    transactions.sort(key=lambda x: x["timestamp"])

    logger.info(
        f"Synthetic dataset complete: {len(accounts)} accounts, "
        f"{len(transactions)} transactions, {len(lineage_events)} lineage records."
    )
    return accounts, transactions, lineage_events

def populate_database(
    db_path: str = None,
    num_accounts: int = 2000,
    num_transactions: int = 30000,
    seed: int = 42
) -> Tuple[int, int, int]:
    """Populates the SQLite database with the synthetic dataset in a single transaction."""
    from backend.app.db.database import get_connection, init_db

    init_db(db_path)
    accounts, transactions, lineage_events = generate_synthetic_dataset(
        target_accounts=num_accounts,
        target_transactions=num_transactions,
        random_seed=seed
    )

    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        # Clear existing data for deterministic re-seeding
        cursor.execute("DELETE FROM case_alerts;")
        cursor.execute("DELETE FROM cases;")
        cursor.execute("DELETE FROM alerts;")
        cursor.execute("DELETE FROM detection_results;")
        cursor.execute("DELETE FROM lineage_events;")
        cursor.execute("DELETE FROM transactions;")
        cursor.execute("DELETE FROM accounts;")
        cursor.execute("DELETE FROM audit_events;")

        # Insert Accounts
        cursor.executemany(
            """
            INSERT INTO accounts (account_id, account_number, account_type, kyc_risk_score, scenario_tag, ground_truth_label, created_at)
            VALUES (:account_id, :account_number, :account_type, :kyc_risk_score, :scenario_tag, :ground_truth_label, :created_at)
            """,
            accounts
        )

        # Insert Transactions
        cursor.executemany(
            """
            INSERT INTO transactions (transaction_id, source_account_id, destination_account_id, amount, currency, timestamp, tx_type, token_lineage_id, scenario_id)
            VALUES (:transaction_id, :source_account_id, :destination_account_id, :amount, :currency, :timestamp, :tx_type, :token_lineage_id, :scenario_id)
            """,
            transactions
        )

        # Insert Lineage Events
        cursor.executemany(
            """
            INSERT INTO lineage_events (event_id, token_id, transaction_id, parent_event_id, source_account_id, destination_account_id, amount, timestamp, sequence_index, canonical_payload, prev_hash, current_hash, is_verified)
            VALUES (:event_id, :token_id, :transaction_id, :parent_event_id, :source_account_id, :destination_account_id, :amount, :timestamp, :sequence_index, :canonical_payload, :prev_hash, :current_hash, :is_verified)
            """,
            lineage_events
        )

        # Log genesis audit event
        genesis_audit_hash = hashlib.sha256(b"AUDIT_GENESIS_SEED").hexdigest()
        cursor.execute(
            """
            INSERT INTO audit_events (event_id, timestamp, actor, action, target_entity_type, target_entity_id, outcome, integrity_hash, prev_audit_hash, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "AUD_SEED_001",
                datetime.now(timezone.utc).isoformat(),
                "SYSTEM",
                "SEED_DATABASE",
                "DATABASE",
                "ALL",
                "SUCCESS",
                genesis_audit_hash,
                "0000000000000000000000000000000000000000000000000000000000000000",
                json.dumps({"accounts": len(accounts), "transactions": len(transactions), "lineage_events": len(lineage_events)})
            )
        )
        conn.commit()
    finally:
        conn.close()

    logger.info("Database population committed successfully.")
    return len(accounts), len(transactions), len(lineage_events)
