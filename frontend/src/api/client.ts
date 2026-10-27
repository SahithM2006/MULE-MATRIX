/**
 * Typed API Client for MULE MATRIX REST backend.
 */
import {
  SystemHealthResponse,
  SentinelSummary,
  TransactionEnriched,
  GraphDataResponse,
  BFSRequest,
  BFSResponse,
  LineageEvent,
  LineageVerifyResponse,
  TamperTestResponse,
  AccountDossier,
  BenchmarkComparison,
  Alert,
  Case,
  CaseCreate,
  CaseUpdate,
  AuditEvent,
  HeroReplayStep
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errMessage = errJson.detail;
      else if (errJson.message) errMessage = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return response.json();
}

export const api = {
  // System
  getHealth: () => request<SystemHealthResponse>('/system/health'),
  seedDatabase: (accounts = 2000, transactions = 30000, seed = 42) =>
    request<{ status: string; message: string }>(`/system/seed?accounts=${accounts}&transactions=${transactions}&seed=${seed}`, {
      method: 'POST'
    }),
  runPipeline: () => request<{ status: string; accounts_evaluated: number; alerts_generated: number }>('/system/run-pipeline', {
    method: 'POST'
  }),

  // Observe
  getSentinelSummary: () => request<SentinelSummary>('/observe/sentinel-summary'),
  getThreatStream: (params: { page?: number; limit?: number; account_id?: string; min_amount?: number; max_amount?: number; min_risk?: number; sort_by?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.account_id) q.append('account_id', params.account_id);
    if (params.min_amount) q.append('min_amount', params.min_amount.toString());
    if (params.max_amount) q.append('max_amount', params.max_amount.toString());
    if (params.min_risk !== undefined) q.append('min_risk', params.min_risk.toString());
    if (params.sort_by) q.append('sort_by', params.sort_by);
    return request<TransactionEnriched[]>(`/observe/threat-stream?${q.toString()}`);
  },

  // Trace
  getGraph: (params: { focus_account_id?: string; depth?: number; limit_nodes?: number; min_risk?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.focus_account_id) q.append('focus_account_id', params.focus_account_id);
    if (params.depth) q.append('depth', params.depth.toString());
    if (params.limit_nodes) q.append('limit_nodes', params.limit_nodes.toString());
    if (params.min_risk !== undefined) q.append('min_risk', params.min_risk.toString());
    return request<GraphDataResponse>(`/trace/graph?${q.toString()}`);
  },
  traceBFS: (req: BFSRequest) => request<BFSResponse>('/trace/bfs', {
    method: 'POST',
    body: JSON.stringify(req)
  }),
  getLineage: (tokenOrTxId: string) => request<LineageEvent[]>(`/trace/lineage/${encodeURIComponent(tokenOrTxId)}`),
  verifyLineage: (tokenId: string) => request<LineageVerifyResponse>('/trace/lineage/verify', {
    method: 'POST',
    body: JSON.stringify({ token_id: tokenId })
  }),
  runTamperTest: (tokenId: string, targetEventIndex = 2) => request<TamperTestResponse>('/trace/lineage/tamper-test', {
    method: 'POST',
    body: JSON.stringify({ token_id: tokenId, target_event_index: targetEventIndex })
  }),

  // Detect
  getAccountDossier: (accountId: string) => request<AccountDossier>(`/detect/account/${encodeURIComponent(accountId)}`),
  getModelObservatory: () => request<BenchmarkComparison>('/detect/models/observatory'),
  trainGraphSAGE: () => request<{ status: string; validation_f1: number }>('/detect/graphsage/train', { method: 'POST' }),
  runEvaluation: () => request<BenchmarkComparison>('/detect/evaluate', { method: 'POST' }),

  // Respond
  getAlerts: (params: { severity?: string; status?: string; account_id?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.severity) q.append('severity', params.severity);
    if (params.status) q.append('status', params.status);
    if (params.account_id) q.append('account_id', params.account_id);
    if (params.limit) q.append('limit', params.limit.toString());
    return request<Alert[]>(`/respond/alerts?${q.toString()}`);
  },
  getCases: () => request<Case[]>('/respond/cases'),
  getCaseDetail: (caseId: string) => request<Case>(`/respond/cases/${encodeURIComponent(caseId)}`),
  createCase: (caseIn: CaseCreate) => request<Case>('/respond/cases', {
    method: 'POST',
    body: JSON.stringify(caseIn)
  }),
  updateCase: (caseId: string, update: CaseUpdate) => request<Case>(`/respond/cases/${encodeURIComponent(caseId)}`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  }),
  getEvidenceVault: () => request<{ evidence_items: any[]; total_items: number }>('/respond/evidence-vault'),
  exportCasePackage: (caseId: string) => request<any>(`/respond/evidence-vault/export/${encodeURIComponent(caseId)}`),
  exportLineagePackage: (tokenId: string) => request<any>(`/respond/evidence-vault/export-lineage/${encodeURIComponent(tokenId)}`),
  getAuditLedger: (limit = 50) => request<AuditEvent[]>(`/respond/audit-ledger?limit=${limit}`),

  // Simulate & Replay
  getHeroReplay: () => request<HeroReplayStep[]>('/simulate/replay/hero'),
  simulateScenario: (scenarioType: string, seed = 42) => request<any>('/simulate/scenario', {
    method: 'POST',
    body: JSON.stringify({ scenario_type: scenarioType, seed })
  })
};
