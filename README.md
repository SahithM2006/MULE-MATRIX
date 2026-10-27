# MULE MATRIX

```
███╗   ███╗██╗   ██╗██╗     ███████╗    ███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗
████╗ ████║██║   ██║██║     ██╔════╝    ████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝
██╔████╔██║██║   ██║██║     █████╗      ██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ 
██║╚██╔╝██║██║   ██║██║     ██╔══╝      ██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ 
██║ ╚═╝ ██║╚██████╔╝███████╗███████╗    ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗
╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
```

> **"TRACE THE FLOW. EXPOSE THE NETWORK."**

MULE MATRIX is a full-stack cybersecurity threat-intelligence and financial fraud investigation prototype. It tracks e-rupee token provenance across complex transactional topologies, combines temporal graph analytics with inductive Graph Neural Networks (GraphSAGE) and unsupervised anomaly detection (Isolation Forest), verifies cryptographic SHA-256 hash chains, and orchestrates incident response workflows.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Data Layer [SQLite WAL Mode]
        DB[(mule_matrix.db)]
        ACCS[Accounts: 1,536]
        TXS[Transactions: 29,984]
        LIN[Lineage Events: 35]
        AUDIT[Audit Ledger: Hash Chained]
    end

    subgraph Core Engines [8 Integrated Algorithms]
        ALG1[1. Sliding-Window Temporal Velocity]
        ALG2[2. SHA-256 Hash Chained Lineage]
        ALG3[3. Time-Constrained BFS Traversal]
        ALG4[4. Graph Feature Extractor - 11 Metrics]
        ALG5[5. Rule-Based Heuristic Scorer]
        ALG6[6. Isolation Forest Anomaly Engine]
        ALG7[7. Seeded Louvain Modularity]
        ALG8[8. Inductive GraphSAGE GNN]
    end

    subgraph Decision Layer [Explainable Risk Aggregator]
        AGG[Risk Engine: 0-100 Score]
        EXPL[Plain-English Reason Synthesizer]
        BENCH[Benchmark Evaluator]
    end

    subgraph API Layer [FastAPI ASGI Backend]
        OBS_API[/api/v1/observe]
        TRC_API[/api/v1/trace]
        DET_API[/api/v1/detect]
        RSP_API[/api/v1/respond]
        SIM_API[/api/v1/simulate]
        SYS_API[/api/v1/system]
    end

    subgraph Presentation Layer [React 19 + TypeScript + Vanilla CSS]
        STG1[1. OBSERVE: Sentinel Command & Threat Stream]
        STG2[2. TRACE: Attack Graph & Token Forensics]
        STG3[3. DETECT: Detection Lab & Model Observatory]
        STG4[4. RESPOND: Incident Response & Evidence Vault]
        STG5[UTILITIES: Hero Replay & Scenario Simulator]
    end

    DB --> ALG1 & ALG2 & ALG3 & ALG4
    ALG4 --> ALG5 & ALG6 & ALG7 & ALG8
    ALG5 & ALG6 & ALG7 & ALG8 --> AGG
    AGG --> EXPL --> BENCH
    AGG & EXPL --> OBS_API & TRC_API & DET_API & RSP_API
    OBS_API & TRC_API & DET_API & RSP_API & SIM_API & SYS_API --> STG1 & STG2 & STG3 & STG4 & STG5
```

---

## 2. The 8 Algorithms in Detail

### Algorithm 1: Sliding-Window Temporal Velocity Analysis
- **Implementation**: [`backend/app/engines/sliding_window.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/sliding_window.py)
- **Mathematical Principle**: Bounded temporal range aggregation over transactions $T$ within sliding windows $\Delta t \in \{10\text{m}, 1\text{h}, 24\text{h}\}$.
- **Outputs**:
  - `burst_velocity_score`: High-frequency transactional bursts in short intervals.
  - `rapid_passthrough`: Detects intermediate accounts receiving funds and forwarding $>90\%$ downstream within $<10$ minutes ($T_{\text{out}} - T_{\text{in}} \le 600\text{s}$).

### Algorithm 2: SHA-256 Hash Chaining Token Lineage
- **Implementation**: [`backend/app/engines/lineage_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/lineage_engine.py)
- **Mathematical Principle**: RFC 8785 canonical JSON serialization with cryptographic pointer linking:
  $$H_i = \text{SHA256}(\text{CanonicalJSON}(E_i) \parallel H_{i-1})$$
- **Outputs**:
  - Continuous forward and backward pointer verification ($H_{\text{prev}} = \text{parent\_hash}$).
  - Isolated tamper-test engine demonstrating zero false-acceptance upon record mutation.

### Algorithm 3: Time-Constrained Breadth-First Search (BFS)
- **Implementation**: [`backend/app/engines/bfs_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/bfs_engine.py)
- **Mathematical Principle**: Directed acyclic temporal traversal enforcing monotonic timestamp order $t_1 \le t_2 \le \dots \le t_k$ across $k \le 6$ hops.
- **Outputs**:
  - Cycle suppression prevents infinite loops in dense mule communities.
  - Returns complete flow paths from origin accounts to terminal cash-out destinations.

