#!/usr/bin/env bash
# Smoke test for a deployed MediWise. Usage: see docs/DEPLOY.md, section "Smoke test".
# Needs: API_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SMOKE_EMAIL, SMOKE_PASSWORD. Optional: WEB_URL.
set -euo pipefail

: "${API_URL:?set API_URL}" "${SUPABASE_URL:?set SUPABASE_URL}" "${SUPABASE_ANON_KEY:?set SUPABASE_ANON_KEY}"
: "${SMOKE_EMAIL:?set SMOKE_EMAIL}" "${SMOKE_PASSWORD:?set SMOKE_PASSWORD}"

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1" >&2; exit 1; }

# Render free sleeps after 15 minutes idle, so the first request may take up to a minute.
health=$(curl -fsS --max-time 120 --retry 3 --retry-all-errors "$API_URL/health") || fail "GET /health"
[ "$(jq -r .status <<<"$health")" = ok ] || fail "GET /health status is not ok"
pass "GET /health"

if [ -n "${WEB_URL:-}" ]; then
  allowed=$(curl -fsS -o /dev/null -D - -H "Origin: $WEB_URL" "$API_URL/health" |
    tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin" {print $2}')
  [ "$allowed" = "$WEB_URL" ] || fail "CORS allows '$allowed', expected '$WEB_URL'"
  pass "CORS allows $WEB_URL"
  curl -fsS "$WEB_URL/reports/upload" | grep -q '<div id="root"' || fail "SPA rewrite on $WEB_URL"
  pass "web serves index.html on a deep link"
fi

token=$(curl -fsS "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d "$(jq -n --arg e "$SMOKE_EMAIL" --arg p "$SMOKE_PASSWORD" '{email: $e, password: $p}')" |
  jq -r .access_token) || fail "sign in as $SMOKE_EMAIL"
pass "sign in as $SMOKE_EMAIL"

call() { curl -fsS -H "Authorization: Bearer $token" -H "Content-Type: application/json" "$@"; }

[ "$(call "$API_URL/me" | jq -r .email)" = "$SMOKE_EMAIL" ] || fail "GET /me"
pass "GET /me"

profile=$(call -X POST "$API_URL/profiles" -d '{"name":"Smoke Test","relation":"other","dateOfBirth":"1990-01-01","sex":"other","ancestry":"south_asian"}' |
  jq -r .id) || fail "POST /profiles"
pass "POST /profiles"

call "$API_URL/reports?profileId=$profile" | jq -e '.items | length == 0' >/dev/null || fail "GET /reports"
pass "GET /reports"

call -X DELETE "$API_URL/profiles/$profile" >/dev/null || fail "DELETE /profiles/$profile"
pass "DELETE /profiles (clean up)"

echo "smoke test passed against $API_URL"
