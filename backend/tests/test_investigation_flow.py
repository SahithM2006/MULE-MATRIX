"""
End-to-End Investigation Flow & Edge Cases Test Suite.

Validates the full analyst journey from alert to audit trail:
1. Alert triage & observation
2. Threat stream transaction inspection
3. Attack graph topology & monotonic BFS traversal
4. Cryptographic SHA-256 token lineage verification
5. Multi-engine detection dossier evaluation
6. Case creation linked to suspect and alerts
7. Sealed evidence package export with SHA-256 digital seal
8. Chained audit ledger record verification

Also validates edge cases:
- Missing account dossier (HTTP 404)
- Empty/non-existent seed BFS traversal (0 paths, graceful handling)
- Tampered cryptographic lineage verification (hash mismatch detected)
- Missing case export (HTTP 404)
- GraphSAGE model fallback handling
"""
import pytest
import re
from datetime import datetime
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_full_investigation_journey_end_to_end(client):
    """
    Simulates the complete 6-stage investigation workflow on the Hero scenario:
    Observe -> Trace -> Verify -> Detect -> Respond -> Preserve Evidence
    """
    hero_hub = "ACC_HERO_MULE_L2_CONVERGE"
    hero_tx = "TX_HERO_005"
    hero_token = "TOKR_HERO_500K_GENESIS"

    # ==========================================================
    # STAGE 1: OBSERVE - Priority Alert & Transaction Stream
    # ==========================================================
    alerts_res = client.get(f"/api/v1/respond/alerts?account_id={hero_hub}")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0, "Expected priority alert for hero hub account"
    primary_alert = alerts[0]
    assert primary_alert["account_id"] == hero_hub
    assert primary_alert["risk_score"] >= 65.0
    assert primary_alert["severity"] in ("CRITICAL", "HIGH")
    alert_id = primary_alert["alert_id"]

    # Retrieve matching transaction in Threat Stream
    stream_res = client.get(f"/api/v1/observe/threat-stream?account_id={hero_hub}")
    assert stream_res.status_code == 200
    stream_txs = stream_res.json()
    assert len(stream_txs) > 0
    tx_ids = [t["transaction_id"] for t in stream_txs]
    assert hero_tx in tx_ids, f"Expected {hero_tx} in transactions for {hero_hub}"
    target_tx = next(t for t in stream_txs if t["transaction_id"] == hero_tx)
    assert target_tx["source_account_id"] == hero_hub or target_tx["destination_account_id"] == hero_hub
    assert target_tx["token_lineage_id"] == hero_token

    # ==========================================================
    # STAGE 2: TRACE - Attack Graph & Monotonic Temporal BFS
    # ==========================================================
    graph_res = client.get(f"/api/v1/trace/graph?focus_account_id={hero_hub}&depth=2&limit_nodes=60")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    node_ids = [n["id"] for n in graph_data["nodes"]]
    assert hero_hub in node_ids
    assert len(graph_data["edges"]) > 0

    # Execute monotonic BFS forward from hero mule hub
    bfs_res = client.post("/api/v1/trace/bfs", json={
        "seed_account_id": hero_hub,
        "max_hops": 4,
        "time_window_seconds": 86400,
        "direction": "forward"
    })
    assert bfs_res.status_code == 200
    bfs_data = bfs_res.json()
    assert bfs_data["total_paths"] > 0, "Expected at least one forward dispersal path from hero hub"
    assert len(bfs_data["paths"]) > 0

    # Verify chronological monotonicity and valid hops
    for path in bfs_data["paths"]:
        assert len(path["hops"]) > 0
        assert path["accounts_in_path"][0] == hero_hub
        # Verify timestamps increase monotonically
        hop_times = [datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00")) for h in path["hops"]]
        for i in range(len(hop_times) - 1):
            assert hop_times[i] <= hop_times[i + 1], "BFS hops must strictly respect temporal monotonicity"

    # ==========================================================
    # STAGE 3: VERIFY - Cryptographic SHA-256 Token Lineage
    # ==========================================================
    lineage_events_res = client.get(f"/api/v1/trace/lineage/{hero_token}")
    assert lineage_events_res.status_code == 200
    events = lineage_events_res.json()
    assert len(events) >= 3, "Expected multi-hop parent-child split events"

    # Verify cryptographic integrity
    verify_res = client.post("/api/v1/trace/lineage/verify", json={"token_id": hero_token})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True, "Seeded token lineage must pass SHA-256 cryptographic check"
    assert verify_data["first_broken_event_id"] is None
    assert verify_data["total_events"] == len(events)

    # ==========================================================
    # STAGE 4: DETECT - Multi-Engine Detection Dossier
    # ==========================================================
    dossier_res = client.get(f"/api/v1/detect/account/{hero_hub}")
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()
    assert dossier["account"]["account_id"] == hero_hub
    assert dossier["aggregate_risk_score"] >= 65.0
    assert dossier["severity"] in ("CRITICAL", "HIGH")
    assert len(dossier["signals"]) > 0
    assert dossier["graph_features"] is not None
    assert dossier["graph_features"]["in_degree"] >= 1
    assert dossier["graph_features"]["out_degree"] >= 1

    # ==========================================================
    # STAGE 5: RESPOND - Incident Case Creation & Simulated Review
    # ==========================================================
    case_payload = {
        "title": f"Mule Investigation - {hero_hub} (E2E Test Case)",
        "severity": dossier["severity"],
        "suspect_account_id": hero_hub,
        "initial_note": "Automated E2E test verifying end-to-end investigation case lifecycle.",
        "alert_ids": [alert_id]
    }
    create_case_res = client.post("/api/v1/respond/cases", json=case_payload)
    assert create_case_res.status_code == 200
    created_case = create_case_res.json()
    case_id = created_case["case_id"]
    assert case_id.startswith("CS_")
    assert created_case["suspect_account_id"] == hero_hub
    assert created_case["status"] == "NEW"
    assert alert_id in created_case["linked_alert_ids"]

    # Perform simulated pre-conversion review triage update
    update_res = client.patch(f"/api/v1/respond/cases/{case_id}", json={
        "status": "UNDER_REVIEW",
        "new_note": "[SIMULATED PRE-CONVERSION REVIEW] Flagged transfer flow for simulated pre-conversion review.",
        "author": "Analyst E2E"
    })
    assert update_res.status_code == 200
    updated_case = update_res.json()
    assert updated_case["status"] == "UNDER_REVIEW"

    # ==========================================================
    # STAGE 6: PRESERVE EVIDENCE - Sealed Export & Chained Audit
    # ==========================================================
    export_res = client.get(f"/api/v1/respond/evidence-vault/export/{case_id}")
    assert export_res.status_code == 200
    package = export_res.json()
    assert package["dossier_type"] == "MULE_MATRIX_CASE_EVIDENCE_PACKAGE"
    assert "integrity_seal_sha256" in package
    seal_hash = package["integrity_seal_sha256"]
    assert bool(re.match(r"^[0-9a-f]{64}$", seal_hash)), "Export package must contain a 64-char SHA-256 seal"
    assert package["case_record"]["case_id"] == case_id
    assert package["suspect_account"]["account_id"] == hero_hub

    # Confirm corresponding audit events exist in Audit Ledger
    audit_res = client.get("/api/v1/respond/audit-ledger?limit=25")
    assert audit_res.status_code == 200
    audit_events = audit_res.json()
    assert len(audit_events) > 0

    # Verify both CREATE_CASE and EXPORT_EVIDENCE_DOSSIER actions are recorded
    create_audit = next((ev for ev in audit_events if ev["action"] == "CREATE_CASE" and ev["target_entity_id"] == case_id), None)
    assert create_audit is not None, f"Audit ledger must contain CREATE_CASE event for {case_id}"
    assert create_audit["outcome"] == "SUCCESS"
    assert bool(re.match(r"^[0-9a-f]{64}$", create_audit["integrity_hash"]))

    export_audit = next((ev for ev in audit_events if ev["action"] == "EXPORT_EVIDENCE_DOSSIER" and ev["target_entity_id"] == case_id), None)
    assert export_audit is not None, f"Audit ledger must contain EXPORT_EVIDENCE_DOSSIER event for {case_id}"
    assert export_audit["outcome"] == "SUCCESS"
    assert bool(re.match(r"^[0-9a-f]{64}$", export_audit["integrity_hash"]))

def test_edge_case_missing_account_dossier(client):
    """Verifies that requesting a dossier for a non-existent account returns 404 cleanly."""
    res = client.get("/api/v1/detect/account/ACC_DOES_NOT_EXIST_XYZ_999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_edge_case_empty_bfs_results(client):
    """Verifies that running BFS on an isolated or non-existent seed account returns empty paths cleanly without crashing."""
    res = client.post("/api/v1/trace/bfs", json={
        "seed_account_id": "ACC_ISOLATED_GHOST_ACCOUNT",
        "max_hops": 4,
        "time_window_seconds": 3600,
        "direction": "forward"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["total_paths"] == 0
    assert data["paths"] == []
    assert data["seed_account_id"] == "ACC_ISOLATED_GHOST_ACCOUNT"

def test_edge_case_tampered_lineage_verification(client):
    """Verifies that cryptographic verification reliably catches hash-chain tampering."""
    res = client.post("/api/v1/trace/lineage/tamper-test", json={
        "token_id": "TOKR_HERO_500K_GENESIS",
        "target_event_index": 2
    })
    assert res.status_code == 200
    data = res.json()
    assert data["detected"] is True
    assert data["tampered_event_id"] is not None
    assert data["broken_link_reported"] is not None
    assert data["tampered_amount"] != data["original_amount"]

def test_edge_case_missing_case_export(client):
    """Verifies that exporting an invalid or non-existent case returns 404 cleanly."""
    res = client.get("/api/v1/respond/evidence-vault/export/CS_NON_EXISTENT_CASE_99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_edge_case_graphsage_fallback_safety(client):
    """Verifies that account dossier computes cleanly even if GraphSAGE model is not trained or evaluating an unseen node."""
    res = client.get("/api/v1/detect/account/ACC_HERO_VICTIM_001")
    assert res.status_code == 200
    dossier = res.json()
    assert "aggregate_risk_score" in dossier
    assert "graphsage" in dossier
    assert dossier["graphsage"]["status"] in ("READY", "NOT_TRAINED")
