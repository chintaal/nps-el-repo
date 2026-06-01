import math
from urllib.parse import urlparse, parse_qs

import numpy as np


def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    byte_counts = np.bincount(list(data), minlength=256)
    probabilities = byte_counts / len(data)
    probabilities = probabilities[probabilities > 0]
    return float(-np.sum(probabilities * np.log2(probabilities)))


def extract_features(
    method: str,
    url: str,
    body: bytes,
    content_length: int,
    session_content_lengths: list[int],
) -> np.ndarray:
    if len(session_content_lengths) < 2:
        cl_zscore = 0.0
    else:
        mean = np.mean(session_content_lengths)
        std = np.std(session_content_lengths) + 1e-9
        raw_z = abs((content_length - mean) / std)
        cl_zscore = float(min(raw_z, 5.0))  # cap to prevent overflow on all-zero history

    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    param_count = sum(len(v) for v in params.values())
    url_len = max(len(url), 1)
    param_density = param_count / url_len

    entropy = shannon_entropy(body)

    return np.array([cl_zscore, param_density, entropy], dtype=np.float32)
