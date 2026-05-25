#!/usr/bin/env bash
# Self-test for the audit-harness marker scan used in .github/workflows/build.yml.
#
# Why this exists:
#   The CI step in build.yml greps the build output (dist/, commonjs/, es/) for
#   `[V<n>]` and `§Sources` markers — internal spec-drafting tokens that must
#   never ship in compiled JS. Empirically (probed 2026-05-25 by planting
#   `// [V99] test marker` in src/index.ts and running `npm run bundle-all`),
#   markers leak through THREE distinct surfaces:
#     1) babel-transpiled commonjs/*.js and es/*.mjs preserve source comments
#     2) webpack-bundled dist/hyperformula.js and dist/hyperformula.full.js
#        preserve source comments (development build, no comment-stripping)
#     3) dist/*.js.map source-maps embed full original source in
#        `sourcesContent`, so comments survive into the map even when stripped
#        from the .js itself (not applicable here, but defends future configs)
#   This script asserts the grep logic catches markers in all three surfaces.
#
# Exit code: 0 on all assertions pass, non-zero on any failure.

set -uo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly TMP_ROOT="$(mktemp -d -t hf-marker-scan-XXXXXX)"
trap 'rm -rf "$TMP_ROOT"' EXIT

# ---- Mirror of the CI scan logic from .github/workflows/build.yml ----------
# Keep this in sync with build.yml. The script-under-test must behave
# identically to the YAML inline script.
run_marker_scan() {
  local root="$1"
  local paths=()
  local dir
  for dir in dist commonjs es; do
    if [ -d "$root/$dir" ]; then
      paths+=("$root/$dir")
    fi
  done
  if [ ${#paths[@]} -eq 0 ]; then
    echo "No build output directories found; skipping marker scan."
    return 0
  fi
  local rc=0
  grep -rnE '\[V[0-9]+\]|§[[:space:]]*Sources' "${paths[@]}" || rc=$?
  case "$rc" in
    0) return 1 ;;  # markers found -> CI would fail
    1) return 0 ;;  # no markers    -> CI would pass
    *) return "$rc" ;;
  esac
}

# ---- Fixture builders -------------------------------------------------------
make_clean_fixture() {
  local root="$1"
  mkdir -p "$root/dist" "$root/commonjs" "$root/es"
  cat >"$root/dist/hyperformula.js" <<'EOF'
// HyperFormula bundle (synthetic, clean)
const HyperFormula = function() { return 42; };
module.exports = HyperFormula;
EOF
  cat >"$root/dist/hyperformula.js.map" <<'EOF'
{"version":3,"sources":["webpack:///./src/index.ts"],"sourcesContent":["const HyperFormula = function() { return 42; };\nmodule.exports = HyperFormula;\n"],"mappings":"AAAA"}
EOF
  cat >"$root/commonjs/index.js" <<'EOF'
"use strict";
exports.foo = 1;
EOF
  cat >"$root/es/index.mjs" <<'EOF'
export const foo = 1;
EOF
}

# Variant: marker in dist .js file (e.g. preserved source comment).
make_marker_in_dist_js() {
  local root="$1"
  make_clean_fixture "$root"
  cat >>"$root/dist/hyperformula.js" <<'EOF'
// [V12] internal citation marker — must not ship
EOF
}

# Variant: marker in source-map sourcesContent only (stripped from .js).
make_marker_in_sourcemap() {
  local root="$1"
  make_clean_fixture "$root"
  cat >"$root/dist/hyperformula.js.map" <<'EOF'
{"version":3,"sources":["webpack:///./src/index.ts"],"sourcesContent":["// [V7] citation that survived into sourcesContent\nconst HyperFormula = function() { return 42; };\n"],"mappings":"AAAA"}
EOF
}

# Variant: §Sources footer leaked into commonjs output.
make_marker_in_commonjs() {
  local root="$1"
  make_clean_fixture "$root"
  cat >>"$root/commonjs/index.js" <<'EOF'
// §Sources: internal/spec.md
EOF
}

# Variant: marker in es/*.mjs.
make_marker_in_es() {
  local root="$1"
  make_clean_fixture "$root"
  cat >>"$root/es/index.mjs" <<'EOF'
// [V42] another internal token
EOF
}

# ---- Assertion harness ------------------------------------------------------
PASS_COUNT=0
FAIL_COUNT=0

assert_scan() {
  local name="$1"
  local expected="$2"   # "clean" -> expect rc 0 ; "dirty" -> expect rc 1
  local root="$3"

  local rc=0
  run_marker_scan "$root" >/tmp/scan-out 2>&1 || rc=$?

  local got
  case "$rc" in
    0) got="clean" ;;
    1) got="dirty" ;;
    *) got="error($rc)" ;;
  esac

  if [ "$got" = "$expected" ]; then
    echo "PASS  $name  (expected=$expected, got=$got)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "FAIL  $name  (expected=$expected, got=$got)"
    echo "  scan output:"
    sed 's/^/    /' /tmp/scan-out
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

# ---- Test cases -------------------------------------------------------------
echo "=== audit-marker scan self-test ==="
echo "Fixture root: $TMP_ROOT"
echo ""

f="$TMP_ROOT/case-clean";          make_clean_fixture          "$f"; assert_scan "clean build (no markers)"          "clean" "$f"
f="$TMP_ROOT/case-dist-js";        make_marker_in_dist_js      "$f"; assert_scan "marker in dist/*.js comment"        "dirty" "$f"
f="$TMP_ROOT/case-dist-map";       make_marker_in_sourcemap    "$f"; assert_scan "marker in dist/*.js.map (sourcesContent)" "dirty" "$f"
f="$TMP_ROOT/case-commonjs";       make_marker_in_commonjs     "$f"; assert_scan "§Sources in commonjs/*.js"          "dirty" "$f"
f="$TMP_ROOT/case-es";             make_marker_in_es           "$f"; assert_scan "marker in es/*.mjs"                 "dirty" "$f"

echo ""
echo "=== summary: $PASS_COUNT passed, $FAIL_COUNT failed ==="

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
