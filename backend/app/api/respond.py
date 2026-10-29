"""
Respond Stage API Endpoints: Incident Response, Evidence Vault, and Audit Ledger.
"""
import json
import hashlib
from fastapi import APIRouter, HTTPException, Query, Body
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from backend.app.core.config import config
from backend.app.models.schemas import (
    Alert, Case, CaseCreate, CaseUpdate, CaseNote, CaseTimelineEvent, AuditEvent
)
from backend.app.db.database import get_connection

router = APIRouter(prefix="/respond", tags=["Respond"])

def append_audit_event(
    conn, actor: str, action: str, entity_type: str, entity_id: str, outcome: str, details: Dict[str, Any]
):
    """Appends an event to the audit ledger with SHA-256 hash chaining."""
    cursor = conn.cursor()
    cursor.execute("SELECT integrity_hash FROM audit_events ORDER BY rowid DESC LIMIT 1;")
    last_row = cursor.fetchone()
    prev_hash = last_row[0] if last_row else "0000000000000000000000000000000000000000000000000000000000000000"

    now_iso = datetime.now(timezone.utc).isoformat()
    evt_id = f"AUD_{int(datetime.now().timestamp()*1000)}"
    details_str = json.dumps(details, sort_keys=True)
    
    canonical_str = f"{evt_id}:{now_iso}:{actor}:{action}:{entity_type}:{entity_id}:{outcome}:{details_str}:{prev_hash}"
    curr_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    cursor.execute(
        """
        INSERT INTO audit_events (event_id, timestamp, actor, action, target_entity_type, target_entity_id, outcome, integrity_hash, prev_audit_hash, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (evt_id, now_iso, actor, action, entity_type, entity_id, outcome, curr_hash, prev_hash, details_str)
    )

@router.get("/alerts", response_model=List[Alert])
def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    account_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200)
):
    """Filterable alert queue for incident response triage."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []

        if severity:
            query += " AND severity = ?"
            params.append(severity.upper())
        if status:
            query += " AND status = ?"
            params.append(status.upper())
        if account_id:
            query += " AND account_id LIKE ?"
            params.append(f"%{account_id}%")

        query += " ORDER BY risk_score DESC, created_at DESC LIMIT ?;"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        alerts = []
        for r in rows:
            signals = []
            try:
                signals = json.loads(r["contributing_signals_json"])
            except Exception:
                pass
            alerts.append(Alert(
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
        return alerts
    finally:
        conn.close()

@router.get("/cases", response_model=List[Case])
def get_cases():
    """Returns all incident response cases."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cases ORDER BY updated_at DESC;")
        rows = cursor.fetchall()

        cases = []
        for r in rows:
            notes = [CaseNote(**n) for n in json.loads(r["notes_json"] or "[]")]
            timeline = [CaseTimelineEvent(**t) for t in json.loads(r["timeline_json"] or "[]")]
            
            # Fetch linked alert IDs
            cursor.execute("SELECT alert_id FROM case_alerts WHERE case_id = ?;", (r["case_id"],))
            linked_alerts = [ar[0] for ar in cursor.fetchall()]

            cases.append(Case(
                case_id=r["case_id"],
                case_number=r["case_number"],
                title=r["title"],
                severity=r["severity"],
                status=r["status"],
                assigned_analyst=r["assigned_analyst"],
                suspect_account_id=r["suspect_account_id"],
                notes=notes,
                timeline=timeline,
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                linked_alert_ids=linked_alerts
            ))
        return cases
    finally:
        conn.close()

@router.post("/cases", response_model=Case)
def create_case(case_in: CaseCreate):
    """Creates a new incident response case linked to suspect account and alerts."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM cases;")
        case_idx = cursor.fetchone()[0] + 1
        case_num = f"CASE-2026-{case_idx:04d}"
        case_id = f"CS_{int(datetime.now().timestamp()*1000)}"
        now_iso = datetime.now(timezone.utc).isoformat()

        notes = []
        if case_in.initial_note:
            notes.append({
                "note_id": f"NOTE_1",
                "author": "Investigator",
                "timestamp": now_iso,
                "content": case_in.initial_note
            })

        timeline = [{
            "timestamp": now_iso,
            "actor": "Investigator",
            "action": "CASE_CREATED",
            "details": f"Initiated case for suspect account {case_in.suspect_account_id}."
        }]

        cursor.execute(
            """
            INSERT INTO cases (case_id, case_number, title, severity, status, assigned_analyst, suspect_account_id, notes_json, timeline_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'NEW', 'Unassigned', ?, ?, ?, ?, ?);
            """,
            (case_id, case_num, case_in.title, case_in.severity, case_in.suspect_account_id, json.dumps(notes), json.dumps(timeline), now_iso, now_iso)
        )

        # Link alerts
        for alt_id in case_in.alert_ids:
            cursor.execute("INSERT OR IGNORE INTO case_alerts (case_id, alert_id) VALUES (?, ?);", (case_id, alt_id))
            cursor.execute("UPDATE alerts SET status = 'INVESTIGATING' WHERE alert_id = ?;", (alt_id,))

        append_audit_event(
            conn, "Investigator", "CREATE_CASE", "CASE", case_id, "SUCCESS",
            {"case_number": case_num, "suspect_account": case_in.suspect_account_id}
        )
        conn.commit()

        return Case(
            case_id=case_id,
            case_number=case_num,
            title=case_in.title,
            severity=case_in.severity,
            status="NEW",
            assigned_analyst="Unassigned",
            suspect_account_id=case_in.suspect_account_id,
            notes=[CaseNote(**n) for n in notes],
            timeline=[CaseTimelineEvent(**t) for t in timeline],
            created_at=now_iso,
            updated_at=now_iso,
            linked_alert_ids=case_in.alert_ids
        )
    finally:
        conn.close()

@router.get("/cases/{case_id}", response_model=Case)
def get_case_detail(case_id: str):
    """Returns single case with full timeline, notes, and linked alert IDs."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cases WHERE case_id = ?;", (case_id,))
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

        notes = [CaseNote(**n) for n in json.loads(r["notes_json"] or "[]")]
        timeline = [CaseTimelineEvent(**t) for t in json.loads(r["timeline_json"] or "[]")]
        
        cursor.execute("SELECT alert_id FROM case_alerts WHERE case_id = ?;", (case_id,))
        linked_alerts = [ar[0] for ar in cursor.fetchall()]

        return Case(
            case_id=r["case_id"],
            case_number=r["case_number"],
            title=r["title"],
            severity=r["severity"],
            status=r["status"],
            assigned_analyst=r["assigned_analyst"],
            suspect_account_id=r["suspect_account_id"],
            notes=notes,
            timeline=timeline,
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            linked_alert_ids=linked_alerts
        )
    finally:
        conn.close()

@router.patch("/cases/{case_id}", response_model=Case)
def update_case(case_id: str, update: CaseUpdate):
    """Updates case status, assigned analyst, or appends notes (supports simulated Pre-Conversion Review)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cases WHERE case_id = ?;", (case_id,))
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

        now_iso = datetime.now(timezone.utc).isoformat()
        notes = json.loads(r["notes_json"] or "[]")
        timeline = json.loads(r["timeline_json"] or "[]")
        status = update.status or r["status"]
        analyst = update.assigned_analyst or r["assigned_analyst"]
        author = update.author or "Investigator"

        if update.status and update.status != r["status"]:
            timeline.append({
                "timestamp": now_iso,
                "actor": author,
                "action": "STATUS_CHANGED",
                "details": f"Status updated from {r['status']} to {update.status}."
            })

        if update.assigned_analyst and update.assigned_analyst != r["assigned_analyst"]:
            timeline.append({
                "timestamp": now_iso,
                "actor": author,
                "action": "ANALYST_ASSIGNED",
                "details": f"Assigned to analyst {update.assigned_analyst}."
            })

        if update.new_note:
            note_id = f"NOTE_{len(notes)+1}"
            notes.append({
                "note_id": note_id,
                "author": author,
                "timestamp": now_iso,
                "content": update.new_note
            })
            timeline.append({
                "timestamp": now_iso,
                "actor": author,
                "action": "NOTE_ADDED",
                "details": f"Added note: {update.new_note[:60]}..."
            })

        cursor.execute(
            """
            UPDATE cases 
            SET status = ?, assigned_analyst = ?, notes_json = ?, timeline_json = ?, updated_at = ?
            WHERE case_id = ?;
            """,
            (status, analyst, json.dumps(notes), json.dumps(timeline), now_iso, case_id)
        )

        append_audit_event(
            conn, author, "UPDATE_CASE", "CASE", case_id, "SUCCESS",
            {"status": status, "assigned_analyst": analyst, "note_added": bool(update.new_note)}
        )
        conn.commit()

        cursor.execute("SELECT alert_id FROM case_alerts WHERE case_id = ?;", (case_id,))
        linked_alerts = [ar[0] for ar in cursor.fetchall()]

        return Case(
            case_id=case_id,
            case_number=r["case_number"],
            title=r["title"],
            severity=r["severity"],
            status=status,
            assigned_analyst=analyst,
            suspect_account_id=r["suspect_account_id"],
            notes=[CaseNote(**n) for n in notes],
            timeline=[CaseTimelineEvent(**t) for t in timeline],
            created_at=r["created_at"],
            updated_at=now_iso,
            linked_alert_ids=linked_alerts
        )
    finally:
        conn.close()

@router.get("/evidence-vault")
def get_evidence_vault():
    """Returns searchable catalog of cryptographic evidence items and verified lineage receipts."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Lineage Token Receipts
        cursor.execute("SELECT DISTINCT token_id, COUNT(*) as count, MIN(timestamp) as start_t, MAX(timestamp) as end_t FROM lineage_events GROUP BY token_id;")
        token_rows = cursor.fetchall()
        tokens = [
            {
                "evidence_type": "LINEAGE_CHAIN",
                "reference_id": r["token_id"],
                "description": f"Simulated e-rupee token provenance chain containing {r['count']} SHA-256 verified transfer events.",
                "timestamp_range": f"{r['start_t']} to {r['end_t']}",
                "status": "VERIFIED"
            }
            for r in token_rows
        ]

        # 2. Case Dossiers
        cursor.execute("SELECT case_id, case_number, title, suspect_account_id, created_at FROM cases;")
        case_rows = cursor.fetchall()
        cases_ev = [
            {
                "evidence_type": "CASE_DOSSIER",
                "reference_id": r["case_id"],
                "description": f"{r['case_number']}: {r['title']} (Suspect: {r['suspect_account_id']})",
                "timestamp_range": r["created_at"],
                "status": "SEALED"
            }
            for r in case_rows
        ]

        return {"evidence_items": tokens + cases_ev, "total_items": len(tokens) + len(cases_ev)}
    finally:
        conn.close()

@router.get("/evidence-vault/export/{case_id}")
def export_case_evidence_package(case_id: str):
    """Generates an immutable, verifiable JSON case evidence dossier package with digital seal."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cases WHERE case_id = ?;", (case_id,))
        case_r = cursor.fetchone()
        if not case_r:
            raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

        # Suspect account
        cursor.execute("SELECT * FROM accounts WHERE account_id = ?;", (case_r["suspect_account_id"],))
        acc_r = cursor.fetchone()

        # Linked alerts
        cursor.execute(
            """
            SELECT al.* FROM alerts al 
            JOIN case_alerts ca ON al.alert_id = ca.alert_id 
            WHERE ca.case_id = ?;
            """,
            (case_id,)
        )
        alerts_r = [dict(a) for a in cursor.fetchall()]

        # Lineage receipts associated with suspect account or its token transactions
        suspect_id = case_r["suspect_account_id"]
        cursor.execute(
            """
            SELECT DISTINCT le.* FROM lineage_events le
            WHERE le.source_account_id = ? OR le.destination_account_id = ?
               OR le.token_id IN (
                   SELECT token_lineage_id FROM transactions 
                   WHERE (source_account_id = ? OR destination_account_id = ?) 
                     AND token_lineage_id IS NOT NULL
               )
            ORDER BY le.sequence_index ASC;
            """,
            (suspect_id, suspect_id, suspect_id, suspect_id)
        )
        lineage_r = [dict(l) for l in cursor.fetchall()]

        lineage_status = "VERIFIED_RECEIPTS_ATTACHED" if lineage_r else "NO_TOKEN_LINEAGE_IN_SCENARIO"
        lineage_note = (
            f"{len(lineage_r)} cryptographic e-INR lineage transfer events verified with SHA-256 hash continuity."
            if lineage_r else
            "This investigation target does not utilize simulated e-INR cryptographic token tracking. Heuristic, topological, and GNN signals are preserved."
        )

        package_dict = {
            "dossier_type": "MULE_MATRIX_CASE_EVIDENCE_PACKAGE",
            "version": config.version,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "case_record": dict(case_r),
            "suspect_account": dict(acc_r) if acc_r else {},
            "associated_alerts": alerts_r,
            "verified_lineage_events": lineage_r,
            "lineage_verification_status": lineage_status,
            "lineage_explanation": lineage_note,
            "disclaimer": "Simulated cybersecurity threat intelligence prototype. Strictly non-production data."
        }

        # Compute digital seal hash
        canonical_str = json.dumps(package_dict, sort_keys=True)
        seal_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
        package_dict["integrity_seal_sha256"] = seal_hash

        append_audit_event(
            conn, "Investigator", "EXPORT_EVIDENCE_DOSSIER", "CASE", case_id, "SUCCESS",
            {"seal_hash": seal_hash}
        )
        conn.commit()

        return package_dict
    finally:
        conn.close()

@router.get("/evidence-vault/export-lineage/{token_id}")
def export_lineage_evidence_package(token_id: str):
    """Generates an immutable, verifiable JSON token lineage provenance dossier with digital seal."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lineage_events WHERE token_id = ? ORDER BY sequence_index ASC;", (token_id,))
        rows = cursor.fetchall()
        if not rows:
            raise HTTPException(status_code=404, detail=f"Lineage chain for token {token_id} not found.")

        lineage_events = [dict(r) for r in rows]

        # Verify hash continuity
        from backend.app.engines.lineage_engine import verify_lineage_chain
        verify_res = verify_lineage_chain(lineage_events)

        package_dict = {
            "dossier_type": "MULE_MATRIX_TOKEN_PROVENANCE_PACKAGE",
            "version": config.version,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "token_id": token_id,
            "total_hops": len(lineage_events),
            "verification_status": "VERIFIED_VALID" if verify_res.valid else "COMPROMISED",
            "verification_message": verify_res.message,
            "is_tamper_free": verify_res.valid,
            "events": lineage_events,
            "disclaimer": "Simulated e-rupee token provenance forensic receipt. Non-production prototype."
        }

        canonical_str = json.dumps(package_dict, sort_keys=True)
        seal_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
        package_dict["integrity_seal_sha256"] = seal_hash

        append_audit_event(
            conn, "Investigator", "EXPORT_LINEAGE_DOSSIER", "TOKEN", token_id, "SUCCESS",
            {"seal_hash": seal_hash, "hops": len(lineage_events)}
        )
        conn.commit()

        return package_dict
    finally:
        conn.close()

@router.get("/audit-ledger", response_model=List[AuditEvent])
def get_audit_ledger(limit: int = Query(50, ge=1, le=200)):
    """Returns the immutable application action ledger with verified SHA-256 hash chaining."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_events ORDER BY rowid DESC LIMIT ?;", (limit,))
        rows = cursor.fetchall()
        events = []
        for r in rows:
            details = {}
            try:
                details = json.loads(r["details_json"] or "{}")
            except Exception:
                pass
            events.append(AuditEvent(
                event_id=r["event_id"],
                timestamp=r["timestamp"],
                actor=r["actor"],
                action=r["action"],
                target_entity_type=r["target_entity_type"],
                target_entity_id=r["target_entity_id"],
                outcome=r["outcome"],
                integrity_hash=r["integrity_hash"],
                prev_audit_hash=r["prev_audit_hash"],
                details=details
            ))
        return events
    finally:
        conn.close()
