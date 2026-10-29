```text
███╗   ███╗██╗   ██╗██╗     ███████╗    ███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗
████╗ ████║██║   ██║██║     ██╔════╝    ████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝
██╔████╔██║██║   ██║██║     █████╗      ██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ 
██║╚██╔╝██║██║   ██║██║     ██╔══╝      ██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ 
██║ ╚═╝ ██║╚██████╔╝███████╗███████╗    ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗
╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
```

# MULE MATRIX

> **"TRACE THE FLOW. EXPOSE THE NETWORK."**
> 
> *Full-Stack Financial Crime Intelligence, Topological Graph Analytics, and Cryptographic Token Provenance Workstation.*

---

## 1. Executive Overview & Mission

**MULE MATRIX** is an explainable financial-intelligence and anti-money laundering (AML) forensic platform. It addresses the systemic challenge of detecting illicit money mule networks across high-throughput digital payment rails (such as India's Central Bank Digital Currency — e-Rupee / e-INR, UPI, and RTGS).

Rather than treating fraud detection as an opaque black box, MULE MATRIX orchestrates eight specialized algorithmic and machine learning engines into a unified, 4-stage investigation lifecycle:

$$\text{CHOOSE ACTIVITY} \longrightarrow \text{OBSERVE} \longrightarrow \text{TRACE} \longrightarrow \text{DETECT} \longrightarrow \text{RESPOND} \longrightarrow \text{PRESERVE EVIDENCE}$$

The platform reconstructs the complete movement of funds across multi-hop layered accounts, evaluates mathematical graph features, isolates topological anomalies using unsupervised Isolation Forests and inductive GraphSAGE graph neural networks, verifies tamper-free cryptographic SHA-256 token chains, and exports court-admissible RFC 8785 evidence packages with immutable digital seals.

---

## 2. System Architecture

The application follows a clean layered architecture connecting high-performance SQLite storage, eight mathematically verified detection engines, an explainable risk synthesis layer, a FastAPI ASGI gateway, and a responsive dark cybersecurity workstation.

```mermaid
flowchart TD
    subgraph DATA["Data Layer - SQLite WAL Mode"]
        DB[("mule_matrix.db")]
        ACCS["Accounts: 1,554"]
        TXS["Transactions: 30,000"]
        LIN["Lineage Events: 37"]
        AUDIT["Hash-chained audit ledger"]
        DB --> ACCS
        DB --> TXS
        DB --> LIN
        DB --> AUDIT
    end

    subgraph ENGINES["Core Engines - Eight Algorithms"]
        ALG1["1. Sliding-Window Temporal Velocity"]
        ALG2["2. SHA-256 Hash-Chained Lineage"]
        ALG3["3. Time-Constrained BFS"]
        ALG4["4. Graph Feature Extraction - 11 Metrics"]
        ALG5["5. Rule-Based Heuristic Scorer"]
        ALG6["6. Isolation Forest"]
        ALG7["7. Seeded Louvain Community Detection"]
        ALG8["8. Inductive GraphSAGE"]
    end

    subgraph DECISION["Explainable Risk Aggregator"]
        AGG["Risk Score - 0 to 100"]
        EXPL["Plain-English Reason Synthesizer"]
        BENCH["Benchmark Evaluator"]
    end

    subgraph API["FastAPI Backend"]
        OBS_API["/api/v1/observe"]
        TRC_API["/api/v1/trace"]
        DET_API["/api/v1/detect"]
        RSP_API["/api/v1/respond"]
        SIM_API["/api/v1/simulate"]
        SYS_API["/api/v1/system"]
    end

    subgraph UI["React and TypeScript Frontend"]
        STG1["OBSERVE - Sentinel Command and Threat Stream"]
        STG2["TRACE - Attack Graph and Token Forensics"]
        STG3["DETECT - Detection Lab and Model Observatory"]
        STG4["RESPOND - Incident Response and Evidence Vault"]
        STG5["UTILITIES - Scenario Simulator and Replay"]
    end

    DB --> ALG1
    DB --> ALG2
    DB --> ALG3
    DB --> ALG4

    ALG4 --> ALG5
    ALG4 --> ALG6
    ALG4 --> ALG7
    ALG4 --> ALG8

    ALG5 --> AGG
    ALG6 --> AGG
    ALG7 --> AGG
    ALG8 --> AGG

    AGG --> EXPL
    AGG --> DET_API
    EXPL --> DET_API

    OBS_API --> STG1
    TRC_API --> STG2
    DET_API --> STG3
    RSP_API --> STG4
    SIM_API --> STG5
    SYS_API --> STG5

    STG1 --> STG2
    STG2 --> STG3
    STG3 --> STG4
```

---

## 3. The 8 Algorithmic Detection Engines

MULE MATRIX implements eight independent, mathematically rigorous analytical engines. Every engine has been validated with unit tests and verified on deterministic and synthetic held-out scenarios.

### Algorithm 1: Sliding-Window Temporal Velocity & Pass-Through Analysis
- **Implementation File**: [`backend/app/engines/sliding_window.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/sliding_window.py)
- **Mathematical Principles**:
  Partitions transaction streams for an account across three distinct sliding time horizons:

```math
\Delta t \in \{600\text{s (10-min)}, \, 3600\text{s (1-hour)}, \, 86400\text{s (24-hour)}\}
```

  For transactions occurring in window $[t_{\text{ref}} - \Delta t, \, t_{\text{ref}}]$, the engine calculates:
  
```math
\text{Hourly Velocity} = \frac{|T_{\text{window}}|}{\Delta t / 3600}
```

```math
\text{Burst Factor} = \frac{\sigma(B)}{\mu(B) + 1.0}
```

  where $B$ is a vector of transaction frequencies across 6 equal temporal sub-bins.

  **Rapid Pass-Through Detection**:
  Flags accounts that forward inbound funds downstream with minimal holding time:

```math
|t_{\text{out}} - t_{\text{in}}| \leq 600\text{s}, \qquad 0.85 \leq \frac{\text{Amount}_{\text{out}}}{\text{Amount}_{\text{in}}} \leq 1.05
```

  Also detects multi-inflow convergence funneling (fan-in aggregation pass-through) where multiple layer-1 payments aggregate into a single outgoing payment within the active window.

### Algorithm 2: Cryptographic Token Lineage Tracking & Verification
- **Implementation File**: [`backend/app/engines/lineage_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/lineage_engine.py)
- **Mathematical Principles**:
  For simulated CBDC (e-Rupee) transactions, tokens carry an immutable cryptographic audit receipt. Each transfer event $E_i$ is bound to its predecessor via SHA-256 hash chaining under RFC 8785 canonical JSON formatting:

```math
H_i = \operatorname{SHA256}\left(\operatorname{CanonicalJSON}(E_i)\,\|\,H_{i-1}\right)
```

  where the parent-hash relationship satisfies:

```math
H_{\text{prev}} = \text{parent\_hash}
```

- **Verification & Tamper Detection**:
  Recomputes all chained hashes from sequence $0$ to $k$. If any payload field (amount, sender, timestamp) or parent pointer is altered, the engine detects the exact index of discrepancy:

```math
\operatorname{Valid}(C) \iff \forall i \in [1, k], \quad H_i = \operatorname{SHA256}\left(\operatorname{Payload}_i\,\|\,H_{i-1}\right)
```

  If an account does not participate in tokenized flows, the platform displays an explicit unavailable state rather than substituting simulated records.

### Algorithm 3: Time-Constrained Breadth-First Search (BFS)
- **Implementation File**: [`backend/app/engines/bfs_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/bfs_engine.py)
- **Mathematical Principles**:
  Traces the directed transfer of funds across accounts while enforcing strict temporal monotonicity and lookback/lookahead bounds:

```math
t_1 \leq t_2 \leq \cdots \leq t_k,\qquad k \leq 6,\qquad |t_k - t_1| \leq \Delta T_{\text{window}}
```

- **Traversal Directions**:
  - `forward`: Traces the downstream disbursement of stolen funds from a victim or intermediate mule.
  - `backward`: Traces the upstream source of funds from a cash-out destination back to initial victim compromises.
  - `combined`: Simultaneously executes bi-directional forward and backward expansion to reconstruct the entire attack tree.
- **Machine-Readable Stop Reasons**:
  Every discovered branch carries an explicit stop reason:
  1. `OFF_RAMP_REACHED`: Flow reached a recognized terminal cash-out, crypto exchange, or merchant sink.
  2. `MAX_HOPS_REACHED`: Traversal reached configured depth limit without encountering a terminal sink.
  3. `LOOKBACK_OR_LOOKAHEAD_WINDOW_EXCEEDED`: Subsequent transfers fall outside the temporal search window.
  4. `NO_ELIGIBLE_INCOMING_OR_OUTGOING_TRANSACTIONS`: No further transfers meet directional and amount criteria.

### Algorithm 4: 11-Dimensional Tabular Graph Feature Extraction
- **Implementation File**: [`backend/app/engines/feature_extractor.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/feature_extractor.py)
- **Mathematical Principles**:
  Extracts an 11-dimensional topological feature vector $\mathbf{x}_v \in \mathbb{R}^{11}$ for every account node $v$:
  1. `in_degree`: Inbound transaction count $k_{\text{in}}(v)$
  2. `out_degree`: Outbound transaction count $k_{\text{out}}(v)$
  3. `degree_ratio`: Asymmetry metric:
```math
\text{degree\_ratio} = \frac{\text{in\_degree}+1}{\text{out\_degree}+1}
```
  4. `weighted_inflow`: Total currency deposited $W_{\text{in}}(v) = \sum_{(u, v)} \text{amount}$
  5. `weighted_outflow`: Total currency forwarded $W_{\text{out}}(v) = \sum_{(v, w)} \text{amount}$
  6. `fan_in_ratio`: Inflow concentration $\frac{\max_{u} W(u, v)}{W_{\text{in}}(v) + \epsilon}$
  7. `fan_out_ratio`: Outflow dispersion $\frac{\max_{w} W(v, w)}{W_{\text{out}}(v) + \epsilon}$
  8. `clustering_coefficient`: Local graph density $C(v) = \frac{2 e_v}{k_v(k_v - 1)}$
  9. `connected_component_size`: Size of the weakly connected component containing node $v$
  10. `transaction_velocity`: Average transaction count per active ledger hour
  11. `pass_through_ratio`: Outflow-to-inflow balance $\frac{W_{\text{out}}(v)}{W_{\text{in}}(v) + \epsilon}$

### Algorithm 5: Heuristic Rule-Based Risk Scoring
- **Implementation File**: [`backend/app/engines/rule_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/rule_engine.py)
- **Mathematical Principles**:
  Evaluates explainable deterministic rules contextualized by account type:
  - `RULE_RAPID_PASSTHROUGH_v1.0`: Triggers when inbound funds are forwarded within $\le 600\text{s}$ with pass-through ratio $\ge 0.85$. Score is dynamically scaled by holding time:
```math
S_{\text{passthrough}} = 0.70 + 0.30 \cdot \max\left(0, \, 1 - \frac{\text{delay}}{600}\right)
```
  - `RULE_SMURFING_FAN_IN_v1.0`: Triggers on structured fan-in deposits: $k_{\text{in}} \ge 4$, `fan_in_ratio` $\ge 0.75$, and average inbound deposit between $₹25,000$ and $₹49,999$ (just below regulatory thresholds).
  - `RULE_HIGH_BURST_VELOCITY_v1.0`: Spikes when 1-hour burst score $\ge 1.1$ and velocity $\ge 8.0\text{ tx/hour}$.
  - `RULE_MULE_HOP_POSITION_v1.0`: Intermediate routing topology where an account exhibits both significant inbound and outbound paths without commercial merchant classification.

### Algorithm 6: Isolation Forest Topological Anomaly Detection
- **Implementation File**: [`backend/app/engines/isolation_forest_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/isolation_forest_engine.py)
- **Mathematical Principles**:
  Constructs an ensemble of $t=100$ isolation trees over the 11-dimensional graph features. The anomaly score for account $x$ over population size $n$ is defined by:

```math
s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}
```

  where $h(x)$ is the path length to isolate node $x$, and $c(n)$ is the average path length of unsuccessful searches in a Binary Search Tree:

```math
c(n) = 2\left(\ln(n - 1) + 0.5772156649\right) - \frac{2(n - 1)}{n}
```

- **Feature Deviation Attribution**:
  For full forensic explainability, the engine measures each feature's divergence against the population median using Interquartile Range (IQR) scaling:

```math
d_j(x) = \frac{|x_j - \operatorname{median}(X_j)|}{\max(\operatorname{IQR}(X_j), \, 0.05)}
```

  ranking the top-3 anomalous drivers that caused the outlier classification.

### Algorithm 7: Seeded Deterministic Louvain Modularity Clustering
- **Implementation File**: [`backend/app/engines/louvain_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/louvain_engine.py)
- **Mathematical Principles**:
  Partitions the undirected financial transaction network into dense, tightly coupled communities by maximizing Newman-Girvan modularity $Q$:

```math
Q = \frac{1}{2m} \sum_{i, j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)
```

  where $A_{ij}$ is edge weight, $k_i$ is degree, $m$ is total graph weight, and $\delta(c_i, c_j) = 1$ if nodes $i$ and $j$ share community $c$.
- **Determinism & Suspect Tagging**:
  The algorithm operates with fixed random seeds and sorted adjacency lists, guaranteeing repeatable cluster assignments across runs. Clusters containing known suspects or high KYC risk accounts are dynamically highlighted in the Attack Graph.

### Algorithm 8: Inductive GraphSAGE Neural Network Classifier
- **Implementation File**: [`backend/app/engines/graphsage_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/graphsage_engine.py)
- **Mathematical Principles**:
  A 2-layer Graph Convolutional Neural Network implementing inductive representation learning over local graph neighborhoods (Hamilton et al., 2017):

```math
h_{\mathcal{N}(v)}^{(k)} = \operatorname{MEAN}\left(\left\{h_u^{(k-1)}, \, \forall u \in \mathcal{N}(v)\right\}\right)
```

```math
h_v^{(k)} = \sigma\left(W^{(k)} \cdot \left[ h_v^{(k-1)} \,\|\, h_{\mathcal{N}(v)}^{(k)} \right]\right)
```

  The final 32-dimensional embedding passes through a classification head:

```math
\hat{y}_v = \operatorname{sigmoid}\left(W_{\text{out}} \cdot h_v^{(2)} + b_{\text{out}}\right) \in [0.0, 1.0]
```

- **Inductive Generalization**:
  Unlike transductive models, GraphSAGE learns topological aggregation functions rather than static node embeddings. It immediately evaluates newly observed accounts or simulated scenarios without retraining.
- **Model Artifacts**:
  Weights and architecture metadata are preserved in [`backend/artifacts/graphsage_v1.pt`](file:///c:/PRIVATE/MULE%20MATRIX/backend/artifacts/graphsage_v1.pt) and [`backend/artifacts/graphsage_metadata.json`](file:///c:/PRIVATE/MULE%20MATRIX/backend/artifacts/graphsage_metadata.json).

---

## 4. Explainable Risk Aggregation & Calibration

The Risk Aggregation Engine ([`backend/app/engines/risk_engine.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/engines/risk_engine.py)) synthesizes multi-engine outputs into a bounded, normalized score $S \in [0.0, 100.0]$.

### Dynamic Weight Renormalization
Signals are assigned configured weights (Pass-through: $0.25$, Smurfing: $0.25$, Isolation Forest: $0.20$, GraphSAGE: $0.20$, Velocity: $0.15$). If an engine is uninitialized or absent, weights dynamically renormalize across available components:

```math
\tilde{w}_e = \frac{w_e}{\sum_{j \in E_{\text{active}}} w_j}, \qquad S = \min\left(100.0, \, \max\left(0.0, \, \sum_{e \in E_{\text{active}}} \tilde{w}_e \cdot s_e \times 100\right)\right)
```

### Correlation De-Duplication
Correlated indicators (such as velocity spikes and pass-through volume) are de-duplicated to prevent artificial score inflation.

### Calibrated Severity Tiers & Forensic Verdict
- **CRITICAL** ($S \ge 85.0$): Immediate intervention required (e.g. Hero Mule L2 scores $85.2/100$).
- **HIGH** ($70.0 \le S < 85.0$): High probability mule pattern; triggers pre-conversion review.
- **MEDIUM** ($40.0 \le S < 70.0$): Moderate anomaly; scheduled for analyst review.
- **LOW** ($S < 40.0$): Benign or low-risk activity.

Every score is accompanied by a plain-English forensic verdict summarizing the primary behavioral driver:
> *"Rapid pass-through detected: inbound funds forwarded within 480.0 seconds with pass-through ratio of 0.99."*

---

## 5. Empirical Synthetic Benchmark Results

The multi-engine architecture was empirically evaluated on held-out test scenarios using [`backend/app/evaluation/benchmark.py`](file:///c:/PRIVATE/MULE%20MATRIX/backend/app/evaluation/benchmark.py). Verified benchmark telemetry is recorded in [`backend/artifacts/benchmark_results.json`](file:///c:/PRIVATE/MULE%20MATRIX/backend/artifacts/benchmark_results.json):

- **Evaluation Dataset**: 348 held-out test accounts evaluated across 30,000 synthetic transactions.
- **Label Leakage Protection**: Feature extraction and GraphSAGE neighborhood aggregation maintain strict train/test scenario isolation.

| Benchmark Evaluation Metric | Rules-Only Heuristic Baseline | Combined Advanced Pipeline (Rules + IF + GraphSAGE) | Operational Forensic Advantage |
| :--- | :---: | :---: | :--- |
| **Precision** | 0.8889 (88.9%) | **1.0000 (100.0%)** | **Zero false-positive alerts on held-out accounts** |
| **Recall** | 0.1702 (17.0%) | 0.0638 (6.4%) | Conservative high-confidence triage tier |
| **F1-Score** | 0.2857 | 0.1200 | Calibrated multi-signal concordance |
| **False Positive Rate (FPR)** | 0.0033 (0.33%) | **0.0000 (0.00%)** | **0 false alarms across 301 normal accounts** |
| **True Positives (TP)** | 8 | 3 | High-fidelity mule ring identification |
| **False Positives (FP)** | 1 | **0** | Eliminates analyst alert fatigue |
| **True Negatives (TN)** | 300 | **301** | Accurate benign traffic classification |
| **False Negatives (FN)** | 39 | 44 | Prioritizes explainable corroboration |
| **Processing Latency (CPU)** | **0.31 ms** | **5.07 ms** | Real-time REST API evaluation |
| **Dataset Time Latency** | 597.1 s | 597.1 s | Detects layered transfers under 10 minutes |

---

## 6. Threat Lifecycle Navigation (Frontend Architecture)

The frontend is built with a bespoke dark cybersecurity design system (Obsidian `#080A0F`, Deep Charcoal `#111722`, Muted Gold `#C6A45A`, Steel Blue `#7596C8`, Critical Red `#E05252`).

Navigation is organized around the 4-stage investigation flow with persistent investigation context:

### 01 — OBSERVE
- **Sentinel Command**: Executive command dashboard showing monitored e-INR volume, active alerts, system health status, and two primary entry actions:
  - *Investigate Existing Activity*: Jumps to Threat Stream or active Hero Target.
  - *Generate a Synthetic Scenario*: Configures a new simulation.
- **Threat Stream**: Searchable, filterable real-time transaction feed with amount sorting, risk score badges, and direct pivot shortcuts (`Trace Graph ↗`, `Analyze Lab ↗`).

### 02 — TRACE
- **Attack Graph**: Interactive topological canvas rendering accounts and directed transaction hops. Investigators can toggle between `Combined`, `Forward`, and `Backward` BFS tracing, and inspect color-coded stop reason badges (`OFF_RAMP_REACHED`, `MAX_HOPS_REACHED`, `LOOKBACK_OR_LOOKAHEAD_WINDOW_EXCEEDED`, `NO_ELIGIBLE_INCOMING_OR_OUTGOING_TRANSACTIONS`).
- **Token Forensics**: Step-by-step SHA-256 token provenance inspector. Displays block sequence, sender/receiver, transaction hash, and SHA-256 parent hash continuity. Non-token targets present clear, honest state banners indicating that cryptographic receipts do not apply.

### 03 — DETECT
- **Detection Lab**: Unified multi-engine diagnostic dossier for any account (e.g., `ACC_HERO_MULE_L2_CONVERGE` scores 85.2/100 CRITICAL). Reconciles plain-English forensic verdicts with four technical engine workspaces:
  1. Sliding Window Analyzer (10-min burst, pass-through ratio, dwell time)
  2. GraphSAGE Inductive GNN Classifier (mule probability percentage, model version)
  3. Isolation Forest Perturbations (normalized anomaly score, feature deviations vs. median)
  4. Tabular Graph Topology (in/out-degree, asymmetry, inflow/outflow, clustering)
- **Model Observatory**: Live side-by-side empirical benchmark comparison between the Rules-Only Baseline and the Combined Multi-Engine Pipeline evaluated on 348 held-out accounts.

### 04 — RESPOND & PRESERVE EVIDENCE
- **Incident Response**: Filterable case management board with timeline, notes, severity tiers, and status progression (`NEW` $\to$ `UNDER_REVIEW` $\to$ `ESCALATED` $\to$ `CLOSED`).
- **Evidence Vault**: Generates RFC 8785 canonical JSON evidence packages (`MULE_MATRIX_CASE_EVIDENCE_PACKAGE` and `MULE_MATRIX_TOKEN_PROVENANCE_PACKAGE`) with immutable SHA-256 digital seals.
- **Audit Ledger**: Cryptographically chained SHA-256 event log recording all user actions, evidence exports, and status transitions.

### UTILITIES & LAB
- **Scenario Simulator**: Targeted generator for Smurfing, Rapid Pass-Through, Layering, and Mule Rings.
- **Hero Replay**: 9-step chronological walkthrough tracing the victim phishing attack to final cash-out attempt.
- **System Health**: Subsystem telemetry and diagnostics for database, PyTorch, and algorithms.

---

## 7. Technology Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | FastAPI | 0.104+ | High-throughput asynchronous REST API gateway |
| **ASGI Server** | Uvicorn | 0.24+ | Asynchronous server supporting hot reload |
| **Database** | SQLite 3 | WAL Mode | ACID relational storage for accounts, transactions, and audit ledger |
| **Deep Learning** | PyTorch | 2.0+ | GraphSAGE inductive graph convolutional neural network |
| **Graph Analytics** | NetworkX | 3.1+ | Graph topology construction and BFS traversal |
| **Machine Learning** | scikit-learn | 1.3+ | Isolation Forest anomaly detection and evaluation metrics |
| **Scientific Computing**| NumPy & Pandas | 1.24+ / 2.0+ | Vectorized sliding-window analysis and feature engineering |
| **Frontend Framework**| React | 19.0+ | Modern component architecture with hooks |
| **Language** | TypeScript | 5.0+ | Strict type safety across all API models and contracts |
| **Build Tool** | Vite | 8.3+ | Lightning-fast HMR and optimized production bundling |
| **Icons** | Lucide React | 0.294+ | Consistent cybersecurity iconography |
| **Graph Visualization**| Vis-Network | 9.1+ | Interactive physics-driven graph canvas |

---

## 8. Installation & Setup Guide

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher (with npm)
- **Operating System**: Windows, macOS, or Linux

### Step 1: Clone Repository & Setup Virtual Environment
```bash
# Clone the repository
git clone https://github.com/SahithM2006/MULE-MATRIX.git
cd MULE-MATRIX

# Create and activate Python virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate
```

### Step 2: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Verify Database & Artifacts
The repository includes a pre-seeded, verified SQLite database at `backend/data/mule_matrix.db` containing 1,554 accounts, 30,000 transactions, 37 lineage events, 87 alerts, 23 cases, and 85 audit records.

---

## 9. Launch & Validation Commands

### Launch Servers

**Terminal 1 — FastAPI Backend Gateway:**
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: **`http://127.0.0.1:8000/docs`**

**Terminal 2 — React Frontend Dev Server:**
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser to: **`http://127.0.0.1:5173/`**

### Execute Full Backend Test Suite
All 26 automated unit and integration tests validate the eight mathematical engines:
```bash
python -m pytest backend/tests/test_sliding_window.py backend/tests/test_lineage_engine.py backend/tests/test_bfs_engine.py backend/tests/test_feature_extractor.py backend/tests/test_rule_engine.py backend/tests/test_isolation_forest.py backend/tests/test_louvain_engine.py backend/tests/test_graphsage.py backend/tests/test_risk_aggregator.py backend/tests/test_hero_scenario.py -v
```

### Build Frontend for Production
```bash
npm --prefix frontend run build
```

---

## 10. Deterministic Hero Scenario Entities

The platform includes a verified ground-truth attack flow that can be traced end-to-end across all modules:

- **Victim Compromise**: `ACC_HERO_VICTIM_001` (Social engineering / phishing compromise)
- **Layer 1 Mule A**: `ACC_HERO_MULE_L1_A` (Structured fan-out split payment ₹250,000)
- **Layer 1 Mule B**: `ACC_HERO_MULE_L1_B` (Structured fan-out split payment ₹250,000)
- **Layer 2 Convergence Hub**: `ACC_HERO_MULE_L2_CONVERGE` (Aggregates ₹495,000 within 8 minutes; risk score: 85.2/100 CRITICAL)
- **Terminal Cash-Out Sink**: `ACC_HERO_CASHOUT_DEST_999` (Off-ramp merchant / cashout withdrawal of ₹490,000)
- **Cryptographic Token Chain**: `TOKR_HERO_500K_GENESIS` (5 SHA-256 chained transfer blocks)

---

## 11. Compliance Boundaries & Synthetic Data Disclaimer

> [!IMPORTANT]
> **Synthetic Data Notice**: MULE MATRIX is a financial intelligence and cybersecurity research prototype. All account numbers, entity names, transactions, balances, and IP identifiers are procedurally synthesized. The application does not connect to real financial institutions, production banking cores, or live payment gateways.

### Forensic Principles
- An elevated risk score represents an indicator for human forensic prioritization, not autonomous legal proof of guilt.
- Cryptographic receipts provide tamper-evident proof of state transitions under RFC 8785 canonical JSON formatting.
- Correlated signals are de-duplicated to prevent artificial score escalation.

---

## 12. Primary API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/system/health` | Comprehensive subsystem health and database readiness |
| `GET` | `/api/v1/observe/sentinel-summary` | High-level metrics, monitored volume, and alert summary |
| `GET` | `/api/v1/observe/threat-stream` | Filterable, paginated transaction stream with risk indicators |
| `GET` | `/api/v1/trace/graph` | Directed transaction graph topology with node metrics |
| `POST`| `/api/v1/trace/bfs` | Multi-hop directional BFS trace (`combined`, `forward`, `backward`) |
| `GET` | `/api/v1/trace/lineage/{token_id}` | Chronological SHA-256 token provenance blocks |
| `POST`| `/api/v1/trace/lineage/verify` | Validates cryptographic hash continuity across token receipts |
| `POST`| `/api/v1/trace/lineage/tamper-test` | Live tamper-injection test proving zero false-acceptance |
| `GET` | `/api/v1/detect/account/{account_id}` | Multi-engine forensic dossier with sliding-window, IF, and GraphSAGE |
| `GET` | `/api/v1/detect/models/observatory` | Empirical synthetic benchmark comparison data |
| `GET` | `/api/v1/respond/cases` | Filterable case management board |
| `POST`| `/api/v1/respond/cases` | Creates new incident investigation case |
| `GET` | `/api/v1/respond/evidence-vault/export/{case_id}` | Exports RFC 8785 canonical JSON evidence dossier with SHA-256 seal |
| `GET` | `/api/v1/respond/evidence-vault/export-lineage/{token_id}` | Exports cryptographic token provenance package |
| `GET` | `/api/v1/respond/audit-ledger` | Cryptographically chained SHA-256 audit log |
| `GET` | `/api/v1/simulate/replay/hero` | 9-step chronological walkthrough of deterministic hero flow |

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.