### Algorithm 4: Tabular Graph Feature Extraction
- **Implementation**: [`backend/app/engines/feature_extractor.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/feature_extractor.py)
- **Mathematical Principle**: Extracts an 11-dimensional feature vector for every node $v \in V$:
  1. `in_degree`: Inbound transaction count.
  2. `out_degree`: Outbound transaction count.
  3. `degree_ratio`: $\frac{\text{in\_degree} + 1}{\text{out\_degree} + 1}$.
  4. `weighted_inflow`: Total currency deposited.
  5. `weighted_outflow`: Total currency transferred out.
  6. `fan_in_ratio`: Fractional concentration of inbound funds.
  7. `fan_out_ratio`: Fractional concentration of outbound funds.
  8. `clustering_coefficient`: Local graph density $C(v)$.
  9. `connected_component_size`: Size of weakly connected sub-cluster.
  10. `transaction_velocity`: Total transaction events per active hour.
  11. `pass_through_ratio`: Outflow / Inflow ratio.

### Algorithm 5: Rule-Based Heuristic Scorer
- **Implementation**: [`backend/app/engines/rule_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/rule_engine.py)
- **Mathematical Principle**: Evaluates 4 deterministic threat rules:
  - `RULE_RAPID_PASSTHROUGH`: Holding delta $\le 10$m and pass-through $\ge 90\%$.
  - `RULE_SMURFING_FANIN`: In-degree $\ge 4$, avg inflow $< ₹50,000$, quick aggregation.
  - `RULE_BURST_VELOCITY`: Inbound burst count $\ge 3$ within a 10m window.
  - `RULE_MULE_HOP_POSITION`: Node serves as intermediate bridge with both inbound and outbound links.
- **Outputs**: Normalized heuristic score $\in [0, 1]$ and triggered rule codes.

### Algorithm 6: Isolation Forest Anomaly Detection
- **Implementation**: [`backend/app/engines/isolation_forest_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/isolation_forest_engine.py)
- **Mathematical Principle**: Ensembles of random recursive partitioning trees. Anomaly score:
  $$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
- **Explainability**: Computes top-3 contributing feature perturbations compared against population median and interquartile range (IQR).

### Algorithm 7: Seeded Louvain Community Modularity
- **Implementation**: [`backend/app/engines/louvain_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/louvain_engine.py)
- **Mathematical Principle**: Maximizes modularity $Q$ with a fixed pseudo-random seed and canonical node sorting for strict determinism:
  $$Q = \frac{1}{2m} \sum_{ij} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)$$
- **Outputs**: Community ID, cluster size, intra-cluster density, and mule ring membership flags.

### Algorithm 8: 2-Layer Inductive GraphSAGE Neural Network
- **Implementation**: [`backend/app/engines/graphsage_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/graphsage_engine.py)
- **Mathematical Principle**: Inductive representation learning over graph neighborhoods (Hamilton et al., 2017) using mean aggregation:
  $$h_{\mathcal{N}(v)}^{(k)} = \text{MEAN}\left(\{h_u^{(k-1)}, \forall u \in \mathcal{N}(v)\}\right)$$
  $$h_v^{(k)} = \sigma\left(W^{(k)} \cdot \left[h_v^{(k-1)} \parallel h_{\mathcal{N}(v)}^{(k)}\right]\right)$$
- **Training Protocol**: Leakage-free scenario partitioning, binary cross-entropy with `pos_weight` balancing, and artifact persistence to `backend/artifacts/graphsage_v1.pt`.

---

## 3. Explainable Risk Aggregator

The Risk Aggregation Engine ([`backend/app/engines/risk_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/risk_engine.py)) synthesizes signals across all active algorithms into a single calibrated $[0, 100]$ score.

- **Signal Deduplication**: Merges overlapping indicators (e.g. burst velocity and high transaction rate) into a single unified severity score to avoid double-counting.
- **Dynamic Weight Renormalization**: If an engine is uninitialized (such as GraphSAGE prior to training), weights renormalize over active components:
  $$W_{\text{active}} = \sum_{e \in E_{\text{active}}} w_e, \quad \tilde{w}_e = \frac{w_e}{W_{\text{active}}}$$
- **Plain-English Reason Synthesizer**: Formulates plain-language justification sentences explaining exactly why an account was flagged (e.g. *"Account held ₹248,000 for 5 minutes before transferring 99.2% downstream to intermediate collector hub."*).

---

## 4. Empirical Synthetic Benchmark Results

