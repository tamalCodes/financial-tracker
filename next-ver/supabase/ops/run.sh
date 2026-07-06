#!/usr/bin/env bash
# One-command operator actions against the app_control row on the REMOTE
# Supabase project, using the service-role key from .env (bypasses RLS).
#
#   npm run ops:logout-all     -> log out every user (stamp session_epoch = now)
#   npm run ops:purge-caches   -> bump purge_version (force SW/cache wipe + reload)
#
# These hit production. There is no local confirmation prompt beyond npm's — the
# actions are non-destructive (users just re-login; caches just get rebuilt).
set -euo pipefail

action="${1:-}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"

# Load SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from next-ver/.env
set -a
# shellcheck disable=SC1091
source "$root/.env"
set +a

: "${SUPABASE_URL:?SUPABASE_URL missing from .env}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY missing from .env}"

rest="$SUPABASE_URL/rest/v1/app_control?id=eq.1"
auth=(-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

patch() {
  curl -fsS -X PATCH "$rest" "${auth[@]}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$1"
}

case "$action" in
  logout)
    now="$(date +%s)"
    echo "Logging out all users (session_epoch = $now)..."
    patch "{\"session_epoch\": $now, \"updated_at\": \"now()\"}"
    echo
    echo "Done. Every session issued before now is invalidated; users re-login."
    ;;
  purge)
    current="$(curl -fsS "$rest&select=purge_version" "${auth[@]}" \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(String(JSON.parse(s)[0].purge_version)))')"
    next=$((current + 1))
    echo "Bumping purge_version $current -> $next..."
    patch "{\"purge_version\": $next, \"updated_at\": \"now()\"}"
    echo
    echo "Done. Every client will wipe its service worker + caches and reload once."
    ;;
  *)
    echo "usage: run.sh {logout|purge}" >&2
    exit 2
    ;;
esac
