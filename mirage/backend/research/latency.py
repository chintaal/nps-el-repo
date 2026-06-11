"""Latency profiling — proves the sub-100 ms per-request budget.

Times the full hot path (feature extraction + ensemble scoring) over a sample of
real corpus requests and returns percentiles + a histogram for the UI.
"""

from __future__ import annotations

import time

import numpy as np

from anomaly.anomaly_engine import AnomalyEngine
from research.corpus import (
    benign_requests,
    features_from_request,
    malicious_requests,
)


def run_latency(engine: AnomalyEngine, n: int = 500, seed: int = 123) -> dict:
    reqs = benign_requests(n // 2, seed=seed) + malicious_requests(n // 2, seed=seed + 1)
    samples_ms: list[float] = []

    for r in reqs:
        t0 = time.perf_counter()
        feats = features_from_request(r)        # extraction
        engine.score(feats)                     # ensemble + calibration
        samples_ms.append((time.perf_counter() - t0) * 1000.0)

    arr = np.array(samples_ms)
    # Histogram bucketed up to the 100 ms ceiling (+ overflow bin).
    edges = [0, 0.5, 1, 2, 5, 10, 25, 50, 100, 250]
    hist, _ = np.histogram(arr, bins=edges)
    histogram = [
        {"range": f"{edges[i]}–{edges[i+1]}ms", "lo": edges[i], "hi": edges[i + 1], "count": int(hist[i])}
        for i in range(len(hist))
    ]

    return {
        "n": int(n),
        "budget_ms": 100,
        "mean_ms": round(float(arr.mean()), 4),
        "p50_ms": round(float(np.percentile(arr, 50)), 4),
        "p95_ms": round(float(np.percentile(arr, 95)), 4),
        "p99_ms": round(float(np.percentile(arr, 99)), 4),
        "max_ms": round(float(arr.max()), 4),
        "under_budget_pct": round(float((arr < 100).mean() * 100.0), 2),
        "histogram": histogram,
    }
