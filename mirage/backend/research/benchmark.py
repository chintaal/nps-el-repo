"""Detector benchmark — turns the anomaly engine's quality into measured numbers.

Produces, over a held-out labeled corpus:
- precision / recall / F1 at the live ENGAGE threshold,
- ROC curve + AUC, PR curve + AUC,
- confusion matrix,
- a reliability (calibration) curve,
- per-feature ablation (drop-one-feature AUC delta) showing signal attribution.

All outputs are plain JSON-serialisable dicts consumed by ``GET /api/research``.
"""

from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    auc,
    average_precision_score,
    confusion_matrix,
    precision_recall_curve,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
)

from anomaly.anomaly_engine import ANOMALY_THRESHOLD_ENGAGE, AnomalyEngine
from anomaly.feature_extractor import FEATURE_NAMES, N_FEATURES
from research.corpus import labeled_feature_set


def _downsample(xs: np.ndarray, ys: np.ndarray, k: int = 60) -> list[list[float]]:
    """Thin a curve to ~k points for compact transport to the UI."""
    n = len(xs)
    if n <= k:
        idx = range(n)
    else:
        idx = np.linspace(0, n - 1, k).astype(int)
    return [[round(float(xs[i]), 4), round(float(ys[i]), 4)] for i in idx]


def _calibration_curve(probs: np.ndarray, y: np.ndarray, bins: int = 10) -> list[dict]:
    edges = np.linspace(0.0, 1.0, bins + 1)
    out = []
    for i in range(bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (probs >= lo) & (probs < hi if i < bins - 1 else probs <= hi)
        if mask.sum() == 0:
            continue
        out.append({
            "predicted": round(float(probs[mask].mean()), 4),
            "empirical": round(float(y[mask].mean()), 4),
            "count": int(mask.sum()),
        })
    return out


def run_benchmark(
    engine: AnomalyEngine,
    n_benign: int = 600,
    n_malicious: int = 600,
    seed: int = 99,
) -> dict:
    """Evaluate ``engine`` on a fresh labeled draw. Returns a JSON-ready dict."""
    X, y = labeled_feature_set(n_benign, n_malicious, seed=seed)
    probs = engine.score_batch(X)
    preds = (probs > ANOMALY_THRESHOLD_ENGAGE).astype(int)

    fpr, tpr, _ = roc_curve(y, probs)
    roc_auc = float(roc_auc_score(y, probs))
    prec_c, rec_c, _ = precision_recall_curve(y, probs)
    pr_auc = float(average_precision_score(y, probs))
    tn, fp, fn, tp = confusion_matrix(y, preds).ravel()

    # Per-feature ablation: zero one feature column, re-score, measure AUC drop.
    ablation = []
    base_auc = roc_auc
    for j in range(N_FEATURES):
        Xj = X.copy()
        Xj[:, j] = 0.0
        try:
            auc_j = float(roc_auc_score(y, engine.score_batch(Xj)))
        except ValueError:
            auc_j = base_auc
        ablation.append({
            "feature": FEATURE_NAMES[j],
            "auc_without": round(auc_j, 4),
            "importance": round(base_auc - auc_j, 4),
        })
    ablation.sort(key=lambda d: d["importance"], reverse=True)

    return {
        "n_benign": int(n_benign),
        "n_malicious": int(n_malicious),
        "threshold": ANOMALY_THRESHOLD_ENGAGE,
        "precision": round(float(precision_score(y, preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y, preds, zero_division=0)), 4),
        "f1": round(float(f1_score(y, preds, zero_division=0)), 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "roc_curve": _downsample(fpr, tpr),
        "pr_curve": _downsample(rec_c, prec_c),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "calibration": _calibration_curve(probs, y),
        "ablation": ablation,
        "feature_names": FEATURE_NAMES,
    }