Evaluated on held-out synthetic test topologies ([`backend/artifacts/benchmark_results.json`](file:///c:/PRIVATE/MULE%20MATRIX/backend/artifacts/benchmark_results.json)):

| Evaluation Metric | Rules-Only Baseline | Combined Advanced Pipeline | Absolute Improvement |
| :--- | :---: | :---: | :---: |
| **Precision** | 1.000 (100.0%) | 0.825 (82.5%) | Calibrated |
| **Recall** | 0.170 (17.0%) | **0.739 (73.9%)** | **+56.9%** |
| **F1-Score** | 0.291 (29.1%) | **0.779 (77.9%)** | **+167.9% Relative Gain** |
| **False Positive Rate (FPR)** | 0.000 (0.0%) | 0.024 (2.4%) | Under 3% constraint |
| **True Positives** | 16 | **69** | +53 additional mules detected |
| **False Negatives** | 78 | **24** | 69.2% reduction in missed mules |
| **Dataset Time Latency** | 0.083s | 0.134s | Sub-second evaluation |
| **Processing Latency** | 83.1ms | 134.2ms | Real-time response |

---

## 5. Threat Lifecycle Navigation (Frontend)

The user interface is engineered with a bespoke dark cybersecurity design system (Obsidian `#080A0F`, Deep Charcoal `#111722`, Muted Gold `#C6A45A`, Steel Blue `#7596C8`, Critical Red `#E05252`).

1. **1. OBSERVE**:
   - **Sentinel Command**: Real-time KPI radar, suspicious network counters, e-rupee volume tracking, and triage queue.
   - **Threat Stream**: Searchable, filterable transaction log with risk scores and algorithm flags.
2. **2. TRACE**:
   - **Attack Graph**: Interactive Vis-Network temporal canvas with directional flow arcs, Louvain community coloring, and side-panel node inspector.
   - **Token Forensics**: Step-by-step SHA-256 token provenance chain, canonical hash receipt validation, and live tamper-testing sandbox.
3. **3. DETECT**:
   - **Detection Lab**: Unified account dossier showing 11 tabular features, rule triggers, Isolation Forest perturbation breakdown, and GraphSAGE inference.
   - **Model Observatory**: Live side-by-side metric comparison between heuristic baseline and full multi-engine pipeline.
4. **4. RESPOND**:
   - **Incident Response**: Case management workflow, status updates (NEW -> INVESTIGATING -> ESCALATED -> CLOSED), analyst notes, and pre-conversion review warnings.
   - **Evidence Vault**: Searchable catalog of cryptographic evidence items with one-click export of RFC 8785 JSON dossiers sealed with SHA-256 digital signatures.
   - **Audit Ledger**: Continuous append-only forensic event chain displaying previous and current integrity hashes.
5. **UTILITIES**:
   - **Scenario Simulator**: Interactive generator for Smurfing, Rapid Pass-Through, Layering, Mule Rings, Merchant Fan-in, and Payroll Fan-out.
   - **Hero Replay**: 9-step chronological walkthrough tracing the victim phishing attack to final cash-out attempt.
   - **System Health**: Diagnostic telemetry and one-click controls to re-seed data, run pipelines, and retrain models.

---

## 6. Single-Command Quickstart Guide

### Prerequisites
- Python 3.10+ (PyTorch 2.0+ compatible)
- Node.js 18+ & npm

### Setup Environment
```bash
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Install frontend dependencies
cd frontend
npm install
cd ..
```

### Seed Database & Train Neural Model
```bash
# Seed 1,536 accounts, 29,984 transactions, and deterministic Hero Scenario
python backend/seed.py

# Train 2-Layer Inductive GraphSAGE Neural Network
python -c "from backend.app.engines.graphsage_engine import graphsage_engine; print(graphsage_engine.train_model())"

# Execute Empirical Benchmark Evaluation
python backend/app/evaluation/benchmark.py
```

### Run Full Test Suite
```bash
# Run all 44 automated unit and integration tests
python -m pytest backend/tests -v
```

### Start Servers
```bash
# Terminal 1: Launch FastAPI Backend Server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Launch React Frontend Dev Server
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open your browser to: **`http://127.0.0.1:5173/`**

---

## 7. Deterministic Hero Scenario Entities

The test dataset includes an end-to-end verified attack chain that can be traced across the entire application:

- **Victim Account**: `ACC_HERO_VICTIM_001`
- **Mule Layer 1 (A)**: `ACC_HERO_MULE_L1_A`
- **Mule Layer 1 (B)**: `ACC_HERO_MULE_L1_B`
- **Collector Mule Hub (L2)**: `ACC_HERO_MULE_L2_CONVERGE`
- **Terminal Cash-Out**: `ACC_HERO_CASHOUT_DEST_999`
- **Genesis Token ID**: `TOKR_HERO_500K_GENESIS`

---

## 8. Compliance & Disclaimer

MULE MATRIX is an academic and technical research prototype. All accounts, transactions, names, and identifiers are procedurally synthesized. No genuine banking records or personal identifiable information (PII) are stored or accessed.
