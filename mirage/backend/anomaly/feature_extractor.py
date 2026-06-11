"""Feature extraction for the Mirage anomaly detector.

Phase 1 expands the original 3-feature vector
(``cl_zscore``, ``param_density``, ``entropy``) into a richer 10-dimensional
signal. Every feature is O(len(request)) and allocation-light so the full
extract + score path stays well under the 100 ms budget. The original three
features are preserved as the first three dimensions, so nothing regresses.

``FEATURE_NAMES`` is the canonical ordering — the research/ ablation harness and
the frontend both key off it, so keep it in sync with ``extract_features``.
"""

import math
from urllib.parse import urlparse, parse_qs

import numpy as np

# Canonical feature ordering. Index == column in the vector returned below.
FEATURE_NAMES: list[str] = [
    "cl_zscore",          # 0 content-length deviation within the session
    "param_density",      # 1 query params per URL char
    "body_entropy",       # 2 Shannon entropy of the body (bytes)
    "url_entropy",        # 3 Shannon entropy of the URL string
    "bigram_entropy",     # 4 2-gram entropy of URL+body text
    "encoded_ratio",      # 5 %xx / \x / \u obfuscation density
    "path_depth",         # 6 number of path segments (normalised)
    "special_ratio",      # 7 non-alphanumeric character ratio
    "header_anomaly",     # 8 missing/odd HTTP headers composite
    "timing_burstiness",  # 9 inter-arrival burstiness within the session
]

N_FEATURES = len(FEATURE_NAMES)

# Roughly the spacing of organic human/browser traffic. Requests arriving much
# faster than this read as automated bursts.
_BENIGN_INTERVAL_S = 2.0


def shannon_entropy(data: bytes) -> float:
    """Byte-level Shannon entropy in bits [0, 8]."""
    if not data:
        return 0.0
    byte_counts = np.bincount(list(data), minlength=256)
    probabilities = byte_counts / len(data)
    probabilities = probabilities[probabilities > 0]
    return float(-np.sum(probabilities * np.log2(probabilities)))


def _char_entropy(text: str) -> float:
    """Character-level Shannon entropy in bits."""
    if not text:
        return 0.0
    counts: dict[str, int] = {}
    for ch in text:
        counts[ch] = counts.get(ch, 0) + 1
    n = len(text)
    return float(-sum((c / n) * math.log2(c / n) for c in counts.values()))


def _bigram_entropy(text: str) -> float:
    """Entropy over adjacent character pairs — sensitive to structured payloads
    (SQL keywords, traversal sequences) that shift the 2-gram distribution."""
    if len(text) < 2:
        return 0.0
    counts: dict[str, int] = {}
    for i in range(len(text) - 1):
        bg = text[i : i + 2]
        counts[bg] = counts.get(bg, 0) + 1
    n = len(text) - 1
    return float(-sum((c / n) * math.log2(c / n) for c in counts.values()))


def _encoded_ratio(text: str) -> float:
    """Density of percent / hex / unicode escape sequences — the obfuscation the
    deterministic regex layer tends to miss."""
    if not text:
        return 0.0
    n = len(text)
    pct = text.count("%")
    hexx = text.lower().count("\\x") + text.lower().count("0x")
    uni = text.lower().count("\\u")
    return float(min((pct + hexx + uni) / n, 1.0))


def _special_ratio(text: str) -> float:
    if not text:
        return 0.0
    special = sum(1 for ch in text if not ch.isalnum() and not ch.isspace())
    return float(special / len(text))


def _header_anomaly(headers: dict | None) -> float:
    """Composite [0, 1.5] flagging the header fingerprints of automated tooling:
    absent Accept/User-Agent, stub UAs, and unusually sparse header sets."""
    if not headers:
        return 0.0
    score = 0.0
    if "accept" not in headers:
        score += 0.4
    ua = headers.get("user-agent", "")
    if not ua:
        score += 0.5
    elif len(ua) < 12:
        score += 0.3
    if len(headers) < 3:
        score += 0.3
    return float(min(score, 1.5))


def _timing_burstiness(request_times: list[float] | None) -> float:
    """1.0 == back-to-back automated requests, 0.0 == spaced >= benign interval."""
    if not request_times or len(request_times) < 2:
        return 0.0
    delta = request_times[-1] - request_times[-2]
    if delta < 0:
        delta = 0.0
    return float(np.clip(1.0 - delta / _BENIGN_INTERVAL_S, 0.0, 1.0))


def extract_features(
    method: str,
    url: str,
    body: bytes,
    content_length: int,
    session_content_lengths: list[int],
    headers: dict | None = None,
    request_times: list[float] | None = None,
) -> np.ndarray:
    """Return the canonical ``N_FEATURES``-dim float32 vector for a request.

    ``headers`` and ``request_times`` are optional so legacy callers keep working
    (those features degrade gracefully to 0.0); the live proxy and the research
    corpus pass them for full fidelity.
    """
    # f0 — content-length z-score within the session (capped to avoid overflow)
    if len(session_content_lengths) < 2:
        cl_zscore = 0.0
    else:
        mean = np.mean(session_content_lengths)
        std = np.std(session_content_lengths) + 1e-9
        cl_zscore = float(min(abs((content_length - mean) / std), 5.0))

    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    param_count = sum(len(v) for v in params.values())
    url_len = max(len(url), 1)

    body_text = body.decode("utf-8", errors="replace") if body else ""
    combined = url + body_text

    # f1 — query param density
    param_density = param_count / url_len
    # f2 — body byte entropy
    body_entropy = shannon_entropy(body)
    # f3 — URL char entropy
    url_entropy = _char_entropy(url)
    # f4 — combined 2-gram entropy
    bigram_entropy = _bigram_entropy(combined)
    # f5 — obfuscation density
    encoded_ratio = _encoded_ratio(combined)
    # f6 — path depth (normalised, capped at 10 segments)
    path_depth = min(parsed.path.count("/"), 10) / 10.0
    # f7 — special character ratio
    special_ratio = _special_ratio(combined)
    # f8 — header anomaly
    header_anomaly = _header_anomaly(headers)
    # f9 — timing burstiness
    timing_burstiness = _timing_burstiness(request_times)

    return np.array(
        [
            cl_zscore,
            param_density,
            body_entropy,
            url_entropy,
            bigram_entropy,
            encoded_ratio,
            path_depth,
            special_ratio,
            header_anomaly,
            timing_burstiness,
        ],
        dtype=np.float32,
    )
