#!/usr/bin/env bash
#
# release - HyperFormula release automation.
# Doc: https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135
#
# Usage: release.sh <command> [options]
#
# Commands:
#   code-freeze <version> <release-date> [--real-run]   Start a code freeze.
#   publish <version> [--real-run]                      Publish a finished release.
#
# More commands will be added over time.
# Run 'release.sh <command> --help' for command-specific options.
#
set -Eeuo pipefail

# Stop on the first failure and say which step failed (nothing further runs).
CURRENT_STEP="startup"
trap 'rc=$?; printf "\nERROR: failed during \"%s\" (exit %s). Stopping - nothing further was run.\n" "$CURRENT_STEP" "$rc" >&2; exit $rc' ERR

# ---- shared helpers --------------------------------------------------------
PREVIEW_FENCE='    ----------------------------------------------------------------'
CHECKLIST_RULE='  ################################################################'

# Bold yellow, but only when writing to a terminal (keeps logs and pipes clean).
if [[ -t 1 ]]; then HIGHLIGHT=$'\033[1;33m'; RESET=$'\033[0m'; else HIGHLIGHT=''; RESET=''; fi

step() { CURRENT_STEP="$*"; printf '\n==> %s\n' "$*"; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
run()  { printf '    $ %s\n' "$(printf '%q ' "$@" | sed 's/ $//')"; $DRY_RUN || "$@"; }

# Shows generated file content verbatim (unindented, so a dry run displays
# exactly what would be written), fenced to mark where it starts and ends.
preview() { printf '%s\n%s\n%s\n' "$PREVIEW_FENCE" "$1" "$PREVIEW_FENCE"; }

# Prints the list of steps read from stdin in a highlighted box, so that what
# the script leaves for the operator to do by hand cannot be missed in the log.
manual_checklist() {
  printf '\n%s%s\n  WHAT IS LEFT FOR YOU TO DO BY HAND\n%s\n\n%s\n\n%s%s\n' \
    "$HIGHLIGHT" "$CHECKLIST_RULE" "$CHECKLIST_RULE" "$(cat)" "$CHECKLIST_RULE" "$RESET"
}

# Prints the body of a CHANGELOG.md section: every line between the given
# heading and the next '## ' heading, without the surrounding blank lines.
changelog_section_body() {
  awk -v heading="$1" '
    index($0, heading) == 1 { found = 1; next }
    found && /^## /         { exit }
    found                   { body = body $0 "\n" }
    END { sub(/^\n+/, "", body); sub(/\n+$/, "", body); if (body != "") print body }
  ' CHANGELOG.md
}

# Prints a step that needed no work. The '=' marker mirrors 'run's '$' marker,
# so a log line says at a glance whether a step acted or was already satisfied.
skip() { printf '    = %s\n' "$*"; }

# ---- state checks (idempotency) -------------------------------------------
# These answer "is this already done?" so every step can be re-run safely.
# They only read state, so they are also correct during a dry run.
# The two branch predicates - and only those two - take an optional repository
# path, so the same check works on a sibling clone; an empty string counts as
# omitted and means the current repository.
branch_exists()        { git -C "${2:-.}" show-ref --verify --quiet "refs/heads/$1"; }
# Asks for the full ref, so a name cannot match another branch that merely ends
# with it ('release/3.4.0' would otherwise also match 'old/release/3.4.0').
remote_branch_exists() { git -C "${2:-.}" ls-remote --heads origin "refs/heads/$1" 2>/dev/null | grep -q .; }
is_ancestor()          { git merge-base --is-ancestor "$1" "$2" 2>/dev/null; }
tag_exists()           { git rev-parse -q --verify "refs/tags/$1" >/dev/null; }
has_upstream()         { git rev-parse --abbrev-ref "$1@{upstream}" >/dev/null 2>&1; }
# A false answer means "not visible from here", which a registry outage produces
# too - so callers must not treat it as proof the version is unpublished. npm
# itself rejects a duplicate publish, and that rejection is the authority.
on_npm()               { npm view "hyperformula@$1" version >/dev/null 2>&1; }

# Verifies a sibling clone is usable before a release starts: present, a git
# work tree, clean, carrying the branches this run will move, with a reachable
# origin. Failing here costs nothing; failing half-way through leaves one of
# three repositories in a state someone has to untangle by hand.
# Reports the first problem it finds and returns 1 - it does not die itself, so
# a caller checking both sibling clones can report both in one run rather than
# stopping at whichever is checked first.
require_repo() { # require_repo <label> <path> <flag> <required branch...>
  local label="$1" dir="$2" flag="$3" branch; shift 3
  [[ -n "$dir" && -d "$dir" ]] \
    || { printf 'ERROR: %s\n' "$label clone not found at '${dir:-<unset>}' - pass $flag PATH." >&2; return 1; }
  git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || { printf 'ERROR: %s\n' "$dir is not a git repository ($label)." >&2; return 1; }
  [[ -z "$(git -C "$dir" status --porcelain)" ]] \
    || { printf 'ERROR: %s\n' "Working tree in $dir ($label) is dirty - commit or stash there first." >&2; return 1; }
  git -C "$dir" ls-remote --heads origin >/dev/null 2>&1 \
    || { printf 'ERROR: %s\n' "Cannot reach origin of $dir ($label)." >&2; return 1; }
  for branch in "$@"; do
    branch_exists "$branch" "$dir" || remote_branch_exists "$branch" "$dir" \
      || { printf 'ERROR: %s\n' "$label has no '$branch' branch ($dir)." >&2; return 1; }
  done
}

# Checks out a branch and fast-forwards it when it tracks a remote branch.
# Refuses to create a merge: a release must never invent history on develop or
# master, so a diverged branch is an error the operator has to look at.
# Precondition: the calling cmd_* function must have declared DRY_RUN - 'run'
# reads it through dynamic scoping, and without it the script dies under set -u
# before the ERR trap can name the failing step.
sync_branch() {
  run git checkout "$1"
  if has_upstream "$1"; then run git pull --ff-only
  else skip "$1 has no upstream - nothing to pull"; fi
}

# Merges a release ref into a target branch, unless it is already in there.
# Uses --no-ff so the release stays visible as a merge commit, matching what
# 'git flow release finish' produces. Merges the pinned TIP, never the ref:
# sync_branch's pull refreshes every remote-tracking ref, so a ref could name a
# newer commit than the one the preflight checked and reported. The ref is used
# only in messages.
merge_release_into() { # merge_release_into <target branch> <release ref, for messages> <release tip sha, merged>
  local target="$1" release_ref="$2" release_tip="$3"
  sync_branch "$target"
  if is_ancestor "$release_tip" "$target"; then
    skip "$release_ref already merged into $target"
  else
    run git merge --no-ff -m "Merge branch '$release_ref' into $target" "$release_tip"
  fi
}

# The point of no return. Prints what is about to happen and requires the
# operator to type the version back, so a stray Enter cannot publish.
confirm_publish() { # confirm_publish <version> <npm user>
  local version="$1" npm_user="$2" answer registry
  # Read the registry into a variable first, tolerating failure: substituting the
  # command inline would blank the line and print npm's stderr into the middle of
  # the box, breaking the one banner in this script that must not be missed.
  # Note this shows npm's configured registry; a publishConfig.registry in
  # package.json would override it for the actual publish - there is none today.
  registry="$(npm config get registry 2>/dev/null || true)"
  printf '\n%s%s\n  ABOUT TO PUBLISH %s TO npm - THIS CANNOT BE UNDONE\n%s\n' \
    "$HIGHLIGHT" "$CHECKLIST_RULE" "$version" "$CHECKLIST_RULE"
  printf '  registry: %s\n  npm user: %s\n%s\n' \
    "${registry:-<unknown - could not read npm config>}" "$npm_user" "$RESET"
  # A failed read means EOF or no terminal at all - a cron or CI invocation, say.
  # Name that case rather than letting the ERR trap report a generic step failure.
  read -r -p "  Type the version to publish (anything else aborts): " answer \
    || die "no answer at the publish confirmation (no terminal?) - nothing was published."
  [[ "$answer" == "$version" ]] || die "aborted at the publish confirmation (got '$answer')."
}

# Waits until the registry serves the new version, so the steps after publish
# (which install it) do not race npm's propagation.
wait_for_npm() { # wait_for_npm <version>
  local version="$1" waited=0
  until on_npm "$version"; do
    # Say that the publish itself succeeded: by this point it has, and a bare
    # "not visible" reads like the publish failed, which would invite a retry.
    [[ $waited -ge 60 ]] && die "npm publish reported success, but hyperformula@$version is still not visible on npm after ${waited}s - check the registry before retrying."
    sleep 5; waited=$((waited + 5))
    printf '    waiting for hyperformula@%s on npm (%ss)\n' "$version" "$waited"
  done
}

usage_top() {
cat <<'USAGE'
release - HyperFormula release automation.

Usage: release.sh <command> [options]

Commands:
  code-freeze <version> <release-date> [--real-run]   Start a code freeze.
  publish <version> [--real-run]                      Publish a finished release.

Run 'release.sh <command> --help' for command-specific options.
USAGE
}

usage_code_freeze() {
cat <<'USAGE'
Usage: release.sh code-freeze <version> <release-date> [options]

Starts a HyperFormula code freeze. Previews by default (prints commands,
changes nothing); add --real-run to make changes.

Requires usable hyperformula-tests and hyperformula-demos clones (present,
clean, with a reachable origin) - it exits early otherwise.

Options:
  --real-run         Actually run the commands (default is a dry-run preview).
  --demos-dir PATH   hyperformula-demos clone (default: ../hyperformula-demos).
  --tests-dir PATH   hyperformula-tests clone (default: test/hyperformula-tests).

Examples:
  release.sh code-freeze 2.1.0 2026-08-30              # preview (dry run)
  release.sh code-freeze 2.1.0 2026-08-30 --real-run   # do it for real
USAGE
}

usage_publish() {
cat <<'USAGE'
Usage: release.sh publish <version> [options]

Publishes a finished release: merges release/<version> into master and develop,
tags it, pushes, publishes to npm (after an interactive confirmation), and
updates hyperformula-tests and hyperformula-demos. Previews by default (prints
commands, changes nothing); add --real-run to make changes.

Requires release/<version> to exist in this repo AND in hyperformula-tests -
run 'release.sh code-freeze' first. Every step checks whether it is already
done, so a failed run is recovered by running the same command again.

Options:
  --real-run         Actually run the commands (default is a dry-run preview).
  --skip-build       Skip 'npm ci' + 'npm run bundle-all' (the on-disk build is
                     assumed to match the release commit). The package check
                     still runs. Meant for a fast resume after a late failure.
  --demos-dir PATH   hyperformula-demos clone (default: ../hyperformula-demos).
  --tests-dir PATH   hyperformula-tests clone (default: test/hyperformula-tests).

Examples:
  release.sh publish 2.1.0                          # preview (dry run)
  release.sh publish 2.1.0 --real-run               # do it for real
  release.sh publish 2.1.0 --real-run --skip-build  # resume without rebuilding
USAGE
}

# ============================================================================
# Command: code-freeze
# ============================================================================
cmd_code_freeze() {
local DRY_RUN=true DEMOS_DIR="" TESTS_DIR="" VERSION="" DATE_ISO=""

# ---- args ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --real-run)     DRY_RUN=false ;;
    --dry-run)      DRY_RUN=true ;;
    --demos-dir)    [[ $# -ge 2 ]] || die "Missing value for $1"; DEMOS_DIR="$2"; shift ;;
    --tests-dir)    [[ $# -ge 2 ]] || die "Missing value for $1"; TESTS_DIR="$2"; shift ;;
    -h|--help)      usage_code_freeze; exit 0 ;;
    -*)             die "Unknown option: $1" ;;
    *) if   [[ -z "$VERSION"  ]]; then VERSION="$1"
       elif [[ -z "$DATE_ISO" ]]; then DATE_ISO="$1"
       else die "Unexpected arg: $1"; fi ;;
  esac
  shift
