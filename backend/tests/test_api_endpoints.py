"""
Integration tests for FastAPI REST API endpoints across Observe, Trace, Detect, and Respond stages.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "MULE MATRIX"
    assert data["status"] == "ONLINE"

def test_system_health_endpoint(client):
    res = client.get("/api/v1/system/health")
    assert res.status_code == 200
    data = res.json()
    assert data["overall_status"] in ("HEALTHY", "DEGRADED")
    assert "database" in data["subsystems"]
    assert "graphsage" in data["subsystems"]

def test_observe_sentinel_summary(client):
    res = client.get("/api/v1/observe/sentinel-summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_e_inr_volume"] >= 0.0
    assert data["detection_integrity_status"] == "ACTIVE_MONITORING"
    assert data["lineage_integrity_status"] == "VERIFIED_TAMPER_FREE"

def test_observe_threat_stream(client):
    res = client.get("/api/v1/observe/threat-stream?limit=10")
    assert res.status_code == 200
    txs = res.json()
    assert isinstance(txs, list)
    assert len(txs) <= 10

def test_trace_graph(client):
    res = client.get("/api/v1/trace/graph?limit_nodes=50")
    assert res.status_code == 200
    graph = res.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) <= 50

def test_trace_bfs(client):
    payload = {
        "seed_account_id": "ACC_HERO_VICTIM_001",
        "max_hops": 3,
        "time_window_seconds": 3600,
        "direction": "forward"
    }
    res = client.post("/api/v1/trace/bfs", json=payload)
    assert res.status_code == 200
    bfs = res.json()
    assert bfs["seed_account_id"] == "ACC_HERO_VICTIM_001"
    assert "paths" in bfs

def test_trace_lineage_and_tamper(client):
    res = client.get("/api/v1/trace/lineage/TOKR_HERO_500K_GENESIS")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1

    # Verify
    v_res = client.post("/api/v1/trace/lineage/verify", json={"token_id": "TOKR_HERO_500K_GENESIS"})
    assert v_res.status_code == 200
    assert v_res.json()["valid"] is True

    # Tamper test
    t_res = client.post("/api/v1/trace/lineage/tamper-test", json={"token_id": "TOKR_HERO_500K_GENESIS", "target_event_index": 2})
    assert t_res.status_code == 200
    assert t_res.json()["detected"] is True

def test_detect_account_dossier(client):
    res = client.get("/api/v1/detect/account/ACC_HERO_MULE_L2_CONVERGE")
    assert res.status_code == 200
    dossier = res.json()
    assert dossier["account"]["account_id"] == "ACC_HERO_MULE_L2_CONVERGE"
    assert "sliding_window_analysis" in dossier
    assert "graph_features" in dossier
    assert "graphsage" in dossier
    assert 0.0 <= dossier["aggregate_risk_score"] <= 100.0

def test_detect_model_observatory(client):
    res = client.get("/api/v1/detect/models/observatory")
    assert res.status_code == 200
    bench = res.json()
    assert bench["benchmark_name"] == "SYNTHETIC BENCHMARK"
    assert "rules_only_baseline" in bench
    assert "combined_pipeline" in bench

def test_respond_cases_and_evidence(client):
    # Create case
    case_in = {
        "title": "Suspected Convergence Mule Ring",
        "severity": "CRITICAL",
        "suspect_account_id": "ACC_HERO_MULE_L2_CONVERGE",
        "initial_note": "Rapid convergence detected on Hero flow.",
        "alert_ids": []
    }
    create_res = client.post("/api/v1/respond/cases", json=case_in)
    assert create_res.status_code == 200
    case_data = create_res.json()
    assert case_data["title"] == case_in["title"]
    case_id = case_data["case_id"]

    # Read case detail
    detail_res = client.get(f"/api/v1/respond/cases/{case_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["case_id"] == case_id

    # Update case status (pre-conversion review simulation)
    patch_res = client.patch(
        f"/api/v1/respond/cases/{case_id}",
        json={"status": "UNDER_REVIEW", "new_note": "Pre-conversion review flag applied."}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "UNDER_REVIEW"

    # Export evidence package
    exp_res = client.get(f"/api/v1/respond/evidence-vault/export/{case_id}")
    assert exp_res.status_code == 200
    assert "integrity_seal_sha256" in exp_res.json()

    # Audit ledger
    audit_res = client.get("/api/v1/respond/audit-ledger?limit=10")
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1

def test_simulate_hero_replay(client):
    res = client.get("/api/v1/simulate/replay/hero")
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 9
    assert steps[0]["step_number"] == 1
    assert steps[-1]["step_number"] == 9

def test_observe_threat_stream_sorting(client):
    # Test sort by amount desc
    res = client.get("/api/v1/observe/threat-stream?limit=10&sort_by=amount_desc")
    assert res.status_code == 200
    txs = res.json()
    assert len(txs) > 1
    for i in range(len(txs) - 1):
        assert txs[i]["amount"] >= txs[i + 1]["amount"]

def test_evidence_vault_lineage_export(client):
    res = client.get("/api/v1/respond/evidence-vault/export-lineage/TOKR_HERO_500K_GENESIS")
    assert res.status_code == 200
    pkg = res.json()
    assert pkg["dossier_type"] == "MULE_MATRIX_TOKEN_PROVENANCE_PACKAGE"
    assert "integrity_seal_sha256" in pkg
    assert pkg["is_tamper_free"] is True
    assert pkg["total_hops"] >= 1

def test_scenario_simulator_generation(client):
    res = client.post("/api/v1/simulate/scenario", json={"scenario_type": "rapid_passthrough", "seed": 999})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["scenario_type"] == "rapid_passthrough"
    assert len(data["accounts_generated"]) >= 2
    assert data["transactions_count"] >= 2
    assert "alerts_triggered" in data
