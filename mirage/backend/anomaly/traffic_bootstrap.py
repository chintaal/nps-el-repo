"""Synthetic benign baseline for unsupervised training.

Phase 1 sources the baseline from the same realistic request generator the
benchmark uses (``research.corpus.benign_requests``) and runs it through the
real feature pipeline, so the model is trained and evaluated on a coherent
distribution. Deterministic given the seed.
"""

import numpy as np


def generate_baseline(n_samples: int = 2000, seed: int = 42) -> np.ndarray:
    """Return an (n_samples, N_FEATURES) matrix of benign feature vectors."""
    # Imported here to avoid a circular import at module load time.
    from research.corpus import benign_requests, features_from_request

    reqs = benign_requests(n_samples, seed=seed)
    return np.vstack([features_from_request(r) for r in reqs]).astype(np.float32)
