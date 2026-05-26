#!/usr/bin/env bash
# Shared audit-harness marker scan used by both the CI verify step in
# .github/workflows/build.yml and the self-test in scripts/test-marker-scan.sh.
#
# Centralizing the scan in one script keeps the live CI logic and its self-test
# from drifting independently — a workflow-only edit would otherwise miss the
# self-test fixture coverage.
#
# Why this scan exists:
#   Greps build output for `[V<n>]` and `§Sources` markers — internal
#   spec-drafting tokens that must never ship in compiled JS. Source comments
#   leak through THREE surfaces and ALL are covered here:
#     1) commonjs/*.js and es/*.mjs (babel preserves comments)
#     2) dist/hyperformula.js and dist/hyperformula.full.js (webpack preserves
#        comments in the development build)
#     3) dist/*.js.map (`sourcesContent` embeds full original source, so markers
#        survive in source-maps even if stripped from .js)
#   `grep -rn` over dist/ catches .map files because they are plain JSON.
#
# Usage:
#   bash scripts/marker-scan.sh <path> [<path> ...]
#
# Exit codes:
#   0  — scan ran cleanly, no markers found (or no requested dirs exist)
#   1  — markers found in at least one scanned file
#   2+ — grep failed with an I/O / scan error; the caller must surface this

set -u

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <path> [<path> ...]" >&2
  exit 2
fi

paths=()
for dir in "$@"; do
  if [ -d "$dir" ]; then
    paths+=("$dir")
  fi
done

if [ ${#paths[@]} -eq 0 ]; then
  echo "No build output directories found ($*); skipping marker scan."
  exit 0
fi

echo "Scanning ${paths[*]} for audit-harness markers..."

# grep exit codes: 0=match, 1=no-match, 2+=scan/IO error. A bare `if grep`
# collapses 1 and 2 into the same branch, silently green-lighting on read
# errors. Branch on rc explicitly.
set +e
grep -rnE '\[V[0-9]+\]|§[[:space:]]*Sources' "${paths[@]}"
rc=$?
set -e

case "$rc" in
  0)
    echo ""
    echo "ERROR: audit-harness markers ([V<n>] or §Sources) found in build output."
    echo "These markers are an internal spec-drafting convention and must never"
    echo "ship in compiled JS. Strip them from the source comments/strings above."
    exit 1
    ;;
  1)
    echo "OK: no audit-harness markers found in build output."
    exit 0
    ;;
  *)
    echo "ERROR: grep exited with rc=$rc while scanning ${paths[*]} — aborting scan." >&2
    exit "$rc"
    ;;
esac
