/**
 * TypeScript API contracts matching backend Pydantic models 1:1.
 */

export interface AccountBase {
  account_id: string;
  account_number: string;
  account_type: string;
  kyc_risk_score: number;
  scenario_tag?: string | null;
  created_at: string;
}

export interface Account extends AccountBase {
  ground_truth_label: number;
}

export interface TransactionBase {
  transaction_id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  tx_type: string;
  token_lineage_id?: string | null;
  scenario_id?: string | null;
}

export interface TransactionEnriched extends TransactionBase {
  source_account_type?: string | null;
  destination_account_type?: string | null;
  risk_score?: number | null;
  severity?: string | null;
  signals: string[];
}

export interface LineageEvent {
  event_id: string;
  token_id: string;
  transaction_id: string;
  parent_event_id?: string | null;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  timestamp: string;
  sequence_index: number;
  canonical_payload: string;
  prev_hash: string;
  current_hash: string;
  is_verified: boolean;
}

export interface LineageVerifyResponse {
  valid: boolean;
  total_events: number;
  token_id: string;
  first_broken_event_id?: string | null;
  expected_hash?: string | null;
  actual_hash?: string | null;
  message: string;
}

export interface TamperTestResponse {
  tampered_event_id: string;
  original_amount: number;
  tampered_amount: number;
  detected: boolean;
  broken_link_reported: string;
  message: string;
}

export interface AlertSignal {
  rule_or_model: string;
  normalized_score: number;
  contribution_weight: number;
  reason: string;
  evidence_references: string[];
}

export interface Alert {
  alert_id: string;
  account_id: string;
  transaction_id?: string | null;
  risk_score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_reason: string;
  contributing_signals: AlertSignal[];
  status: "NEW" | "INVESTIGATING" | "ESCALATED" | "CLOSED";
  created_at: string;
}

export interface CaseNote {
  note_id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface CaseTimelineEvent {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface Case {
  case_id: string;
  case_number: string;
  title: string;
  severity: string;
  status: "NEW" | "UNDER_REVIEW" | "ESCALATED" | "CLOSED";
  assigned_analyst: string;
  suspect_account_id: string;
  notes: CaseNote[];
  timeline: CaseTimelineEvent[];
  created_at: string;
  updated_at: string;
  linked_alert_ids: string[];
}

export interface CaseCreate {
  title: string;
  severity: string;
  suspect_account_id: string;
  initial_note?: string;
  alert_ids: string[];
}

export interface CaseUpdate {
  status?: string;
  assigned_analyst?: string;
  new_note?: string;
  author?: string;
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  actor: string;
  action: string;
  target_entity_type: string;
  target_entity_id: string;
  outcome: string;
  integrity_hash: string;
  prev_audit_hash: string;
  details: Record<string, any>;
}

export interface BFSRequest {
  seed_account_id: string;
  max_hops: number;
  time_window_seconds: number;
  direction: "forward" | "backward";
  min_amount?: number;
  start_timestamp?: string;
}

export interface DiscoveredHop {
  hop_index: number;
  source_account_id: string;
  destination_account_id: string;
  transaction_id: string;
  amount: number;
  timestamp: string;
}

export interface DiscoveredPath {
  path_id: string;
  hops: DiscoveredHop[];
  total_amount: number;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  accounts_in_path: string[];
}

export interface BFSResponse {
  seed_account_id: string;
  total_paths: number;
  paths: DiscoveredPath[];
  visited_nodes: string[];
  execution_time_ms: number;
}

export interface GraphNode {
  id: string;
  label: string;
  account_type: string;
  kyc_risk_score: number;
  aggregate_risk_score?: number | null;
  severity?: string | null;
  in_degree: number;
  out_degree: number;
  community_id?: number | null;
  is_hero_suspect: boolean;
}

export interface GraphEdge {
  id: string;
  from_node: string;
  to_node: string;
  amount: number;
  timestamp: string;
  transaction_id: string;
  highlighted: boolean;
}

export interface CommunitySummary {
  community_id: number;
  size: number;
  internal_density: number;
  flagged_account_count: number;
  flagged_ratio: number;
  total_volume: number;
}

export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  communities: CommunitySummary[];
  total_accounts: number;
  total_transactions: number;
}

export interface SlidingWindowMetrics {
  window_name: string;
  window_duration_seconds: number;
  tx_count: number;
  velocity_tx_per_hour: number;
  burst_score: number;
  inflow_amount: number;
  outflow_amount: number;
  rapid_passthrough_detected: boolean;
  median_passthrough_delay_seconds?: number | null;
  passthrough_ratio?: number | null;
  supporting_tx_ids: string[];
}

export interface GraphFeaturesMetrics {
  in_degree: number;
  out_degree: number;
  degree_ratio: number;
  weighted_inflow: number;
  weighted_outflow: number;
  fan_in_ratio: number;
  fan_out_ratio: number;
  clustering_coefficient: number;
  connected_component_size: number;
  transaction_velocity: number;
  pass_through_ratio: number;
}

export interface TopFeaturePerturbation {
  feature_name: string;
  account_value: number;
  reference_median: number;
  anomaly_contribution_score: number;
}

export interface IsolationForestOutput {
  status: string;
  anomaly_score?: number | null;
  is_anomaly: boolean;
  top_contributing_features: TopFeaturePerturbation[];
  version: string;
}

export interface LouvainOutput {
  community_id: number;
  community_size: number;
  internal_density: number;
  mule_concentration_ratio: number;
}

export interface GraphSAGEOutput {
  status: "READY" | "NOT_TRAINED" | "FAILED";
  mule_probability?: number | null;
  embedding_vector_sample: number[];
  model_version?: string | null;
  trained_at?: string | null;
  validation_f1?: number | null;
}

export interface AccountDossier {
  account: AccountBase;
  aggregate_risk_score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_reason: string;
  signals: AlertSignal[];
  sliding_window_analysis: Record<string, SlidingWindowMetrics>;
  graph_features?: GraphFeaturesMetrics | null;
  isolation_forest: IsolationForestOutput;
  louvain_community?: LouvainOutput | null;
  graphsage: GraphSAGEOutput;
  active_alerts: Alert[];
  recent_transactions: TransactionBase[];
}

export interface SubsystemStatus {
  subsystem_name: string;
  state: "READY" | "RUNNING" | "FAILED" | "AWAITING_DATA" | "NOT_TRAINED";
  details: string;
  last_updated: string;
}

export interface SystemHealthResponse {
  overall_status: string;
  simulation_mode: boolean;
  database_connected: boolean;
  total_accounts: number;
  total_transactions: number;
  total_lineage_events: number;
  subsystems: Record<string, SubsystemStatus>;
}

export interface SentinelSummary {
  suspicious_networks_count: number;
  flagged_transactions_count: number;
  potential_cashout_count: number;
  total_e_inr_volume: number;
  recent_alerts: Alert[];
  detection_integrity_status: string;
  lineage_integrity_status: string;
}

export interface BenchmarkMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  dataset_time_latency_sec: number;
  processing_execution_latency_ms: number;
}

export interface BenchmarkComparison {
  benchmark_name: string;
  evaluated_at: string;
  total_test_accounts: number;
  total_test_transactions: number;
  rules_only_baseline: BenchmarkMetrics;
  combined_pipeline: BenchmarkMetrics;
  f1_improvement_pct: number;
  status: string;
}

export interface HeroReplayStep {
  step_number: number;
  title: string;
  timestamp: string;
  source_account: string;
  destination_account: string;
  amount: number;
  tx_type: string;
  lineage_event_id: string;
  detection_events: string[];
  alert_triggered?: string | null;
  explanation: string;
}
