PERSONA_MAP: dict[str, str] = {
    "sql_injection": "postgres_persona",
    "path_traversal": "apache_persona",
    "admin_hunt": "env_file_persona",
    "scanner_ua": "apache_persona",
    "cmd_injection": "api_gateway_persona",
    "generic": "apache_persona",
    "xss": "apache_persona",
}

PERSONA_LABELS: dict[str, str] = {
    "postgres_persona": "PostgreSQL 9.2 Debug Console",
    "apache_persona": "Apache 2.2 mod_autoindex",
    "env_file_persona": "Flask Debug + .env Server",
    "api_gateway_persona": "Legacy REST Gateway v0.1",
}

MITRE_CATEGORY_MAP: dict[str, list[str]] = {
    "sql_injection": ["TA0006", "TA0009"],
    "path_traversal": ["TA0007", "TA0009"],
    "admin_hunt": ["TA0007", "TA0006"],
    "scanner_ua": ["TA0043"],
    "cmd_injection": ["TA0002", "TA0008"],
    "xss": ["TA0001", "TA0009"],
    "generic": ["TA0043"],
}

# Human-readable tactic names (ATT&CK Enterprise) for UI + report labelling.
TACTIC_NAMES: dict[str, str] = {
    "TA0043": "Reconnaissance",
    "TA0042": "Resource Development",
    "TA0001": "Initial Access",
    "TA0002": "Execution",
    "TA0003": "Persistence",
    "TA0004": "Privilege Escalation",
    "TA0005": "Defense Evasion",
    "TA0006": "Credential Access",
    "TA0007": "Discovery",
    "TA0008": "Lateral Movement",
    "TA0009": "Collection",
}

# Deterministic technique ground truth per attack family. The LLM reporter only
# refines/justifies these; agreement with this table is what drives confidence,
# removing the "trust the LLM blindly" weakness.
MITRE_TECHNIQUE_MAP: dict[str, list[dict]] = {
    "sql_injection": [
        {"id": "T1190", "name": "Exploit Public-Facing Application"},
        {"id": "T1212", "name": "Exploitation for Credential Access"},
    ],
    "path_traversal": [
        {"id": "T1083", "name": "File and Directory Discovery"},
        {"id": "T1006", "name": "Direct Volume Access"},
    ],
    "admin_hunt": [
        {"id": "T1083", "name": "File and Directory Discovery"},
        {"id": "T1552.001", "name": "Unsecured Credentials: Credentials In Files"},
    ],
    "scanner_ua": [
        {"id": "T1595.002", "name": "Active Scanning: Vulnerability Scanning"},
    ],
    "cmd_injection": [
        {"id": "T1059", "name": "Command and Scripting Interpreter"},
        {"id": "T1190", "name": "Exploit Public-Facing Application"},
    ],
    "xss": [
        {"id": "T1059.007", "name": "Command and Scripting Interpreter: JavaScript"},
        {"id": "T1539", "name": "Steal Web Session Cookie"},
    ],
    "generic": [
        {"id": "T1595", "name": "Active Scanning"},
    ],
}


def ground_truth_tactics(categories: list[str]) -> list[str]:
    """Union of deterministic tactic IDs for the given attack categories."""
    tags: list[str] = []
    for cat in categories:
        for t in MITRE_CATEGORY_MAP.get(cat, []):
            if t not in tags:
                tags.append(t)
    return tags


def mapping_confidence(llm_tactics: list[str], ground_truth: list[str]) -> dict:
    """Jaccard agreement between LLM-inferred tactics and the deterministic map.

    Returns a HIGH/MEDIUM/LOW label plus the raw score so the reporter and UI can
    show *why* a mapping is (un)trustworthy.
    """
    a, b = set(llm_tactics), set(ground_truth)
    if not a and not b:
        return {"score": 0.0, "label": "LOW", "agreement": []}
    inter = a & b
    union = a | b
    score = len(inter) / len(union) if union else 0.0
    label = "HIGH" if score >= 0.6 else "MEDIUM" if score >= 0.3 else "LOW"
    return {"score": round(score, 3), "label": label, "agreement": sorted(inter)}
