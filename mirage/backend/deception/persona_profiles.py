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
