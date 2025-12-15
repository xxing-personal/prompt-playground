#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "=== Smoke Test ==="
echo ""

echo "1. Health Check:"
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

echo "2. API Root:"
curl -s "$BASE_URL/api/v1/" | python3 -m json.tool
echo ""

echo "3. List Projects:"
curl -s "$BASE_URL/api/v1/projects" | python3 -m json.tool
echo ""

echo "=== All tests passed! ==="