done

[[ -n "$VERSION"  ]] || read -r -p "New version (e.g. 2.1.0): " VERSION
[[ -n "$DATE_ISO" ]] || read -r -p "Release date (YYYY-MM-DD): " DATE_ISO
[[ "$VERSION"  =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || die "Bad version: $VERSION"
[[ "$DATE_ISO" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || die "Bad date (want YYYY-MM-DD): $DATE_ISO"

# ---- sanity checks ----
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repo."
[[ -f package.json ]] || die "No package.json here - run from the hyperformula repo root."
branch_exists develop || die "No 'develop' branch."
command -v npm >/dev/null || die "npm not found."

# ---- derive dates + release type ----
# ht.config.js wants DD/MM/YYYY; release notes want "Month D, YYYY".
DATE_HT="$(CF="$DATE_ISO"   node -e 'const[y,m,d]=process.env.CF.split("-");console.log(`${d}/${m}/${y}`)')"
DATE_LONG="$(CF="$DATE_ISO" node -e 'console.log(new Date(process.env.CF+"T00:00:00").toLocaleString("en-US",{month:"long",day:"numeric",year:"numeric"}))')"

# Read the pre-release version from develop rather than the working tree: on a
# resumed freeze the tree already carries the bump, which would read as a patch
# release and silently skip step 8's demos and CodeSandbox work. develop holds
# the old version until 'publish' merges the release back. Falls back to the
# tree if develop cannot be read, so an unusual checkout still gets an answer.
PRE_FREEZE_VERSION="$(git show develop:package.json 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).version||"")}catch(e){}})' 2>/dev/null || true)"
if [[ -z "$PRE_FREEZE_VERSION" ]]; then
  PRE_FREEZE_VERSION="$(node -e 'process.stdout.write(require("./package.json").version||"")' 2>/dev/null || true)"
  echo "    ! could not read develop's package.json - classifying the release against the checked-out"
  echo "      version (${PRE_FREEZE_VERSION:-unknown}), which on a resumed freeze can read a minor release as a patch."
fi
IFS='.' read -r nM nm _ <<<"$VERSION"
IFS='.' read -r cM cm _ <<<"${PRE_FREEZE_VERSION:-0.0.0}"
if   [[ "$nM" != "$cM" ]]; then RELEASE_TYPE='major'
elif [[ "$nm" != "$cm" ]]; then RELEASE_TYPE='minor'
else RELEASE_TYPE='patch'; fi
VERSION_BRANCH="${nM}.${nm}.x"

# default repo locations (run from the hyperformula repo root):
#   demos: sibling ../hyperformula-demos      tests: ./test/hyperformula-tests
PARENT="$(dirname "$PWD")"
[[ -z "$DEMOS_DIR" && -d "$PARENT/hyperformula-demos"   ]] && DEMOS_DIR="$PARENT/hyperformula-demos"
[[ -z "$TESTS_DIR" && -d "$PWD/test/hyperformula-tests" ]] && TESTS_DIR="$PWD/test/hyperformula-tests"

# Both sibling repositories are part of a freeze, so verify them before doing
# anything: a freeze that half-runs across three repositories is worse than one
# that refuses to start. The demos clone is required even for a patch release
# (where step 8 is skipped) - the check is about the environment being complete.
# Both run unconditionally so a run missing both clones reports both, instead
# of stopping at whichever is checked first and hiding the second problem.
SIBLINGS_OK=true
require_repo hyperformula-tests "$TESTS_DIR" --tests-dir develop || SIBLINGS_OK=false
require_repo hyperformula-demos "$DEMOS_DIR" --demos-dir develop || SIBLINGS_OK=false
$SIBLINGS_OK || die "Fix the sibling clone problem(s) reported above before continuing."

step "Plan"
cat <<INFO
  version:      $VERSION   (was ${PRE_FREEZE_VERSION:-unknown}, $RELEASE_TYPE release)
  release date: $DATE_ISO  (ht.config.js: $DATE_HT | release notes: $DATE_LONG)
  demos repo:   $DEMOS_DIR$( [[ $RELEASE_TYPE == patch ]] && echo '  (skipped: patch)')
  tests repo:   $TESTS_DIR
  mode:         $($DRY_RUN && echo 'DRY RUN (preview; pass --real-run to make changes)' || echo 'REAL RUN (making changes)')
INFO

# 1. Get onto release/$VERSION - creating it off develop the first time, and
#    resuming an existing one (local or on origin) on a re-run.
step "1. Get onto release/$VERSION"
if branch_exists "release/$VERSION"; then
  skip "release/$VERSION exists locally - resuming the freeze"
  sync_branch "release/$VERSION"
elif remote_branch_exists "release/$VERSION"; then
  skip "release/$VERSION exists on origin - resuming the freeze"
  # remote_branch_exists asks the remote directly, so the local tracking ref may
  # not exist yet. Fetch the branch before creating a local one from it. Without
  # this, resuming in a clone that has not fetched since the branch was pushed -
  # a colleague's machine, a single-branch or shallow checkout - fails on
  # 'origin/release/<version>' not being a commit.
  run git fetch origin "release/$VERSION"
  run git checkout -b "release/$VERSION" "origin/release/$VERSION"
else
  run git checkout develop
  run git pull
  run git checkout -b "release/$VERSION" develop
fi

# 2. Private test suite (fetch-tests.sh follows the current branch name)
step "2. Sync the private test suite"
run npm run test:setup-private

# 3. Bump version + release date (each half skipped when already correct, so a
#    re-run after a later failure does not rewrite files it already wrote)
step "3. Bump version + HT_RELEASE_DATE"
CURRENT_VERSION="$(node -e 'process.stdout.write(require("./package.json").version||"")' 2>/dev/null || true)"
if [[ "$CURRENT_VERSION" == "$VERSION" ]]; then
  skip "package.json already at $VERSION"
elif $DRY_RUN; then
  echo "    (set package.json version=$VERSION)"
else
  CF_V="$VERSION" node -e 'const f="package.json",j=require("./"+f);j.version=process.env.CF_V;require("fs").writeFileSync(f,JSON.stringify(j,null,2)+"\n")'
  echo "    package.json version -> $VERSION"
fi

# Read the current date only once the file is known to exist and carry the key:
# under 'set -Eeuo pipefail' a sed against a missing file fails the assignment
# and trips the ERR trap, which would kill the run before the guard below could
# report the problem in its own words.
if [[ ! -f ht.config.js ]] || ! grep -q HT_RELEASE_DATE ht.config.js; then
  echo "    ! HT_RELEASE_DATE not found in ht.config.js - set it to $DATE_HT manually."
else
  # Accept either quote style, matching the write below: a double-quoted value
  # the read could not see would defeat the skip this step exists to add.
  CURRENT_HT_DATE="$(sed -n "s/.*HT_RELEASE_DATE[[:space:]]*:[[:space:]]*['\"]\([^'\"]*\)['\"].*/\1/p" ht.config.js | head -1 || true)"
  if [[ "$CURRENT_HT_DATE" == "$DATE_HT" ]]; then
    skip "ht.config.js HT_RELEASE_DATE already $DATE_HT"
  elif $DRY_RUN; then
    echo "    (set ht.config.js HT_RELEASE_DATE='$DATE_HT')"
  else
    CF_D="$DATE_HT" node -e 'const f="ht.config.js",fs=require("fs");let s=fs.readFileSync(f,"utf8");s=s.replace(/(HT_RELEASE_DATE\s*:\s*)([\x27"])[^\x27"]*\2/,`$1$2${process.env.CF_D}$2`);fs.writeFileSync(f,s)'
    echo "    ht.config.js HT_RELEASE_DATE -> $DATE_HT"
  fi
fi

# 4. Regenerate the lock file. A lock file naming the new version alongside an
#    installed node_modules is a reasonable signal that the reinstall already
#    ran; it does not prove the dependency tree is still current. Both are
#    required, because an interrupted 'npm i' can leave the lock file written
#    while node_modules is missing - and skipping then would take a broken
#    install straight into the build.
step "4. Reinstall dependencies"
LOCK_VERSION="$(node -e 'try{process.stdout.write(require("./package-lock.json").version||"")}catch(e){}' 2>/dev/null || true)"
if [[ "$LOCK_VERSION" == "$VERSION" && -d node_modules ]]; then
  skip "package-lock.json already regenerated for $VERSION"
else
  run rm -rf ./node_modules
  run rm -f package-lock.json
  run npm i
fi

# 5. Build / lint / test  (the private test suite was already pointed at this
#    branch in step 2, and nothing since has changed the branch it follows)
step "5. Build, lint + test"
run npm run bundle-all
run npm run lint
run npm run test:jest

# 6. CHANGELOG.md - add version heading under [Unreleased]
step "6. Update CHANGELOG.md"
if [[ ! -f CHANGELOG.md ]] || ! grep -q '^## \[Unreleased\]' CHANGELOG.md; then
  echo "    ! Couldn't find '## [Unreleased]' - add the $VERSION entry manually."
elif grep -q "^## \[$VERSION\]" CHANGELOG.md; then
  skip "already has an entry for $VERSION"
elif $DRY_RUN; then
  echo "    (insert '## [$VERSION] - $DATE_ISO' under [Unreleased] - the new section will read:)"
  preview "$(printf '## [%s] - %s\n\n%s' "$VERSION" "$DATE_ISO" "$(changelog_section_body '## [Unreleased]')")"
else
  tmp="$(mktemp)"
  awk -v v="## [$VERSION] - $DATE_ISO" '
    {print}
    /^## \[Unreleased\]/ && !d {print ""; print v; d=1}' CHANGELOG.md >"$tmp" && mv "$tmp" CHANGELOG.md
  echo "    inserted '## [$VERSION] - $DATE_ISO'"
fi

# 7. Release notes - transform the changelog entry into release-notes.md
#    (## [x] - iso  ->  ## x  +  **Release date: Month D, YYYY**  + same bullets)
step "7. Generate release notes"
RN="docs/guide/release-notes.md"
if [[ ! -f CHANGELOG.md || ! -f "$RN" ]]; then
  echo "    ! CHANGELOG.md or $RN missing - skipping."
else
  CF_V="$VERSION" CF_LONG="$DATE_LONG" CF_RN="$RN" CF_FENCE="$PREVIEW_FENCE" \
  CF_DRY="$($DRY_RUN && echo 1 || echo '')" node <<'NODE'
const fs = require('fs');
const v = process.env.CF_V, long = process.env.CF_LONG, rnPath = process.env.CF_RN;
const dryRun = process.env.CF_DRY === '1';
const esc = v.replace(/\./g, '\\.');

// pull this version's block out of the changelog
const cl = fs.readFileSync('CHANGELOG.md', 'utf8').split('\n');
let start = cl.findIndex(l => new RegExp('^## \\[' + esc + '\\]').test(l));
// in a dry run step 6 has not inserted the version heading yet, so the bullets
// that will end up under it are still the ones under [Unreleased]
if (start === -1 && dryRun) start = cl.findIndex(l => /^## \[Unreleased\]/.test(l));
if (start === -1) { console.log('    ! no changelog entry for ' + v + ' - skipping'); process.exit(0); }
let end = cl.findIndex((l, i) => i > start && /^## \[/.test(l));
if (end === -1) end = cl.length;
const body = cl.slice(start + 1, end).join('\n').replace(/^\n+/, '').replace(/\n+$/, '');

const rnLines = fs.readFileSync(rnPath, 'utf8').split('\n');
if (rnLines.some(l => new RegExp('^## ' + esc + '\\s*$').test(l))) {
  console.log('    = release notes already has ' + v); process.exit(0);
}
const entry = '## ' + v + '\n\n**Release date: ' + long + '**\n\n' + body + '\n';
if (dryRun) {
  console.log('    (add to the top of ' + rnPath + ':)' +
              (body ? '' : '  ! no bullets - [Unreleased] is empty'));
  console.log(process.env.CF_FENCE + '\n' + entry.replace(/\n+$/, '') + '\n' + process.env.CF_FENCE);
  process.exit(0);
}
let idx = rnLines.findIndex(l => /^## /.test(l));           // before newest existing entry
if (idx === -1) idx = rnLines.length;                        // or append if none
const head = rnLines.slice(0, idx).join('\n').replace(/\n+$/, '');
const tail = rnLines.slice(idx).join('\n');
let out = head + '\n\n' + entry + '\n' + tail;
out = out.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
fs.writeFileSync(rnPath, out);
console.log('    added "## ' + v + '" to ' + rnPath +
            (body ? '' : ' (no bullets - [Unreleased] was empty)'));
NODE
fi

# 8. Major/minor only: hyperformula-demos + CodeSandbox URLs in docs/
step "8. Demos + docs URLs (major/minor only)"
if [[ "$RELEASE_TYPE" == patch ]]; then
  echo "    skipped (patch release)"
else
  # The sanity checks have already proved the demos clone is usable.
  echo "    updating $DEMOS_DIR -> $VERSION, branch $VERSION_BRANCH"
  ( cd "$DEMOS_DIR"
    run git checkout develop
    run git pull
    run sh set-hyperformula-version.sh "$VERSION"
    run git add .
    if $DRY_RUN || [[ -n "$(git status --porcelain)" ]]; then
      run git commit -m "Set hyperformula version for all demos"
    else
      skip "demos already at $VERSION - no commit needed"
    fi
    run git push
    if branch_exists "$VERSION_BRANCH"; then
      run git checkout "$VERSION_BRANCH"
    elif remote_branch_exists "$VERSION_BRANCH"; then
      run git checkout -b "$VERSION_BRANCH" "origin/$VERSION_BRANCH"
    else
      run git checkout -b "$VERSION_BRANCH"
    fi
    run git push -u origin "$VERSION_BRANCH" )
  [[ "$RELEASE_TYPE" == major ]] && echo "    ! major: manually test demos against the rc build."
  # CodeSandbox demo URLs in this repo's docs/: point every one at the new
  # branch, whatever branch it names now (old releases left several behind)
  if [[ -d docs ]]; then
    CF_NEW="$VERSION_BRANCH" CF_FENCE="$PREVIEW_FENCE" \
    CF_DRY="$($DRY_RUN && echo 1 || echo '')" perl - docs <<'PERL'
use strict;
use warnings;
use File::Find;

my $treeUrl = 'handsontable/hyperformula-demos/tree';
my $branch  = $ENV{CF_NEW};
my $dryRun  = ($ENV{CF_DRY} // '') eq '1';

# One path segment of a demo URL: up to the next '/' or to whatever ends the
# URL in markdown, HTML, a query string or code. A demo URL is 'tree/' plus the
# branch, optionally followed by the demo folder.
my $segment = qr{[^/\s"'`<>()\[\]?#]+};
my $demoUrl = qr{(\Q$treeUrl\E)/($segment)((?:/$segment)?)};

# Demos that no longer exist on the current branch, so their URLs have to keep
# naming the last branch that has them: vue-demo is the Vue 2 example, replaced
# by vue-3-demo after 2.5.x.
my %pinnedDemos = map { $_ => 1 } qw(vue-demo);

my @docFiles;
find(sub { push @docFiles, $File::Find::name if -f && -T }, @ARGV);

my (@previewLines, @rewrittenFiles);
for my $file (sort @docFiles) {
  open my $in, '<', $file or next;
  my @lines = <$in>;
  close $in;

  my $lineNo = 0;
  my $rewritten = 0;
  for my $line (@lines) {
    $lineNo++;
    my $before = $line;
    $line =~ s{$demoUrl}{
      my ($url, $namedBranch, $demoPath) = ($1, $2, $3);
      my ($demo) = $demoPath =~ m{^/(.+)$};
      my $keepPinned = defined $demo && $pinnedDemos{$demo};
      $url . '/' . ($keepPinned ? $namedBranch : $branch) . $demoPath;
    }ge;
    next if $line eq $before;
    $rewritten = 1;
    my ($from, $to) = ($before, $line);
    chomp $from;
    chomp $to;
    push @previewLines, "$file:$lineNo\n-$from\n+$to";
  }
  next unless $rewritten;

  push @rewrittenFiles, $file;
  next if $dryRun;
  open my $out, '>', $file or die "cannot write $file: $!";
  print {$out} @lines;
  close $out;
}

my $count = scalar @rewrittenFiles;
if (!$count) {
  print "    no CodeSandbox URLs to update - all point at tree/$branch already\n";
} elsif ($dryRun) {
  print "    (point every CodeSandbox URL at tree/$branch, in $count file(s):)\n";
  # every matching line, as it is now (-) and as it would be rewritten (+)
  print join("\n", $ENV{CF_FENCE}, @previewLines, $ENV{CF_FENCE}), "\n";
} else {
  print "    updated CodeSandbox URLs -> tree/$branch in $count file(s)\n";
}
PERL
  fi
fi

# 9. Commit the release branch and publish it (git flow release publish = push)
step "9. Commit + push release/$VERSION"
run git add .
if $DRY_RUN || [[ -n "$(git status --porcelain)" ]]; then
  run git commit -m "$VERSION"
else
  skip "nothing to commit"
fi
run git push -u origin "release/$VERSION"

# 10. hyperformula-tests: give the freeze its own branch there and publish it,
#     so CI and other developers can add tests during the freeze. 'publish'
#     merges it back. (The process doc still describes the older
#     'checkout master && pull origin develop' - see release-README.md.)
#     The sanity checks have already proved the clone is usable, so there is no
#     "repo not found" path here.
step "10. Create + push release/$VERSION in hyperformula-tests"
( cd "$TESTS_DIR"
  run git fetch origin
  if branch_exists "release/$VERSION"; then
    skip "release/$VERSION already exists in the tests repo"
    sync_branch "release/$VERSION"
  elif remote_branch_exists "release/$VERSION"; then
    skip "release/$VERSION exists on the tests repo's origin"
    run git checkout -b "release/$VERSION" "origin/release/$VERSION"
  else
    run git checkout develop
    run git pull --ff-only
    run git checkout -b "release/$VERSION"
  fi
  run git push -u origin "release/$VERSION" )

step "Done - release/$VERSION is ready for the freeze"
if $DRY_RUN; then echo "  (dry run - nothing changed; re-run with --real-run to do it for real)"; fi

manual_checklist <<NEXT
  [ ] Post a heads-up about the code freeze in #hyperformula and #release

  During the freeze:
  [ ] Review the docs changes (GitHub compare)
  [ ] Test the code examples on staging
  [ ] Work with marketing on the blog post and social media content
NEXT
exit 0
}

# ============================================================================
# Command: publish
# ============================================================================
cmd_publish() {
local DRY_RUN=true SKIP_BUILD=false DEMOS_DIR="" TESTS_DIR="" VERSION=""

# ---- args ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --real-run)     DRY_RUN=false ;;
    --dry-run)      DRY_RUN=true ;;
    --skip-build)   SKIP_BUILD=true ;;
    --demos-dir)    [[ $# -ge 2 ]] || die "Missing value for $1"; DEMOS_DIR="$2"; shift ;;
    --tests-dir)    [[ $# -ge 2 ]] || die "Missing value for $1"; TESTS_DIR="$2"; shift ;;
    -h|--help)      usage_publish; exit 0 ;;
    -*)             die "Unknown option: $1" ;;
    *) if [[ -z "$VERSION" ]]; then VERSION="$1"
       else die "Unexpected arg: $1"; fi ;;
  esac
  shift
done

[[ -n "$VERSION" ]] || read -r -p "Version to publish (e.g. 2.1.0): " VERSION
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || die "Bad version: $VERSION"

# ---- sanity checks ----
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repo."
[[ -f package.json ]] || die "No package.json here - run from the hyperformula repo root."
command -v npm >/dev/null || die "npm not found."
branch_exists master  || die "No 'master' branch."
branch_exists develop || die "No 'develop' branch."
[[ -z "$(git status --porcelain)" ]] || die "Working tree is dirty - commit or stash first."

# default repo locations, as in code-freeze
PARENT="$(dirname "$PWD")"
[[ -z "$DEMOS_DIR" && -d "$PARENT/hyperformula-demos"   ]] && DEMOS_DIR="$PARENT/hyperformula-demos"
[[ -z "$TESTS_DIR" && -d "$PWD/test/hyperformula-tests" ]] && TESTS_DIR="$PWD/test/hyperformula-tests"

# Both sibling repositories are written to during a publish, so both are
# required - same rule as code-freeze. The tests repo also needs master, which
# step 6 merges into. Both run unconditionally, same reason as code-freeze.
SIBLINGS_OK=true
require_repo hyperformula-tests "$TESTS_DIR" --tests-dir master develop || SIBLINGS_OK=false
require_repo hyperformula-demos "$DEMOS_DIR" --demos-dir develop || SIBLINGS_OK=false
$SIBLINGS_OK || die "Fix the sibling clone problem(s) reported above before continuing."

step "Preflight"
# Fetching writes only refs the release reads (remote-tracking branches, and
# local tags via --tags), never the working tree - so it is safe in a dry run,
# and every "is this already done?" check below needs the fresh state. Marked
# "(always runs)" because elsewhere a '$' line means "only with --real-run".
printf '    $ git fetch origin --tags   (always runs)\n'
git fetch origin --tags >/dev/null 2>&1 || die "git fetch origin failed."

# Both release branches are prerequisites: 'publish' finishes a freeze, it never
# improvises one. A missing branch means the freeze did not run for this version,
# so it is an error rather than a step to skip. Prefer the local branch and fall
# back to origin's, so publishing works from a fresh clone too.
if branch_exists "release/$VERSION"; then
  RELEASE_REF="release/$VERSION"
elif remote_branch_exists "release/$VERSION"; then
  RELEASE_REF="origin/release/$VERSION"
else
  die "No release/$VERSION branch (local or on origin) - run 'release.sh code-freeze $VERSION <date>' first."
fi

# A local release branch can be stale - someone may have pushed a late fix to
# the freeze branch. Publishing the local tip would silently drop it, so require
# the two to agree rather than guessing which is wanted.
if [[ "$RELEASE_REF" == "release/$VERSION" ]] && remote_branch_exists "release/$VERSION"; then
  LOCAL_TIP="$(git rev-parse "release/$VERSION")"
  ORIGIN_TIP="$(git rev-parse "origin/release/$VERSION" 2>/dev/null || true)"
  [[ -n "$ORIGIN_TIP" && "$LOCAL_TIP" == "$ORIGIN_TIP" ]] \
    || die "Local release/$VERSION ($LOCAL_TIP) differs from origin ($ORIGIN_TIP) - reconcile them first: git checkout release/$VERSION && git pull --ff-only"
fi
RELEASE_TIP="$(git rev-parse "$RELEASE_REF")"
# Tolerant read, then explicit checks: under 'pipefail' an unreadable file or a
# throwing JSON.parse would fail this assignment and trip the ERR trap, which
# reports far less than the two messages below.
REF_VERSION="$(git show "$RELEASE_REF:package.json" 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).version||"")}catch(e){}})' 2>/dev/null || true)"
[[ -n "$REF_VERSION" ]] \
  || die "Could not read a version from package.json on $RELEASE_REF."
[[ "$REF_VERSION" == "$VERSION" ]] \
  || die "package.json on $RELEASE_REF says $REF_VERSION, not $VERSION."

# Same requirement in the tests repo, checked here so the run fails before it
# touches master, rather than half-way through the merge-back. Use the shared
# predicates with their repo-path argument: a raw 'ls-remote --heads origin
# release/X' matches by path component, so an unrelated 'old/release/X' would
# satisfy it - the collision remote_branch_exists exists to prevent.
printf '    $ git -C %s fetch origin   (always runs)\n' "$TESTS_DIR"
git -C "$TESTS_DIR" fetch origin >/dev/null 2>&1 || die "git fetch failed in $TESTS_DIR."
if branch_exists "release/$VERSION" "$TESTS_DIR"; then
  TESTS_REF="release/$VERSION"
elif remote_branch_exists "release/$VERSION" "$TESTS_DIR"; then
  TESTS_REF="origin/release/$VERSION"
else
  die "No release/$VERSION branch in the tests repo ($TESTS_DIR) - the freeze did not create it."
fi
# Same divergence guard as the public repo above: a stale local branch here
# would silently drop a test pushed to the freeze branch by someone else.
if [[ "$TESTS_REF" == "release/$VERSION" ]] && remote_branch_exists "release/$VERSION" "$TESTS_DIR"; then
  LOCAL_TESTS_TIP="$(git -C "$TESTS_DIR" rev-parse "release/$VERSION")"
  ORIGIN_TESTS_TIP="$(git -C "$TESTS_DIR" rev-parse "origin/release/$VERSION" 2>/dev/null || true)"
  [[ -n "$ORIGIN_TESTS_TIP" && "$LOCAL_TESTS_TIP" == "$ORIGIN_TESTS_TIP" ]] \
    || die "Local release/$VERSION in the tests repo ($LOCAL_TESTS_TIP) differs from origin ($ORIGIN_TESTS_TIP) - reconcile them first: git -C $TESTS_DIR checkout release/$VERSION && git -C $TESTS_DIR pull --ff-only"
fi
# Pinned here, like RELEASE_TIP: the merge below must use the commit this
# preflight verified, not whatever the ref names once sync_branch has pulled.
TESTS_TIP="$(git -C "$TESTS_DIR" rev-parse "$TESTS_REF")"

NPM_USER="$(npm whoami 2>/dev/null || true)"
if [[ -z "$NPM_USER" ]]; then
  $DRY_RUN || die "npm whoami failed - run 'npm login' first."
  NPM_USER="<not logged in>"
fi

IFS='.' read -r nM nm _ <<<"$VERSION"
VERSION_BRANCH="${nM}.${nm}.x"

step "Plan"
cat <<INFO
  version:      $VERSION
  release ref:  $RELEASE_REF
  npm user:     $NPM_USER
  demos repo:   $DEMOS_DIR  (branch $VERSION_BRANCH)
  tests repo:   $TESTS_DIR  ($TESTS_REF)
  build:        $($SKIP_BUILD && echo 'SKIPPED (--skip-build; package check still runs)' || echo 'npm ci + bundle-all + package check')
  mode:         $($DRY_RUN && echo 'DRY RUN (preview; pass --real-run to make changes)' || echo 'REAL RUN (making changes)')
INFO

# 1. master gets the release
step "1. Merge $RELEASE_REF into master"
merge_release_into master "$RELEASE_REF" "$RELEASE_TIP"

# 2. Tag the release on master (git flow release finish tags here)
step "2. Tag $VERSION"
if tag_exists "$VERSION"; then
  if is_ancestor "refs/tags/$VERSION" master; then
    skip "tag $VERSION already exists on master's history"
  else
    die "tag $VERSION exists but is not in master's history - check it before continuing."
  fi
else
  run git tag -a "$VERSION" -m "$VERSION"
fi

# 3. develop gets the release too
step "3. Merge $RELEASE_REF into develop"
merge_release_into develop "$RELEASE_REF" "$RELEASE_TIP"

# 4. Build what is about to be published, from master
step "4. Build + verify the package"
run git checkout master
if $SKIP_BUILD; then
  skip "--skip-build: reusing the build on disk (npm ci + bundle-all not run)"
else
  run npm ci
  run npm run bundle-all
fi
run npm run verify:publish-package

# 5. Publish the branches and the tag before the package, so the commit that
#    npm publish ships is already on origin. --atomic so a rejected master
#    cannot leave the tag and develop published on their own.
step "5. Push master, develop and tags"
run git push --atomic origin master develop --tags

# 6. hyperformula-tests: the freeze branch created by 'code-freeze' goes back
#    into master and develop. No tag - that repo is not versioned. (The process
#    doc predates this; see release-README.md.)
step "6. Merge $TESTS_REF back in hyperformula-tests"
# Preflight proved the clone, the branch and a clean tree, already fetched, and
# pinned TESTS_TIP - so this is a straight merge of a fixed commit. No
# 'trap - ERR' here: a failure inside this subshell must still name the step.
( cd "$TESTS_DIR"
  merge_release_into master  "$TESTS_REF" "$TESTS_TIP"
  merge_release_into develop "$TESTS_REF" "$TESTS_TIP"
  run git push --atomic origin master develop )

# 7. The only irreversible step, behind a typed confirmation. Both the pause
#    and the publish are skipped when the version is already on the registry,
#    which is what makes a re-run after a mid-publish failure safe.
step "7. Publish hyperformula@$VERSION to npm"
if on_npm "$VERSION"; then
  skip "hyperformula@$VERSION is already on npm - not publishing again"
elif $DRY_RUN; then
  echo "    (would ask for confirmation, then run: npm publish)"
else
  confirm_publish "$VERSION" "$NPM_USER"
  run npm publish
  wait_for_npm "$VERSION"
fi

# 8. Demos consume the published version, so they come after the publish.
#    Preflight has already proved the clone is usable. No 'trap - ERR' here: a
#    failure inside this subshell must still name the step.
step "8. Update hyperformula-demos"
( cd "$DEMOS_DIR"
  run git fetch origin
  sync_branch develop
  run sh update-hyperformula-in-lock-files.sh
  if $DRY_RUN || [[ -n "$(git status --porcelain)" ]]; then
    run git add .
    run git commit -m "Update hyperformula version in all lock files"
  else
    skip "lock files already up to date - nothing to commit"
  fi
  run git push origin develop

  # sync_branch, not a raw checkout: the version branch is shared, and pushing
  # to it without fast-forwarding first is what broke the tests-repo step once.
  if branch_exists "$VERSION_BRANCH"; then
    sync_branch "$VERSION_BRANCH"
  elif remote_branch_exists "$VERSION_BRANCH"; then
    run git checkout -b "$VERSION_BRANCH" "origin/$VERSION_BRANCH"
  else
    run git checkout -b "$VERSION_BRANCH"
  fi
  if is_ancestor develop "$VERSION_BRANCH"; then
    skip "develop already merged into $VERSION_BRANCH"
  else
    run git merge --no-ff -m "Merge branch 'develop' into $VERSION_BRANCH" develop
  fi
  run git push -u origin "$VERSION_BRANCH" )

# 9. Leave the operator where the next cycle starts.
step "9. Back to develop"
run git checkout develop

step "Done - $VERSION is released"
if $DRY_RUN; then echo "  (dry run - nothing changed; re-run with --real-run to do it for real)"; fi

manual_checklist <<NEXT
  [ ] Create the GitHub release for $VERSION (body = the $VERSION section of CHANGELOG.md):
        https://github.com/handsontable/hyperformula/releases/new?tag=$VERSION&title=$VERSION
  [ ] Check that the docs workflow deployed the documentation to gh-pages
  [ ] Announce the release in #hyperformula and #release
  [ ] Close the GitHub and ClickUp tasks in this release, announcing $VERSION,
      notify everyone involved in the discussions, and check linked issues
  [ ] Review the deployed docs and test the demos
NEXT
exit 0
}

# ============================================================================
# Dispatch
# ============================================================================
# Only dispatch when executed. Sourcing the script (the test harness does this)
# just defines the helpers, so they can be exercised on their own.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  if [[ $# -eq 0 ]]; then usage_top; exit 0; fi
  COMMAND="$1"; shift
  case "$COMMAND" in
    code-freeze)    cmd_code_freeze "$@" ;;
    publish)        cmd_publish "$@" ;;
    -h|--help|help) usage_top ;;
    *) printf 'Unknown command: %s\n\n' "$COMMAND" >&2; usage_top >&2; exit 1 ;;
  esac
fi
