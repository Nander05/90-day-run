#!/bin/bash
# Start een verse server (mock-database) en draai de browsertest.
cd "$(dirname "$0")/../backend"
pkill -f "[u]vicorn app.main:app --port 8765" 2>/dev/null; sleep 0.5
USE_MOCK_DB=1 APP_ENV=test BCRYPT_ROUNDS=4 ADMIN_EMAIL=nander@example.com ADMIN_PASSWORD=admin-wachtwoord-123 \
  python3 -m uvicorn app.main:app --port 8765 --log-level warning > /tmp/uv.log 2>&1 &
PID=$!
for i in $(seq 1 30); do curl -sf localhost:8765/healthz >/dev/null && break; sleep 0.3; done
timeout 150 python3 ../tools/e2e.py; RC=$?
kill $PID 2>/dev/null
exit $RC
