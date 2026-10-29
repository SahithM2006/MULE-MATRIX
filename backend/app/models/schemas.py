"""
Typed Pydantic schemas representing the shared API contract between backend and frontend.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# ==========================================
# 1. ENTITY SCHEMAS
# ==========================================

class AccountBase(BaseModel):
    account_id: str
    account_number: str
    account_type: str
    kyc_risk_score: float = 0.0
    scenario_tag: Optional[str] = None
    created_at: str

class Account(AccountBase):
    ground_truth_label: int = 0  # 0=Normal, 1=Mule/Fraud (Isolated from model inputs)

class TransactionBase(BaseModel):
    transaction_id: str
    source_account_id: str
    destination_account_id: str
    amount: float
    currency: str = "e-INR"
    timestamp: str
    tx_type: str = "transfer"
    token_lineage_id: Optional[str] = None
    scenario_id: Optional[str] = None

class Transaction(TransactionBase):
    pass

class TransactionEnriched(TransactionBase):
    source_account_type: Optional[str] = None
    destination_account_type: Optional[str] = None
    risk_score: Optional[float] = None
    severity: Optional[str] = None
    signals: List[str] = Field(default_factory=list)

class LineageEvent(BaseModel):
    event_id: str
    token_id: str
    transaction_id: str
    parent_event_id: Optional[str] = None
    source_account_id: str
    destination_account_id: str
    amount: float
    timestamp: str
    sequence_index: int
    canonical_payload: str
    prev_hash: str
    current_hash: str
    is_verified: bool = True

class DetectionResult(BaseModel):
    result_id: str
    entity_type: str
    entity_id: str
    algorithm_name: str
    algorithm_version: str
    execution_status: str  # SUCCESS, ERROR, NOT_TRAINED, UNAVAILABLE
    score: Optional[float] = None
    evidence_json: Dict[str, Any] = Field(default_factory=dict)
    latency_ms: float = 0.0
    computed_at: str

class AlertSignal(BaseModel):
    rule_or_model: str
    normalized_score: float
    contribution_weight: float
    reason: str
    evidence_references: List[str] = Field(default_factory=list)

class Alert(BaseModel):
    alert_id: str
    account_id: str
    transaction_id: Optional[str] = None
    risk_score: float
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    primary_reason: str
    contributing_signals: List[AlertSignal] = Field(default_factory=list)
    status: str = "NEW"  # NEW, INVESTIGATING, ESCALATED, CLOSED
    created_at: str

class CaseNote(BaseModel):
    note_id: str
    author: str
    timestamp: str
    content: str

class CaseTimelineEvent(BaseModel):
    timestamp: str
    actor: str
    action: str
    details: str

class Case(BaseModel):
    case_id: str
    case_number: str
    title: str
    severity: str
    status: str  # NEW, UNDER_REVIEW, ESCALATED, CLOSED
    assigned_analyst: str = "Unassigned"
    suspect_account_id: str
    notes: List[CaseNote] = Field(default_factory=list)
    timeline: List[CaseTimelineEvent] = Field(default_factory=list)
    created_at: str
    updated_at: str
    linked_alert_ids: List[str] = Field(default_factory=list)

class CaseCreate(BaseModel):
    title: str
    severity: str
    suspect_account_id: str
    initial_note: Optional[str] = None
    alert_ids: List[str] = Field(default_factory=list)

class CaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    new_note: Optional[str] = None
    author: Optional[str] = "Investigator"

class AuditEvent(BaseModel):
    event_id: str
    timestamp: str
    actor: str
    action: str
    target_entity_type: str
    target_entity_id: str
    outcome: str
    integrity_hash: str
    prev_audit_hash: str
    details: Dict[str, Any] = Field(default_factory=dict)

# ==========================================
# 2. ALGORITHM & TRACE SCHEMAS
# ==========================================

class BFSRequest(BaseModel):
    seed_account_id: str
    max_hops: int = 4
    time_window_seconds: int = 3600
    direction: str = "forward"  # "forward" or "backward"
    min_amount: Optional[float] = None
    start_timestamp: Optional[str] = None

class DiscoveredHop(BaseModel):
    hop_index: int
    source_account_id: str
    destination_account_id: str
    transaction_id: str
    amount: float
    timestamp: str

class DiscoveredPath(BaseModel):
    path_id: str
    hops: List[DiscoveredHop]
    total_amount: float
    start_timestamp: str
    end_timestamp: str
    duration_seconds: float
    accounts_in_path: List[str]
    stop_reason: Optional[str] = "MAX_HOPS_REACHED"
    direction: Optional[str] = "forward"

class BFSResponse(BaseModel):
    seed_account_id: str
    total_paths: int
    paths: List[DiscoveredPath]
    visited_nodes: List[str]
    execution_time_ms: float
    stop_reasons_summary: Optional[Dict[str, int]] = None

class LineageVerifyResponse(BaseModel):
    valid: bool
    total_events: int
    token_id: str
    first_broken_event_id: Optional[str] = None
    expected_hash: Optional[str] = None
    actual_hash: Optional[str] = None
    message: str

class TamperTestResponse(BaseModel):
    tampered_event_id: str
    original_amount: float
    tampered_amount: float
    detected: bool
    broken_link_reported: str
    message: str

class GraphNode(BaseModel):
    id: str
    label: str
    account_type: str
    kyc_risk_score: float
    aggregate_risk_score: Optional[float] = None
    severity: Optional[str] = None
    in_degree: int = 0
    out_degree: int = 0
    community_id: Optional[int] = None
    is_hero_suspect: bool = False

class GraphEdge(BaseModel):
    id: str
    from_node: str
    to_node: str
    amount: float
    timestamp: str
    transaction_id: str
    highlighted: bool = False

class CommunitySummary(BaseModel):
    community_id: int
    size: int
    internal_density: float
    flagged_account_count: int
    flagged_ratio: float
    total_volume: float

class GraphDataResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    communities: List[CommunitySummary]
    total_accounts: int
    total_transactions: int

# ==========================================
# 3. DETECTION & DOSSIER SCHEMAS
# ==========================================

class SlidingWindowMetrics(BaseModel):
    window_name: str
    window_duration_seconds: int
    tx_count: int
    velocity_tx_per_hour: float
    burst_score: float
    inflow_amount: float
    outflow_amount: float
    rapid_passthrough_detected: bool
    median_passthrough_delay_seconds: Optional[float] = None
    passthrough_ratio: Optional[float] = None
    supporting_tx_ids: List[str] = Field(default_factory=list)

class GraphFeaturesMetrics(BaseModel):
    in_degree: int
    out_degree: int
    degree_ratio: float
    weighted_inflow: float
    weighted_outflow: float
    fan_in_ratio: float
    fan_out_ratio: float
    clustering_coefficient: float
    connected_component_size: int
    transaction_velocity: float
    pass_through_ratio: float

class TopFeaturePerturbation(BaseModel):
    feature_name: str
    account_value: float
    reference_median: float
    anomaly_contribution_score: float

class IsolationForestOutput(BaseModel):
    status: str
    anomaly_score: Optional[float] = None  # 0.0 to 1.0 (1.0 = highly anomalous)
    is_anomaly: bool = False
    top_contributing_features: List[TopFeaturePerturbation] = Field(default_factory=list)
    version: str

class LouvainOutput(BaseModel):
    community_id: int
    community_size: int
    internal_density: float
    mule_concentration_ratio: float

class GraphSAGEOutput(BaseModel):
    status: str  # "READY", "NOT_TRAINED", "FAILED"
    mule_probability: Optional[float] = None  # 0.0 to 1.0
    embedding_vector_sample: List[float] = Field(default_factory=list)
    model_version: Optional[str] = None
    trained_at: Optional[str] = None
    validation_f1: Optional[float] = None

class AccountDossier(BaseModel):
    account: AccountBase
    aggregate_risk_score: float  # 0 to 100
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    primary_reason: str
    signals: List[AlertSignal]
    sliding_window_analysis: Dict[str, SlidingWindowMetrics]
    graph_features: Optional[GraphFeaturesMetrics] = None
    isolation_forest: IsolationForestOutput
    louvain_community: Optional[LouvainOutput] = None
    graphsage: GraphSAGEOutput
    active_alerts: List[Alert]
    recent_transactions: List[TransactionBase]

# ==========================================
# 4. SYSTEM HEALTH & BENCHMARK SCHEMAS
# ==========================================

class SubsystemStatus(BaseModel):
    subsystem_name: str
    state: str  # READY, RUNNING, FAILED, AWAITING_DATA, NOT_TRAINED
    details: str
    last_updated: str

class SystemHealthResponse(BaseModel):
    overall_status: str
    simulation_mode: bool
    database_connected: bool
    total_accounts: int
    total_transactions: int
    total_lineage_events: int
    subsystems: Dict[str, SubsystemStatus]

class SentinelSummary(BaseModel):
    suspicious_networks_count: int
    flagged_transactions_count: int
    potential_cashout_count: int
    total_e_inr_volume: float
    recent_alerts: List[Alert]
    detection_integrity_status: str
    lineage_integrity_status: str

class BenchmarkMetrics(BaseModel):
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    dataset_time_latency_sec: float
    processing_execution_latency_ms: float

class BenchmarkComparison(BaseModel):
    benchmark_name: str = "SYNTHETIC BENCHMARK"
    evaluated_at: str
    total_test_accounts: int
    total_test_transactions: int
    rules_only_baseline: BenchmarkMetrics
    combined_pipeline: BenchmarkMetrics
    f1_improvement_pct: float
    status: str  # "COMPLETED", "PENDING", "UNAVAILABLE"

class HeroReplayStep(BaseModel):
    step_number: int
    title: str
    timestamp: str
    source_account: str
    destination_account: str
    amount: float
    tx_type: str
    lineage_event_id: str
    detection_events: List[str]
    alert_triggered: Optional[str] = None
    explanation: str
