"""
Unit tests for database initialization, foreign key constraints, and Pydantic models.
"""
import pytest
import sqlite3
import tempfile
import os
from pathlib import Path
from backend.app.db.database import init_db, db_session
from backend.app.models.schemas import (
    Account, Transaction, LineageEvent, Alert, Case, AuditEvent
)

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        try:
            os.remove(path)
        except PermissionError:
            pass

def test_database_initialization(temp_db):
    """Verify all required tables are created."""
    with db_session(temp_db) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = {row[0] for row in cursor.fetchall()}
        
        expected_tables = {
            "accounts", "transactions", "lineage_events",
            "detection_results", "alerts", "cases", "case_alerts", "audit_events"
        }
        for table in expected_tables:
            assert table in tables, f"Table {table} missing from schema"

def test_foreign_key_enforcement(temp_db):
    """Verify that foreign key constraints prevent orphan transactions."""
    with db_session(temp_db) as conn:
        cursor = conn.cursor()
        # Inserting transaction with invalid accounts should fail
        with pytest.raises(sqlite3.IntegrityError):
            cursor.execute(
                """
                INSERT INTO transactions (transaction_id, source_account_id, destination_account_id, amount, timestamp)
                VALUES ('TX_FAIL_01', 'NON_EXISTENT_SRC', 'NON_EXISTENT_DST', 1000.0, '2026-10-27T10:00:00Z');
                """
            )
            conn.commit()

def test_account_and_transaction_insertion(temp_db):
    """Test valid insertions into accounts and transactions."""
    with db_session(temp_db) as conn:
        cursor = conn.cursor()
        # Insert 2 accounts
        cursor.execute(
            """
            INSERT INTO accounts (account_id, account_number, account_type, kyc_risk_score, ground_truth_label, created_at)
            VALUES ('ACC_TEST_01', 'IN9990001', 'retail', 0.1, 0, '2026-01-01T00:00:00Z'),
                   ('ACC_TEST_02', 'IN9990002', 'merchant', 0.2, 0, '2026-01-01T00:00:00Z');
            """
        )
        # Insert transaction
        cursor.execute(
            """
            INSERT INTO transactions (transaction_id, source_account_id, destination_account_id, amount, timestamp)
            VALUES ('TX_OK_01', 'ACC_TEST_01', 'ACC_TEST_02', 4500.0, '2026-10-27T12:00:00Z');
            """
        )
        conn.commit()

        # Query back
        cursor.execute("SELECT * FROM transactions WHERE transaction_id = 'TX_OK_01'")
        row = cursor.fetchone()
        assert row is not None
        assert row["amount"] == 4500.0
        assert row["source_account_id"] == "ACC_TEST_01"
        assert row["destination_account_id"] == "ACC_TEST_02"

def test_pydantic_schema_validation():
    """Verify Pydantic models validate typed inputs properly."""
    acc = Account(
        account_id="ACC_PY_01",
        account_number="IN8880001",
        account_type="victim",
        kyc_risk_score=0.05,
        ground_truth_label=0,
        created_at="2026-01-01T00:00:00Z"
    )
    assert acc.account_id == "ACC_PY_01"
    assert acc.ground_truth_label == 0

    tx = Transaction(
        transaction_id="TX_PY_01",
        source_account_id="ACC_PY_01",
        destination_account_id="ACC_PY_02",
        amount=50000.0,
        currency="e-INR",
        timestamp="2026-10-27T08:00:00Z"
    )
    assert tx.amount == 50000.0
    assert tx.currency == "e-INR"
