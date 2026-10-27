"""
SQLite database engine with WAL mode and foreign key enforcement for MULE MATRIX.
"""
import sqlite3
import json
from contextlib import contextmanager
from typing import Generator
from backend.app.core.config import config
from backend.app.core.logging import logger

SCHEMA_SQL = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    account_number TEXT NOT NULL,
    account_type TEXT NOT NULL,
    kyc_risk_score REAL NOT NULL DEFAULT 0.0,
    scenario_tag TEXT,
    ground_truth_label INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    source_account_id TEXT NOT NULL,
    destination_account_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'e-INR',
    timestamp TEXT NOT NULL,
    tx_type TEXT NOT NULL DEFAULT 'transfer',
    token_lineage_id TEXT,
    scenario_id TEXT,
    FOREIGN KEY (source_account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (destination_account_id) REFERENCES accounts(account_id)
);

CREATE TABLE IF NOT EXISTS lineage_events (
    event_id TEXT PRIMARY KEY,
    token_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    parent_event_id TEXT,
    source_account_id TEXT NOT NULL,
    destination_account_id TEXT NOT NULL,
    amount REAL NOT NULL,
    timestamp TEXT NOT NULL,
    sequence_index INTEGER NOT NULL,
    canonical_payload TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    FOREIGN KEY (source_account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (destination_account_id) REFERENCES accounts(account_id)
);

CREATE TABLE IF NOT EXISTS detection_results (
    result_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    algorithm_name TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    execution_status TEXT NOT NULL,
    score REAL,
    evidence_json TEXT NOT NULL DEFAULT '{}',
    latency_ms REAL NOT NULL DEFAULT 0.0,
    computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    transaction_id TEXT,
    risk_score REAL NOT NULL,
    severity TEXT NOT NULL,
    primary_reason TEXT NOT NULL,
    contributing_signals_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'NEW',
    created_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW',
    assigned_analyst TEXT NOT NULL DEFAULT 'Unassigned',
    suspect_account_id TEXT NOT NULL,
    notes_json TEXT NOT NULL DEFAULT '[]',
    timeline_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (suspect_account_id) REFERENCES accounts(account_id)
);

CREATE TABLE IF NOT EXISTS case_alerts (
    case_id TEXT NOT NULL,
    alert_id TEXT NOT NULL,
    PRIMARY KEY (case_id, alert_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
    FOREIGN KEY (alert_id) REFERENCES alerts(alert_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_events (
    event_id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    outcome TEXT NOT NULL,
    integrity_hash TEXT NOT NULL,
    prev_audit_hash TEXT NOT NULL,
    details_json TEXT NOT NULL DEFAULT '{}'
);

-- Indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_tx_src ON transactions(source_account_id);
CREATE INDEX IF NOT EXISTS idx_tx_dst ON transactions(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_tx_time ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_lineage_tok ON lineage_events(token_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acc ON alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sev ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_detect_entity ON detection_results(entity_id, algorithm_name);
"""

def get_connection(db_path: str = None) -> sqlite3.Connection:
    target_path = db_path or config.database_url
    conn = sqlite3.connect(target_path, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def db_session(db_path: str = None) -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction rolled back due to error: {e}")
        raise
    finally:
        conn.close()

def init_db(db_path: str = None) -> None:
    target_path = db_path or config.database_url
    logger.info(f"Initializing database schema at {target_path}...")
    conn = get_connection(target_path)
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
    finally:
        conn.close()
    logger.info("Database initialized successfully.")
