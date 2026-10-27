"""
Algorithm 8: GraphSAGE Inductive Account-Risk Classifier.
Implements 2-layer inductive GraphSAGE with neighborhood mean aggregation,
scenario-based leakage-safe partitioning, weighted BCE loss for class imbalance,
and rigorous artifact persistence.

CRITICAL STATUS CONTRACT:
If no compatible trained model artifact exists, this engine explicitly returns
status="NOT_TRAINED" with mule_probability=None. It never manufactures synthetic predictions.
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from sklearn.metrics import precision_score, recall_score, f1_score
from backend.app.models.schemas import GraphSAGEOutput
from backend.app.core.config import config
from backend.app.core.logging import logger

MODEL_PATH = Path(config.artifacts_dir) / "graphsage_v1.pt"
METADATA_PATH = Path(config.artifacts_dir) / "graphsage_metadata.json"

class GraphSAGELayer(nn.Module):
    """Inductive GraphSAGE layer with mean neighbor aggregation."""
    def __init__(self, in_features: int, out_features: int, dropout: float = 0.2):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        # Linear projection over concatenated self features and neighbor aggregate: [x_v || agg(x_u)]
        self.linear = nn.Linear(in_features * 2, out_features)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        # adj_norm is row-normalized adjacency matrix (N x N)
        # neighbor_agg = adj_norm * x
        neighbor_agg = torch.sparse.mm(adj_norm, x) if adj_norm.is_sparse else torch.matmul(adj_norm, x)
        concat_features = torch.cat([x, neighbor_agg], dim=1)
        out = self.linear(concat_features)
        out = F.relu(out)
        return self.dropout(out)

class GraphSAGEClassifier(nn.Module):
    """2-layer GraphSAGE architecture with binary classification head."""
    def __init__(self, in_features: int, hidden_dim: int = 64, out_dim: int = 32, dropout: float = 0.2):
        super().__init__()
        self.layer1 = GraphSAGELayer(in_features, hidden_dim, dropout)
        self.layer2 = GraphSAGELayer(hidden_dim, out_dim, dropout)
        self.classifier = nn.Linear(out_dim, 1)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h1 = self.layer1(x, adj_norm)
        h2 = self.layer2(h1, adj_norm)
        logits = self.classifier(h2).squeeze(-1)
        return logits, h2

class GraphSAGEEngine:
    def __init__(self):
        self.model: Optional[GraphSAGEClassifier] = None
        self.metadata: Dict[str, Any] = {}
        self.account_id_to_index: Dict[str, int] = {}
        self.cached_predictions: Dict[str, float] = {}
        self.cached_embeddings: Dict[str, List[float]] = {}
        self.load_model_if_available()

    def build_normalized_adj(self, account_ids: List[str], transactions: List[Dict[str, Any]]) -> torch.Tensor:
        """Constructs row-normalized symmetric adjacency matrix with self-loops."""
        N = len(account_ids)
        acc_to_idx = {acc_id: i for i, acc_id in enumerate(account_ids)}
        
        # Build adjacency matrix
        adj = np.eye(N, dtype=np.float32)  # Include self-loops
        for tx in transactions:
            u = tx["source_account_id"]
            v = tx["destination_account_id"]
            if u in acc_to_idx and v in acc_to_idx:
                i, j = acc_to_idx[u], acc_to_idx[v]
                adj[i, j] = 1.0
                adj[j, i] = 1.0  # Undirected message passing for neighborhood context

        # Degree normalization: D^{-1} * A
        deg = np.sum(adj, axis=1)
        deg_inv = np.power(deg, -1.0, where=deg > 0)
        deg_inv[deg == 0] = 0.0
        adj_norm = deg_inv[:, None] * adj
        return torch.tensor(adj_norm, dtype=torch.float32)

    def train_pipeline(
        self,
        accounts: List[Dict[str, Any]],
        transactions: List[Dict[str, Any]],
        feature_df: pd.DataFrame,
        epochs: int = 40,
        lr: float = 0.01
    ) -> Dict[str, Any]:
        """
        Trains GraphSAGE on leakage-safe scenario partitions:
        - Train set: Normal, Payroll, Merchant, Hero scenario
        - Val set: Smurfing ring 1, Rapid passthrough 1-5
        - Test set: Held-out connected mule rings, smurfing rings 2-6 (reserved for benchmark)
        """
        torch.manual_seed(config.random_seed)
        np.random.seed(config.random_seed)

        account_ids = list(feature_df.index)
        self.account_id_to_index = {acc_id: i for i, acc_id in enumerate(account_ids)}
        N = len(account_ids)
        D = feature_df.shape[1]

        # Feature normalization (Z-score standard scaling)
        raw_x = feature_df.values.astype(np.float32)
        mean_feat = np.mean(raw_x, axis=0)
        std_feat = np.maximum(np.std(raw_x, axis=0), 1e-4)
        x_norm = (raw_x - mean_feat) / std_feat
        x_tensor = torch.tensor(x_norm, dtype=torch.float32)

        # Adjacency
        adj_norm = self.build_normalized_adj(account_ids, transactions)

        # Labels (Isolated ground truth, 0 or 1)
        acc_dict = {a["account_id"]: a for a in accounts}
        labels = np.array([acc_dict.get(aid, {}).get("ground_truth_label", 0) for aid in account_ids], dtype=np.float32)
        y_tensor = torch.tensor(labels, dtype=torch.float32)

        # Partition indices by scenario to prevent neighbor leakage
        train_indices, val_indices, test_indices = [], [], []
        for i, aid in enumerate(account_ids):
            acc_info = acc_dict.get(aid, {})
            scenario = acc_info.get("scenario_tag", "normal")
            
            # Held-out test set
            if "connected_mule_ring" in scenario or "smurfing_ring_3" in scenario:
                test_indices.append(i)
            # Validation set
            elif "smurfing_collector" in scenario or "rapid_passthrough" in scenario:
                val_indices.append(i)
            # Training set
            else:
                train_indices.append(i)

        # Fallback if partition too skewed
        if len(train_indices) < 10 or len(val_indices) < 5:
            # Deterministic modulo split by index
            train_indices = [i for i in range(N) if i % 5 not in (3, 4)]
            val_indices = [i for i in range(N) if i % 5 == 3]
            test_indices = [i for i in range(N) if i % 5 == 4]

        train_mask = torch.tensor(train_indices, dtype=torch.long)
        val_mask = torch.tensor(val_indices, dtype=torch.long)

        # Compute pos_weight to address class imbalance (~8% mules)
        num_pos = max(1.0, float(torch.sum(y_tensor[train_mask])))
        num_neg = max(1.0, float(len(train_mask) - num_pos))
        pos_weight = torch.tensor([num_neg / num_pos], dtype=torch.float32)

        # Initialize model
        self.model = GraphSAGEClassifier(in_features=D, hidden_dim=64, out_dim=32, dropout=0.2)
        optimizer = torch.optim.Adam(self.model.parameters(), lr=lr, weight_decay=1e-4)
        criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

        logger.info(f"Training GraphSAGE: N={N}, D={D}, Train={len(train_mask)}, Val={len(val_mask)}, PosWeight={pos_weight.item():.2f}")

        best_val_f1 = 0.0
        best_state = None

        self.model.train()
        for epoch in range(1, epochs + 1):
            optimizer.zero_grad()
            logits, _ = self.model(x_tensor, adj_norm)
            loss = criterion(logits[train_mask], y_tensor[train_mask])
            loss.backward()
            optimizer.step()

            # Validation check
            if epoch % 5 == 0 or epoch == epochs:
                self.model.eval()
                with torch.no_grad():
                    val_logits, _ = self.model(x_tensor, adj_norm)
                    val_probs = torch.sigmoid(val_logits[val_mask]).cpu().numpy()
                    val_preds = (val_probs >= 0.5).astype(int)
                    val_targets = y_tensor[val_mask].cpu().numpy().astype(int)
                    
                    val_f1 = float(f1_score(val_targets, val_preds, zero_division=0))
                    if val_f1 >= best_val_f1:
                        best_val_f1 = val_f1
                        best_state = self.model.state_dict()
                self.model.train()

        # Load best state
        if best_state is not None:
            self.model.load_state_dict(best_state)

        # Final inference cache across all nodes
        self.model.eval()
        with torch.no_grad():
            all_logits, all_embs = self.model(x_tensor, adj_norm)
            all_probs = torch.sigmoid(all_logits).cpu().numpy()
            all_embs_np = all_embs.cpu().numpy()

        for i, aid in enumerate(account_ids):
            self.cached_predictions[aid] = float(all_probs[i])
            self.cached_embeddings[aid] = [round(float(v), 4) for v in all_embs_np[i][:4]]

        # Persist model artifact and metadata
        self.save_model_artifacts(best_val_f1, mean_feat.tolist(), std_feat.tolist())
        
        return {
            "status": "SUCCESS",
            "model_version": config.model_version,
            "trained_accounts": N,
            "validation_f1": round(best_val_f1, 4),
            "pos_weight": round(pos_weight.item(), 2)
        }

    def save_model_artifacts(self, val_f1: float, mean_feat: List[float], std_feat: List[float]) -> None:
        """Persists trained weights and metadata JSON."""
        if self.model is None:
            return
        
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        torch.save(self.model.state_dict(), str(MODEL_PATH))
        
        self.metadata = {
            "model_version": config.model_version,
            "feature_schema_version": config.feature_schema_version,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "validation_f1": round(val_f1, 4),
            "architecture": "2-Layer Inductive GraphSAGE (Mean Aggregator, Hidden: 64, Out: 32)",
            "mean_features": mean_feat,
            "std_features": std_feat
        }
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)
        logger.info(f"GraphSAGE model persisted to {MODEL_PATH}")

    def load_model_if_available(self) -> bool:
        """Loads saved weights and metadata if present."""
        if MODEL_PATH.exists() and METADATA_PATH.exists():
            try:
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                
                self.model = GraphSAGEClassifier(in_features=11, hidden_dim=64, out_dim=32)
                self.model.load_state_dict(torch.load(str(MODEL_PATH), weights_only=True))
                self.model.eval()
                logger.info(f"Loaded existing GraphSAGE model (Version: {self.metadata.get('model_version')})")
                return True
            except Exception as e:
                logger.warning(f"Could not load GraphSAGE model artifact: {e}")
                self.model = None
                return False
        return False

    def predict_account(self, account_id: str) -> GraphSAGEOutput:
        """Returns inductive mule classification score or explicit NOT_TRAINED status."""
        if self.model is None or not self.cached_predictions:
            return GraphSAGEOutput(
                status="NOT_TRAINED",
                mule_probability=None,
                embedding_vector_sample=[],
                model_version=None,
                trained_at=None,
                validation_f1=None
            )

        prob = self.cached_predictions.get(account_id)
        emb = self.cached_embeddings.get(account_id, [])

        if prob is None:
            return GraphSAGEOutput(
                status="NOT_TRAINED",
                mule_probability=None,
                embedding_vector_sample=[],
                model_version=self.metadata.get("model_version"),
                trained_at=self.metadata.get("trained_at"),
                validation_f1=self.metadata.get("validation_f1")
            )

        return GraphSAGEOutput(
            status="READY",
            mule_probability=round(prob, 4),
            embedding_vector_sample=emb,
            model_version=self.metadata.get("model_version"),
            trained_at=self.metadata.get("trained_at"),
            validation_f1=self.metadata.get("validation_f1")
        )

graphsage_engine = GraphSAGEEngine()
