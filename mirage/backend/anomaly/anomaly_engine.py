"""Calibrated anomaly ensemble.

Phase 1 upgrades the single IsolationForest into a small **ensemble**
(IsolationForest + One-Class SVM) over the 10-feature vector, combined and then
**Platt-calibrated** so the returned ``[0, 1]`` value is a real probability of
maliciousness rather than an ad-hoc normalised distance. Calibration makes the
ENGAGE/SUSPECT thresholds meaningful and the UI gauges honest.

Contract preserved:
- ``train(baseline)`` fits the unsupervised models on benign-only data.
- ``score(features) -> float`` in [0, 1], higher = more anomalous, single sample.
- ``ANOMALY_THRESHOLD_{SUSPECT,ENGAGE}`` unchanged and env-overridable.

New:
- ``calibrate(X, y)`` fits Platt scaling on a labeled set (benign+malicious).
- ``raw_combined(X)`` exposes the pre-calibration ensemble score for the
  benchmark's ROC/ablation work.

The per-stream normalisation statistics are frozen at ``train`` time, so the
single-sample live path and the batch benchmark/calibration path share one
scale — Platt is fit on exactly what ``score`` later produces.
"""

import os

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

ANOMALY_THRESHOLD_SUSPECT = float(os.getenv("ANOMALY_THRESHOLD_SUSPECT", "0.55"))
ANOMALY_THRESHOLD_ENGAGE = float(os.getenv("ANOMALY_THRESHOLD_ENGAGE", "0.62"))


class AnomalyEngine:
    def __init__(self) -> None:
        self._iforest = IsolationForest(
            n_estimators=200, contamination=0.05, random_state=42
        )
        self._ocsvm = OneClassSVM(nu=0.05, kernel="rbf", gamma="scale")
        self._scaler = StandardScaler()
        self._platt: LogisticRegression | None = None
        self._trained = False
        self._calibrated = False
        # Frozen per-stream normalisation (set in train()).
        self._if_mean = 0.0
        self._if_std = 1.0
        self._svm_mean = 0.0
        self._svm_std = 1.0
        # Fallback bounds if calibration is skipped.
        self._raw_lo = -1.0
        self._raw_hi = 1.0

    # ── training ─────────────────────────────────────────────────────────────

    def train(self, baseline: np.ndarray) -> None:
        Xs = self._scaler.fit_transform(baseline)
        self._iforest.fit(Xs)
        self._ocsvm.fit(Xs)

        # Freeze normalisation from the benign training streams.
        if_anom = -self._iforest.score_samples(Xs)
        svm_anom = -self._ocsvm.decision_function(Xs)
        self._if_mean, self._if_std = float(if_anom.mean()), float(if_anom.std() + 1e-9)
        self._svm_mean, self._svm_std = float(svm_anom.mean()), float(svm_anom.std() + 1e-9)
        self._trained = True

        raw = self._combine(if_anom, svm_anom)
        self._raw_lo = float(np.percentile(raw, 5))
        self._raw_hi = float(np.percentile(raw, 99))

    def calibrate(self, X: np.ndarray, y: np.ndarray) -> None:
        """Fit Platt scaling: raw ensemble score -> P(malicious)."""
        if not self._trained:
            return
        raw = self.raw_combined(X).reshape(-1, 1)
        self._platt = LogisticRegression(C=1.0, class_weight="balanced")
        self._platt.fit(raw, y)
        self._calibrated = True

    # ── core combine (uses frozen stats — scale-consistent everywhere) ───────

    def _combine(self, if_anom: np.ndarray, svm_anom: np.ndarray) -> np.ndarray:
        z_if = (if_anom - self._if_mean) / self._if_std
        z_svm = (svm_anom - self._svm_mean) / self._svm_std
        return 0.5 * z_if + 0.5 * z_svm

    def raw_combined(self, X: np.ndarray) -> np.ndarray:
        """Pre-calibration anomaly score for a batch of raw feature vectors."""
        Xs = self._scaler.transform(X)
        if_anom = -self._iforest.score_samples(Xs)
        svm_anom = -self._ocsvm.decision_function(Xs)
        return self._combine(if_anom, svm_anom)

    # ── scoring ──────────────────────────────────────────────────────────────

    def _platt_or_minmax(self, raw: np.ndarray) -> np.ndarray:
        if self._calibrated and self._platt is not None:
            return self._platt.predict_proba(raw.reshape(-1, 1))[:, 1]
        span = self._raw_hi - self._raw_lo
        if span <= 0:
            return np.zeros(len(raw))
        return np.clip((raw - self._raw_lo) / span, 0.0, 1.0)

    def score(self, features: np.ndarray) -> float:
        """Return calibrated P(malicious) in [0, 1] for a single request."""
        if not self._trained:
            return 0.0
        raw = self.raw_combined(features.reshape(1, -1))
        return float(np.clip(self._platt_or_minmax(raw)[0], 0.0, 1.0))

    def score_batch(self, X: np.ndarray) -> np.ndarray:
        """Calibrated probabilities for a batch (used by the benchmark)."""
        if not self._trained:
            return np.zeros(len(X))
        return self._platt_or_minmax(self.raw_combined(X))
