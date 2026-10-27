"""
Algorithm 2: SHA-256 Hash Chaining (Token-Lineage Integrity Engine).
Provides cryptographically tamper-evident provenance records for simulated e-rupee token movements.

CRITICAL ARCHITECTURAL NOTE:
This algorithm validates the integrity and historical immutability of recorded lineage events.
It is an integrity verification mechanism, NOT a fraud detector, and must never be presented as one.
A valid hash chain verifies that recorded data has not been modified after hashing; it does not prove
that the recorded underlying transaction was legally valid or free of external duress.
"""
import hashlib
import json
import copy
from typing import List, Dict, Any, Optional, Tuple
from backend.app.models.schemas import LineageVerifyResponse, TamperTestResponse
from backend.app.core.logging import logger

def canonical_serialize(payload: Dict[str, Any]) -> str:
    """
    Serializes a dictionary into a strictly deterministic canonical JSON string.
    Keys are sorted alphabetically and whitespace is eliminated.
    """
    return json.dumps(payload, sort_keys=True, separators=(',', ':'))

def compute_sha256_hash(canonical_payload: str, prev_hash: str) -> str:
    """Computes SHA-256(canonical_payload + prev_hash)."""
    hasher = hashlib.sha256()
    hasher.update((canonical_payload + prev_hash).encode('utf-8'))
    return hasher.hexdigest()

def create_genesis_hash(token_id: str) -> str:
    """Creates the deterministic root/genesis hash for a newly minted token."""
    return hashlib.sha256(f"GENESIS:{token_id}".encode('utf-8')).hexdigest()

def verify_lineage_chain(
    events: List[Dict[str, Any]],
    start_index: int = 0,
    end_index: Optional[int] = None
) -> LineageVerifyResponse:
    """
    Verifies the SHA-256 hash chaining of a sequence or segment of lineage events.
    Returns:
    - valid: True if all hashes and parent references are intact.
    - first_broken_event_id: The event_id of the first corrupted record when tampering is detected.
    - expected_hash vs actual_hash.
    """
    if not events:
        return LineageVerifyResponse(
            valid=True,
            total_events=0,
            token_id="N/A",
            message="No lineage events to verify."
        )

    # Sort events by sequence index
    sorted_events = sorted(events, key=lambda x: x["sequence_index"])
    if end_index is not None:
        sorted_events = sorted_events[start_index:end_index]
    else:
        sorted_events = sorted_events[start_index:]

    token_id = sorted_events[0].get("token_id", "UNKNOWN")

    for i, evt in enumerate(sorted_events):
        canonical_str = evt.get("canonical_payload", "")
        prev_hash = evt.get("prev_hash", "")
        actual_curr_hash = evt.get("current_hash", "")
        event_id = evt.get("event_id", f"EVT_{i}")

        # If it's the genesis event (sequence 1)
        if evt.get("sequence_index") == 1:
            expected_genesis = create_genesis_hash(token_id)
            if prev_hash != expected_genesis:
                return LineageVerifyResponse(
                    valid=False,
                    total_events=len(sorted_events),
                    token_id=token_id,
                    first_broken_event_id=event_id,
                    expected_hash=expected_genesis,
                    actual_hash=prev_hash,
                    message=f"Genesis block hash mismatch at event {event_id}."
                )

        # Verify parent linkage if not at start
        if i > 0:
            predecessor = sorted_events[i - 1]
            if evt.get("parent_event_id") != predecessor.get("event_id"):
                return LineageVerifyResponse(
                    valid=False,
                    total_events=len(sorted_events),
                    token_id=token_id,
                    first_broken_event_id=event_id,
                    expected_hash=predecessor.get("event_id"),
                    actual_hash=evt.get("parent_event_id"),
                    message=f"Parent pointer broken between {predecessor.get('event_id')} and {event_id}."
                )
            if prev_hash != predecessor.get("current_hash"):
                return LineageVerifyResponse(
                    valid=False,
                    total_events=len(sorted_events),
                    token_id=token_id,
                    first_broken_event_id=event_id,
                    expected_hash=predecessor.get("current_hash"),
                    actual_hash=prev_hash,
                    message=f"Previous hash link mismatch at event {event_id}."
                )

        # Recompute hash from canonical payload and prev_hash
        recomputed_hash = compute_sha256_hash(canonical_str, prev_hash)
        if recomputed_hash != actual_curr_hash:
            return LineageVerifyResponse(
                valid=False,
                total_events=len(sorted_events),
                token_id=token_id,
                first_broken_event_id=event_id,
                expected_hash=recomputed_hash,
                actual_hash=actual_curr_hash,
                message=f"Integrity failure at event {event_id}: payload rehash mismatch."
            )

    return LineageVerifyResponse(
        valid=True,
        total_events=len(sorted_events),
        token_id=token_id,
        first_broken_event_id=None,
        expected_hash=None,
        actual_hash=None,
        message=f"Chain intact. All {len(sorted_events)} lineage records verified successfully."
    )

def run_tamper_test(original_events: List[Dict[str, Any]], target_event_index: int = 1) -> TamperTestResponse:
    """
    Operates on an isolated deep copy of original lineage records.
    Modifies an event's amount to demonstrate cryptographic tamper detection.
    Does NOT mutate the original records.
    """
    if not original_events or len(original_events) < 2:
        return TamperTestResponse(
            tampered_event_id="N/A",
            original_amount=0.0,
            tampered_amount=0.0,
            detected=False,
            broken_link_reported="NONE",
            message="Insufficient events to run tamper test (minimum 2 required)."
        )

    # Deep copy to ensure absolute isolation
    cloned_events = copy.deepcopy(original_events)
    target_idx = min(target_event_index, len(cloned_events) - 1)
    target_event = cloned_events[target_idx]

    orig_amt = float(target_event.get("amount", 1000.0))
    tampered_amt = orig_amt + 50000.0  # Fraudulent inflation

    # Parse and tamper the canonical payload
    try:
        payload_dict = json.loads(target_event["canonical_payload"])
    except Exception:
        payload_dict = {"amount": orig_amt}
    
    payload_dict["amount"] = tampered_amt
    target_event["canonical_payload"] = canonical_serialize(payload_dict)
    target_event["amount"] = tampered_amt

    # Verify the tampered clone
    verify_result = verify_lineage_chain(cloned_events)
    broken_id = verify_result.first_broken_event_id or "NONE"
    detected = not verify_result.valid and broken_id == target_event["event_id"]

    return TamperTestResponse(
        tampered_event_id=target_event["event_id"],
        original_amount=orig_amt,
        tampered_amount=tampered_amt,
        detected=detected,
        broken_link_reported=broken_id,
        message=(
            f"Tamper test successful: Modified amount from ₹{orig_amt:,.2f} to ₹{tampered_amt:,.2f}. "
            f"Integrity check successfully identified corrupted event {broken_id}."
        ) if detected else "Tamper test failed: alteration went undetected."
    )
