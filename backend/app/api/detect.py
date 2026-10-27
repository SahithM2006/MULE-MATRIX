"""
Detect Stage API Endpoints: Detection Lab & Model Observatory.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import json
from pathlib import Path
from backend.app.models.schemas import (
    AccountDossier, AccountBase, TransactionBase, Alert,
    BenchmarkComparison
)
from backend.app.db.database import get_connection
from backend.app.engines.sliding_window import analyze_account_windows
from backend.app.engines.feature_extractor import extract_graph_features
from backend.app.engines.rule_engine import evaluate_account_rules
from backend.app.engines.isolation_forest_engine import iforest_engine
from backend.app.engines.graphsage_engine import graphsage_engine
from backend.app.engines.louvain_engine import detect_louvain_communities, get_account_community_output
from backend.app.engines.risk_engine import aggregate_account_risk
from backend.app.evaluation.benchmark import run_benchmark_evaluation, BENCHMARK_FILE

router = APIRouter(prefix="/detect", tags=["Detect"])

@router.get("/account/{account_id}", response_model=AccountDossier)
def get_account_detection_dossier(account_id: str):
    """
    Returns unified multi-algorithm diagnostic dossier for an account.
    Combines sliding-window metrics, graph features, Isolation Forest,
    Louvain community, GraphSAGE prediction, and aggregate risk score.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Load account
        cursor.execute("SELECT * FROM accounts WHERE account_id = ?;", (account_id,))
        acc_row = cursor.fetchone()
        if not acc_row:
            raise HTTPException(status_code=404, detail=f"Account {account_id} not found.")
        acc = dict(acc_row)

        # Load account transactions
        cursor.execute(
            """
            SELECT * FROM transactions 
            WHERE source_account_id = ? OR destination_account_id = ?
            ORDER BY timestamp DESC;
            """,
            (account_id, account_id)
        )
        tx_rows = [dict(r) for r in cursor.fetchall()]

        # Load all accounts and transactions for graph features and Louvain
        cursor.execute("SELECT * FROM accounts;")
        all_accounts = [dict(r) for r in cursor.fetchall()]
        cursor.execute("SELECT * FROM transactions;")
        all_transactions = [dict(r) for r in cursor.fetchall()]

        # 1. Sliding Window Analysis
        windows = analyze_account_windows(account_id, tx_rows)

        # 2. Graph Features
        feature_df, metrics_map = extract_graph_features(all_accounts, all_transactions)
        gf = metrics_map.get(account_id)
        feat_vec = feature_df.loc[account_id].values if account_id in feature_df.index else None

        # 3. Rule Evaluation
        rule_signals = evaluate_account_rules(acc, windows, gf)

        # 4. Isolation Forest
        iforest_engine.fit(feature_df)
        if_out = iforest_engine.score_account(account_id, feat_vec)

        # 5. Louvain Community
        _, undirected_g = extract_graph_features.__globals__["build_networkx_graph"](all_transactions, all_accounts)
        flagged_nodes = {a["account_id"] for a in all_accounts if a.get("kyc_risk_score", 0.0) >= 0.70}
        acc_to_comm, summaries = detect_louvain_communities(undirected_g, flagged_nodes)
        louvain_out = get_account_community_output(account_id, acc_to_comm, summaries)

        # 6. GraphSAGE Inductive Classifier
        gs_out = graphsage_engine.predict_account(account_id)

        # 7. Risk Aggregation
        final_score, severity, primary_reason, all_signals, _ = aggregate_account_risk(
            rule_signals, if_out, gs_out
        )

        # Active Alerts for this account
        cursor.execute("SELECT * FROM alerts WHERE account_id = ? ORDER BY risk_score DESC;", (account_id,))
        alert_rows = cursor.fetchall()
        active_alerts = []
        for r in alert_rows:
            signals = []
            try:
                signals = json.loads(r["contributing_signals_json"])
            except Exception:
                pass
            active_alerts.append(Alert(
                alert_id=r["alert_id"],
                account_id=r["account_id"],
                transaction_id=r["transaction_id"],
                risk_score=r["risk_score"],
                severity=r["severity"],
                primary_reason=r["primary_reason"],
                contributing_signals=signals,
                status=r["status"],
                created_at=r["created_at"]
            ))

        recent_txs = [
            TransactionBase(
                transaction_id=t["transaction_id"],
                source_account_id=t["source_account_id"],
                destination_account_id=t["destination_account_id"],
                amount=float(t["amount"]),
                currency=t["currency"],
                timestamp=t["timestamp"],
                tx_type=t["tx_type"],
                token_lineage_id=t["token_lineage_id"],
                scenario_id=t["scenario_id"]
            )
            for t in tx_rows[:15]
        ]

        return AccountDossier(
            account=AccountBase(
                account_id=acc["account_id"],
                account_number=acc["account_number"],
                account_type=acc["account_type"],
                kyc_risk_score=float(acc["kyc_risk_score"]),
                scenario_tag=acc["scenario_tag"],
                created_at=acc["created_at"]
            ),
            aggregate_risk_score=final_score,
            severity=severity,
            primary_reason=primary_reason,
            signals=all_signals,
            sliding_window_analysis=windows,
            graph_features=gf,
            isolation_forest=if_out,
            louvain_community=louvain_out,
            graphsage=gs_out,
            active_alerts=active_alerts,
            recent_transactions=recent_txs
        )
    finally:
        conn.close()

@router.get("/models/observatory", response_model=BenchmarkComparison)
def get_model_observatory_benchmark():
    """Reads and returns the evaluated benchmark results file for the Model Observatory."""
    if not BENCHMARK_FILE.exists():
        # Run benchmark evaluation if not yet present
        run_benchmark_evaluation()

    try:
        with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return BenchmarkComparison(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read benchmark results: {e}")

@router.post("/graphsage/train")
def train_graphsage_endpoint():
    """Triggers GraphSAGE model training on current database dataset."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM accounts;")
        accounts = [dict(r) for r in cursor.fetchall()]
        cursor.execute("SELECT * FROM transactions;")
        transactions = [dict(r) for r in cursor.fetchall()]

        feature_df, _ = extract_graph_features(accounts, transactions)
        train_res = graphsage_engine.train_pipeline(accounts, transactions, feature_df)
        return train_res
    finally:
        conn.close()

@router.post("/evaluate")
def trigger_benchmark_evaluation():
    """Executes benchmark evaluation on held-out scenarios and updates benchmark_results.json."""
    return run_benchmark_evaluation()
