import re
from typing import Optional

PATTERNS: list[tuple[str, re.Pattern]] = [
    ("sql_injection", re.compile(r"(union\s+select|or\s+1=1|'\s*or|exec\s*\(|'--|;\s*--|\bselect\b.*\bfrom\b)", re.I)),
    ("path_traversal", re.compile(r"\.\./|\.\.\\", re.I)),
    ("xss", re.compile(r"<script|javascript:|onerror=|onload=", re.I)),
    ("cmd_injection", re.compile(r";\s*(ls|cat|wget|curl|bash|sh)\s", re.I)),
    ("scanner_ua", re.compile(r"nikto|sqlmap|nmap|masscan|zgrab|dirbuster", re.I)),
    ("admin_hunt", re.compile(r"/(admin|phpmyadmin|wp-admin|\.env|config)", re.I)),
]


def check_patterns(request_data: str, user_agent: str = "") -> tuple[bool, Optional[str]]:
    combined = request_data + " " + user_agent
    for category, pattern in PATTERNS:
        if pattern.search(combined):
            return True, category
    return False, None
