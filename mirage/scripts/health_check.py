#!/usr/bin/env python3
"""Pre-demo health check — run before presenting Project Mirage."""
import asyncio
import sys

import httpx


async def check() -> None:
    checks = [
        ("Backend health", "http://localhost:8000/health"),
        ("Frontend",       "http://localhost:3000"),
        ("Proxy ingress",  "http://localhost:8080"),
    ]

    all_ok = True
    print("\n  PROJECT MIRAGE — Pre-Demo Health Check\n  " + "─" * 40)

    async with httpx.AsyncClient() as client:
        for name, url in checks:
            try:
                r = await client.get(url, timeout=5.0, follow_redirects=True)
                if r.status_code < 400:
                    status = f"✓ OK  [{r.status_code}]"
                else:
                    status = f"✗ HTTP {r.status_code}"
                    all_ok = False
                # Extra check: backend must report trained=true
                if "health" in url:
                    data = r.json()
                    if not data.get("trained"):
                        status = "✗ UNTRAINED — model not fitted"
                        all_ok = False
            except Exception as e:
                status = f"✗ FAIL: {e}"
                all_ok = False
            print(f"  {status:<30} {name}")

    print()
    if not all_ok:
        print("  ⚠  FIX FAILURES BEFORE DEMO\n")
        sys.exit(1)
    print("  ✓  ALL SYSTEMS GO — READY FOR DEMO\n")


asyncio.run(check())
