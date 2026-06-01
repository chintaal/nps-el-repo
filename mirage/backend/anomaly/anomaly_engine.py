import numpy as np
from sklearn.ensemble import IsolationForest

ANOMALY_THRESHOLD_SUSPECT = 0.55
ANOMALY_THRESHOLD_ENGAGE = 0.62


class AnomalyEngine:
    def __init__(self) -> None:
        self._model = IsolationForest(
            n_estimators=200,
            contamination=0.05,
            random_state=42,
        )
        self._trained = False
        self._score_high: float = -0.30  # calibrated on training baseline (90th pct)
        self._score_low: float = -0.80   # calibrated floor for anomalous traffic

    def train(self, baseline: np.ndarray) -> None:
        self._model.fit(baseline)
        self._trained = True
        # Dynamic calibration: derive normalization bounds from actual training distribution
        raw_scores = self._model.score_samples(baseline)
        self._score_high = float(np.percentile(raw_scores, 90))   # clean reference
        self._score_low = float(np.percentile(raw_scores, 5) - 0.10)  # anomaly floor

    def score(self, features: np.ndarray) -> float:
        """Return anomaly score in [0, 1]. Higher = more anomalous."""
        if not self._trained:
            return 0.0
        raw = self._model.score_samples(features.reshape(1, -1))[0]
        # Normalize: score_high → 0.0 (clean), score_low → 1.0 (anomalous)
        span = self._score_high - self._score_low
        if span == 0:
            return 0.0
        normalized = (self._score_high - raw) / span
        return float(np.clip(normalized, 0.0, 1.0))
