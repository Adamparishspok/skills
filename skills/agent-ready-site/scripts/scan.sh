#!/usr/bin/env bash
# Scan a site with Cloudflare's Agent Readiness API and print a compact report.
# Usage: scan.sh https://example.com [--json]
# Needs curl and jq. The full JSON (with per-check evidence) goes to stdout with --json.
set -euo pipefail

url="${1:?usage: scan.sh <url> [--json]}"
body=$(curl -fsS -m 120 -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d "$(jq -cn --arg u "$url" '{url: $u}')") || { echo "scan request failed" >&2; exit 1; }

if [[ "${2:-}" == "--json" ]]; then echo "$body"; exit 0; fi

jq -r '
  "Level \(.level) (\(.levelName))   commerce detected: \(.isCommerce)",
  "",
  (.checks | to_entries[] | .key as $group | .value | to_entries[]
    | "\(.value.status | if . == "pass" then "PASS" elif . == "fail" then "FAIL" else "info" end)\t\($group)/\(.key)\t\(.value.message)"),
  "",
  "Next level: \(.nextLevel.target // "-") \(.nextLevel.name // "")",
  (.nextLevel.requirements // [] | .[] | "  \(.check): \(.shortPrompt)\n    skill: \(.skillUrl)")
' <<<"$body"
