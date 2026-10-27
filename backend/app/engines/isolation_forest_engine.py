"""
Algorithm 6: Isolation Forest Anomaly Detection.
Trains and infers on the versioned graph feature table (schema v1.0).
Provides normalized anomaly scores in [0.0, 1.0], ranking, and defensible
feature perturbation explanations based on median population divergence.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Optional, Tuple
from backend.app.models.schemas import IsolationForestOutput, TopFeaturePerturbation
from backend.app.core.config import config
from backend.app.core.logging import logger

class IsolationForestEngine:
    def __init__(self, n_estimators: int = 150, contamination: float = 0.08, random_seed: int = 42):
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.random_seed = random_seed
        self.version = config.isolation_forest_version
        self.feature_schema_version = config.feature_schema_version
        
        self.model: Optional[IsolationForest] = None
        self.feature_names: List[str] = []
        self.population_medians: Optional[np.ndarray] = None
        self.population_iqrs: Optional[np.ndarray] = None
        self.min_score: float = 0.0
        self.max_score: float = 1.0

    def fit(self, feature_df: pd.DataFrame) -> None:
        """
        Fits the Isolation Forest on the graph feature table.
        Computes reference population profiles for explainability.
        """
        if feature_df.empty or len(feature_df) < 5:
            logger.warning("Insufficient feature rows to train Isolation Forest.")
            return

        self.feature_names = list(feature_df.columns)
        X = feature_df.values.astype(float)

        self.model = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=self.random_seed
        )
        self.model.fit(X)

        # Baseline reference profile for explainability
        self.population_medians = np.median(X, axis=0)
        q75, q25 = np.percentile(X, [75, 25], axis=0)
        self.population_iqrs = np.maximum(q75 - q25, 1e-4)

        # Calibration of min/max score bounds
        raw_scores = -self.model.decision_function(X)
        self.min_score = float(np.min(raw_scores))
        self.max_score = float(np.max(raw_scores))
        logger.info(f"Isolation Forest fitted on {len(feature_df)} accounts. Score range: [{self.min_score:.3f}, {self.max_score:.3f}]")

    def score_account(self, account_id: str, feature_vector: np.ndarray) -> IsolationForestOutput:
        """
        Computes normalized anomaly score for a single account and extracts top contributing features.
        """
        if self.model is None or self.population_medians is None:
            return IsolationForestOutput(
                status="NOT_TRAINED",
                anomaly_score=None,
                is_anomaly=False,
                top_contributing_features=[],
                version=self.version
            )

        X = feature_vector.reshape(1, -1).astype(float)
        raw_score = -float(self.model.decision_function(X)[0])
        
        # Normalize to [0.0, 1.0]
        denom = max(self.max_score - self.min_score, 1e-6)
        normalized_score = float(np.clip((raw_score - self.min_score) / denom, 0.0, 1.0))
        is_anomaly = bool(normalized_score >= 0.70)

        # Defensible explanation: feature perturbation vs population median
        top_features: List[TopFeaturePerturbation] = []
        deviations = np.abs(X[0] - self.population_medians) / self.population_iqrs
        top_indices = np.argsort(deviations)[::-1][:3]

        for idx in top_indices:
            feat_name = self.feature_names[idx]
            val = float(X[0][idx])
            med = float(self.population_medians[idx])
            dev_score = round(float(deviations[idx]), 2)
            top_features.append(TopFeaturePerturbation(
                feature_name=feat_name,
                account_value=round(val, 2),
                reference_median=round(med, 2),
                anomaly_contribution_score=dev_score
            ))

        return IsolationForestOutput(
            status="READY",
            anomaly_score=round(normalized_score, 3),
            is_anomaly=is_anomaly,
            top_contributing_features=top_features,
            version=self.version
        )

# Global singleton engine
iforest_engine = IsolationForestEngine()
