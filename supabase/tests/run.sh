#!/usr/bin/env bash
# Runs the migrations + RLS tests against a throwaway Postgres 17 container.
# Usage: bash supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

NAME=hh-pg-test
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres postgres:17 >/dev/null
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
sleep 1

psql_run() { docker exec -i "$NAME" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

psql_run < supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql; do
  echo "applying $f"
  psql_run < "$f"
done
psql_run < supabase/tests/rls_test.sql
psql_run < supabase/tests/features_test.sql
