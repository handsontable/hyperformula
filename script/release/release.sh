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
# Whatever the run recorded - what it could not do, then what is worth checking -
# goes in the same box above the standing steps, because it is the more urgent
# part of the same list. Printed here rather than substituted into the callers'
# here-docs, where '$(...)' would strip the blank lines that separate the parts.
manual_checklist() {
  printf '\n%s%s\n  WHAT IS LEFT FOR YOU TO DO BY HAND\n%s\n\n' \
    "$HIGHLIGHT" "$CHECKLIST_RULE" "$CHECKLIST_RULE"
  recorded_warnings
  printf '%s\n\n%s%s\n' "$(cat)" "$CHECKLIST_RULE" "$RESET"
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

# ---- the warning register --------------------------------------------------
# Re-prints in the closing checklist anything the run needs the operator to act
# on. A lone marker line cannot carry that weight on its own: it scrolls by in
# the middle of a full 'npm i', build and test log, and the run then ends by
# announcing success.
# Two registers, because two different things get recorded and only one of them
# means the run did not do its job:
#   warn - a soft FAILURE: something the run was asked to do, could not do, and
#          carried on past. These change the closing banner.
#   note - an ADVISORY: the run did its job, but something is worth a look.
#          These are listed but do not change the banner, so that an ordinary
#          resume does not announce itself as a failure.
# Backed by files rather than variables so that a recording site inside a
# '( cd <clone> )' subshell or inside the node here-doc in step 7 can append
# too - neither can assign to a variable in this shell.
FAILURES_FILE=""
NOTES_FILE=""

# Both end in 'return 0': recording is never itself a failure, and without it
# the '[[ ]]' guard would trip errexit whenever the register is not open.
warn() { # warn <message>
  printf '    ! %s\n' "$*"
  [[ -n "$FAILURES_FILE" ]] && printf '%s\n' "$*" >>"$FAILURES_FILE"
  return 0
}
note() { # note <message>
  printf '    i %s\n' "$*"
  [[ -n "$NOTES_FILE" ]] && printf '%s\n' "$*" >>"$NOTES_FILE"
  return 0
}

# Opens both registers and exports them, so subshells and node can append too.
# Called once per command, before the first step.
start_warning_register() {
  FAILURES_FILE="$(mktemp)"
  NOTES_FILE="$(mktemp)"
  export FAILURES_FILE NOTES_FILE
  trap 'rm -f "$FAILURES_FILE" "$NOTES_FILE"' EXIT
}

# Counts soft failures only - advisories must not make a good run look bad.
warning_count() {
  [[ -n "$FAILURES_FILE" && -f "$FAILURES_FILE" ]] || { printf '0'; return 0; }
  awk 'END{printf "%d", NR}' "$FAILURES_FILE"
}

# Renders one register as checklist items under its heading, or nothing when it
# is empty. Duplicates are dropped, first occurrence winning, because the same
# condition can be reported by a preflight check and again by the step that
# hits it.
recorded_section() { # recorded_section <file> <heading>
  [[ -n "$1" && -s "$1" ]] || return 0
  printf '  %s\n' "$2"
  awk '!seen[$0]++' "$1" | sed 's/^/  [ ] /'
  printf '\n'
}

# Called by 'manual_checklist', so what the run could not do, what is worth
# checking, and the standing manual steps all land in the same highlighted box.
recorded_warnings() {
  recorded_section "$FAILURES_FILE" 'THE SCRIPT COULD NOT DO THESE - they are still yours to do:'
  recorded_section "$NOTES_FILE"    'WORTH CHECKING:'
}

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
require_repo() { # require_repo <label> <path> <remedy> <required branch...>
  local label="$1" dir="$2" remedy="$3" branch; shift 3
  [[ -n "$dir" && -d "$dir" ]] \
    || { printf 'ERROR: %s\n' "$label clone not found at '${dir:-<unset>}' - $remedy." >&2; return 1; }
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

# A sibling clone must also carry the script this run will execute inside it.
# Checked in the preflight, next to require_repo, because the alternative is
# finding out when the run is already half-way through three repositories - and
# in 'publish' the demos script runs after the npm publish that cannot be undone.
# Reports and returns 1 rather than dying, so it composes with require_repo's
# report-everything-then-stop pattern.
require_script() { # require_script <label> <path> <script>
  [[ -f "$2/$3" ]] \
    || { printf 'ERROR: %s\n' "$2 ($1) has no $3 - is that the right clone?" >&2; return 1; }
}

# Checks out a branch and fast-forwards it when it tracks a remote branch.
# Refuses to create a merge: a release must never invent history on develop or
# master, so a diverged branch is an error the operator has to look at.
# Precondition: the calling cmd_* function must have declared DRY_RUN - 'run'
# reads it through dynamic scoping, and without it the script dies under set -u
# before the ERR trap can name the failing step.
sync_branch() {
  run git checkout "$1"
  if has_upstream "$1"; then
    run git pull --ff-only
  elif remote_branch_exists "$1"; then
    # No upstream is not the same as nothing to pull. A branch created with a
    # plain 'git checkout -b' - which is how this script and 'git flow' both
    # make them - has no upstream, so 'git pull' has nothing to work from even
    # though origin may well have moved. Reconcile against origin's copy
    # explicitly instead of declaring the local branch authoritative: otherwise a
    # colleague's commit on a shared branch is silently ignored here and
    # surfaces as a raw non-fast-forward rejection at the next push.
    run git merge --ff-only "origin/$1"
  else
    skip "$1 is not on origin yet - nothing to pull"
  fi
}

# Gets onto a branch wherever it currently lives, and leaves it up to date:
# prefers the local branch (fast-forwarded, never merged), else creates it from
# origin's, else creates it from <base>. This replaced four hand-written copies
# of the same decision that had each drifted - one fast-forwarded an existing
# local branch and one pushed it stale, one fetched the branch first and one
# trusted a possibly cold remote-tracking ref, one pulled its base --ff-only and
# one pulled it plain. Every call site now gets the strictest of those.
#
# Fetching up front is what makes "does origin have it?" and "is my local copy
# behind?" answerable at all, so it always runs - safe in a dry run for the same
# reason publish's preflight fetch is: it writes remote-tracking refs, never the
# working tree. Marked "(always runs)" because elsewhere a '$' line means "only
# with --real-run".
#
# <base> is required: every caller is a step whose job includes creating the
# branch if it is not there yet. Where a branch is a PREREQUISITE rather than
# something to create - publish's release branches - use resolve_branch below,
# which refuses instead of improvising.
#
# Acts on the current repository, so a sibling clone is reached with
# '( cd <clone> ... )'. Does not push - the call sites differ on that.
# Precondition: DRY_RUN must be in scope, as for sync_branch.
checkout_branch() { # checkout_branch <branch> <base>
  local branch="$1" base="$2"
  printf '    $ git fetch origin   (always runs)\n'
  git fetch origin >/dev/null 2>&1 || die "Cannot reach origin from $(pwd)."
  if branch_exists "$branch"; then
    skip "$branch already exists here"
    sync_branch "$branch"
  elif remote_branch_exists "$branch"; then
    skip "$branch exists on origin - taking it from there"
    run git checkout -b "$branch" "origin/$branch"
  else
    sync_branch "$base"
    run git checkout -b "$branch" "$base"
  fi
}

# Names the ref a release should be read from - the local branch when there is
# one, otherwise origin's - and pins the commit it points at, without moving
# HEAD. Publish's preflight needs exactly that and so cannot use
# checkout_branch: it has to decide what it will merge, and prove it is the
# right thing, before anything moves. Pinning matters because sync_branch's pull
# later refreshes every remote-tracking ref, so the ref could come to name a
# newer commit than the one this preflight checked and reported.
# A local branch that disagrees with origin's is fatal rather than a silent
# choice: someone may have pushed a late fix to the freeze branch, and
# publishing the local tip would drop it.
# Sets RESOLVED_REF and RESOLVED_TIP, and dies with <remedy> on a missing
# branch - so call it directly, never inside a substitution, where 'die' would
# only exit the subshell.
resolve_branch() { # resolve_branch <branch> <repo dir> <remedy for a missing branch>
  local branch="$1" dir="$2" remedy="$3" local_tip origin_tip reconcile where
  # '.' is this repository. Name it that way in both the prose and the suggested
  # command, rather than telling the operator something is wrong "in .".
  if [[ "$dir" == "." ]]; then
    where="this repo"
    reconcile="git checkout $branch && git pull --ff-only"
  else
    where="$dir"
    reconcile="git -C $dir checkout $branch && git -C $dir pull --ff-only"
  fi
  if branch_exists "$branch" "$dir"; then
    RESOLVED_REF="$branch"
    if remote_branch_exists "$branch" "$dir"; then
      local_tip="$(git -C "$dir" rev-parse "$branch")"
      origin_tip="$(git -C "$dir" rev-parse "origin/$branch" 2>/dev/null || true)"
      [[ -n "$origin_tip" && "$local_tip" == "$origin_tip" ]] \
        || die "Local $branch in $where ($local_tip) differs from origin (${origin_tip:-missing}) - reconcile them first: $reconcile"
    fi
  elif remote_branch_exists "$branch" "$dir"; then
    RESOLVED_REF="origin/$branch"
  else
    die "No $branch branch in $where, local or on origin - $remedy."
  fi
  RESOLVED_TIP="$(git -C "$dir" rev-parse "$RESOLVED_REF")"
}

# Carries the demos clone's develop onto its M.m.x version branch and publishes
# it. Both commands finish their demos step this way - the freeze after setting
# the version, publish after refreshing the lock files - so the fast-forward and
# the merge guard live here once instead of in two copies that can drift.
# On a fresh minor the branch has just been created from develop, so the merge is
# already an ancestor and skips; on a re-run, or a branch that existed
# beforehand, this is what gets develop's commit onto it.
# Precondition: called from inside '( cd <demos clone> )', with DRY_RUN in scope.
merge_develop_into_version_branch() { # merge_develop_into_version_branch <M.m.x>
  local version_branch="$1"
  checkout_branch "$version_branch" develop
  if is_ancestor develop "$version_branch"; then
    skip "develop already merged into $version_branch"
  else
    run git merge --no-ff -m "Merge branch 'develop' into $version_branch" develop
  fi
  run git push -u origin "$version_branch"
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

Requires usable hyperformula-tests (test/hyperformula-tests) and
hyperformula-demos clones - present, clean, with a reachable origin - and a clean
working tree here unless it is resuming a freeze this clone already started.
It exits early otherwise.

Options:
  --real-run         Actually run the commands (default is a dry-run preview).
  --dry-run          Preview only. The default; useful to override an alias.
  --demos-dir PATH   hyperformula-demos clone (default: ../hyperformula-demos).

Examples:
  release.sh code-freeze 2.1.0 2026-08-30              # preview (dry run)
  release.sh code-freeze 2.1.0 2026-08-30 --real-run   # do it for real
USAGE
}

usage_publish() {
cat <<'USAGE'
Usage: release.sh publish <version> [options]

Publishes a finished release: builds, tests and verifies the package, merges
release/<version> into master and develop, tags it, pushes, publishes to npm
(after an interactive confirmation), and updates hyperformula-tests and
hyperformula-demos. Previews by default (prints commands, changes nothing);
add --real-run to make changes.

Requires release/<version> to exist in this repo AND in hyperformula-tests -
run 'release.sh code-freeze' first. Every step checks whether it is already
done, so a failed run is recovered by running the same command again.

Options:
  --real-run         Actually run the commands (default is a dry-run preview).
  --dry-run          Preview only. The default; useful to override an alias.
  --skip-build       Skip 'npm ci', 'npm run test' and 'npm run bundle-all' (the
                     on-disk build is assumed to match the release commit). The
                     package check still runs. Meant for a fast resume after a
                     late failure.
  --demos-dir PATH   hyperformula-demos clone (default: ../hyperformula-demos).

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
local DRY_RUN=true DEMOS_DIR="" VERSION="" DATE_ISO=""
start_warning_register

# ---- args ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --real-run)     DRY_RUN=false ;;
    --dry-run)      DRY_RUN=true ;;
    --demos-dir)    [[ $# -ge 2 ]] || die "Missing value for $1"; DEMOS_DIR="$2"; shift ;;
    -h|--help)      usage_code_freeze; exit 0 ;;
    -*)             die "Unknown option: $1" ;;
    *) if   [[ -z "$VERSION"  ]]; then VERSION="$1"
       elif [[ -z "$DATE_ISO" ]]; then DATE_ISO="$1"
       else die "Unexpected arg: $1"; fi ;;
  esac
  shift
done

# Name the no-terminal case rather than letting the ERR trap report a generic
# "startup" failure, the way confirm_publish does for its prompt.
[[ -n "$VERSION"  ]] || read -r -p "New version (e.g. 2.1.0): " VERSION \
  || die "no version given and no terminal to ask on."
[[ -n "$DATE_ISO" ]] || read -r -p "Release date (YYYY-MM-DD): " DATE_ISO \
  || die "no release date given and no terminal to ask on."
[[ "$VERSION"  =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || die "Bad version: $VERSION"
[[ "$DATE_ISO" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || die "Bad date (want YYYY-MM-DD): $DATE_ISO"

# The private test suite always lives here: test/fetch-tests.sh and the CI
# workflows all hardcode this path, so there is nothing to configure and no way
# for the freeze to end up validating one clone and mutating another.
TESTS_DIR="test/hyperformula-tests"

# ---- preflight ----
# Named, as in publish, so a failure in any of the checks below is reported
# against a step instead of against "startup".
step "Preflight"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repo."
[[ -f package.json ]] || die "No package.json here - run from the hyperformula repo root."
branch_exists develop || die "No 'develop' branch."
# node runs the version, date and release-notes edits; perl rewrites the demo
# URLs. Both are checked here rather than at first use, where a missing one
# would surface as an unnamed failure part-way through the freeze.
for tool in npm node perl; do
  command -v "$tool" >/dev/null || die "$tool not found."
done
# Fetch once, up front, so every check below is answered against fresh refs
# rather than whatever this clone last saw: the tag guard needs it (a tag someone
# else pushed is invisible until it is fetched, which is exactly the case the
# guard exists for), the resume detection needs it, and the release type is
# classified against origin's develop. '--tags' for the same reason as publish's
# preflight fetch. Same reasoning, and the same "(always runs)" marker, as that
# one: it writes refs, never the working tree, so it is safe in a preview.
printf '    $ git fetch origin --tags   (always runs)\n'
git fetch origin --tags >/dev/null 2>&1 || die "git fetch origin failed."

# A version that is already tagged has been released. Starting a freeze for it
# is a typo, not an intention, and it would collide at 'publish' at the latest.
tag_exists "$VERSION" && die "Tag $VERSION already exists - $VERSION is released. Did you mean a different version?"

# ---- derive dates + release type ----
# ht.config.js wants DD/MM/YYYY; release notes want "Month D, YYYY". node also
# rejects a well-formed date that does not exist: 2026-02-30 used to pass the
# regex above and then reach ht.config.js verbatim as 30/02/2026 while the
# release notes silently said March 2 and the changelog said 2026-02-30.
DATE_LONG="$(CF="$DATE_ISO" node -e '
  const iso = process.env.CF, d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) process.exit(1);
  process.stdout.write(d.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }));
')" || die "No such date: $DATE_ISO."
DATE_HT="$(CF="$DATE_ISO" node -e 'const[y,m,d]=process.env.CF.split("-");console.log(`${d}/${m}/${y}`)')"

# Read the pre-release version from origin's develop rather than the working
# tree: on a resumed freeze the tree already carries the bump, which would read
# as a patch release and silently skip step 8's demos and CodeSandbox work.
# develop holds the old version until 'publish' merges the release back, and
# origin's copy of it is the one that cannot be stale. Falls back to the local
# develop and then to the tree, so an unusual checkout still gets an answer.
PRE_FREEZE_VERSION=""
for ref in origin/develop develop; do
  PRE_FREEZE_VERSION="$(git show "$ref:package.json" 2>/dev/null \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).version||"")}catch(e){}})' 2>/dev/null || true)"
  [[ -n "$PRE_FREEZE_VERSION" ]] && break
done
if [[ -z "$PRE_FREEZE_VERSION" ]]; then
  PRE_FREEZE_VERSION="$(node -e 'process.stdout.write(require("./package.json").version||"")' 2>/dev/null || true)"
  warn "Could not read develop's package.json, so the release was classified against the checked-out version (${PRE_FREEZE_VERSION:-unknown}) - on a resumed freeze that reads a minor release as a patch and skips the demos and CodeSandbox work. Check whether step 8 should have run."
fi
IFS='.' read -r nM nm _ <<<"$VERSION"
IFS='.' read -r cM cm _ <<<"${PRE_FREEZE_VERSION:-0.0.0}"
if   [[ "$nM" != "$cM" ]]; then RELEASE_TYPE='major'
elif [[ "$nm" != "$cm" ]]; then RELEASE_TYPE='minor'
else RELEASE_TYPE='patch'; fi
VERSION_BRANCH="${nM}.${nm}.x"

# default demos location (run from the hyperformula repo root): the sibling
# ../hyperformula-demos. The tests clone is not configurable - see TESTS_DIR.
PARENT="$(dirname "$PWD")"
[[ -z "$DEMOS_DIR" && -d "$PARENT/hyperformula-demos" ]] && DEMOS_DIR="$PARENT/hyperformula-demos"

# Both sibling repositories are part of a freeze, so verify them before doing
# anything: a freeze that half-runs across three repositories is worse than one
# that refuses to start. The demos clone is required even for a patch release
# (where step 8 is skipped) - the check is about the environment being complete.
# Both run unconditionally so a run missing both clones reports both, instead
# of stopping at whichever is checked first and hiding the second problem.
SIBLINGS_OK=true
require_repo hyperformula-tests "$TESTS_DIR" "run 'npm run test:setup-private' first" develop || SIBLINGS_OK=false
if require_repo hyperformula-demos "$DEMOS_DIR" "pass --demos-dir PATH" develop; then
  require_script hyperformula-demos "$DEMOS_DIR" set-hyperformula-version.sh || SIBLINGS_OK=false
else
  SIBLINGS_OK=false
fi
$SIBLINGS_OK || die "Fix the sibling clone problem(s) reported above before continuing."

# A dirty tree is fatal to a fresh REAL freeze, exactly as in 'publish': step 4
# deletes the lock file outright, and step 9 stages whole paths, so the
# operator's unrelated work would be destroyed or committed as the release.
# Checked here, AFTER the sibling-clone checks, so a run that is both dirty and
# missing a clone reports the clone problem too instead of stopping at the dirty
# tree - matching the preflight order in release-README.md (sibling clones, then
# clean tree).
# Two things stop short of fatal:
#   - A dry run changes nothing, so it can preview perfectly well from a dirty
#     tree. Refusing would deny the operator the preview that would tell them
#     what the freeze is about to stage.
#   - A freeze already under way IN THIS CLONE, where the dirty tree is the
#     freeze's own unfinished work and refusing would break the resume this
#     script promises. The test is deliberately the LOCAL branch only: steps 3
#     and up are what dirty the tree and step 1 creates the branch before them,
#     so dirt from this freeze always comes with a local branch. A branch that
#     exists only on origin means another clone ran the freeze, and this tree's
#     changes are the operator's own - the case the check exists to catch.
# Both are advisories, not soft failures: the run does everything it set out to
# do, so they must not make it report otherwise.
if [[ -n "$(git status --porcelain)" ]]; then
  if branch_exists "release/$VERSION"; then
    note "The working tree was already dirty when this resume started, and the freeze stages whole paths - so check 'git show release/$VERSION' for anything of yours that rode along from package.json, CHANGELOG.md, ht.config.js, package-lock.json or docs/."
  elif $DRY_RUN; then
    note "The working tree is dirty. This preview is unaffected, but a --real-run would refuse to start: commit or stash first, or the freeze would stage your work along with its own."
  else
    die "Working tree is dirty - commit or stash first (the freeze commits whole paths, so your work would ride along)."
  fi
fi

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
checkout_branch "release/$VERSION" develop

# 2. Private test suite. The branch has to exist on the tests repo's origin
#    before fetch-tests.sh runs, because fetch-tests.sh pulls the matching
#    branch from origin - so a branch an earlier attempt created locally but
#    never pushed made 'git pull origin release/<version>' fail and blocked
#    every resume. Creating and pushing it here instead of at the end of the
#    freeze fixes that, and publishes the branch for CI and for the other
#    developers who add tests during the freeze that much sooner. ('publish'
#    merges it back. The process doc still describes the older
#    'checkout master && pull origin develop' - see release-README.md.)
step "2. Create release/$VERSION in hyperformula-tests, then sync the suite"
( cd "$TESTS_DIR"
  checkout_branch "release/$VERSION" develop
  run git push -u origin "release/$VERSION" )
run npm run test:setup-private

# 3. Bump version + release date (each half skipped when already correct, so a
CURRENT_VERSION="$(node -e 'process.stdout.write(require("./package.json").version||"")' 2>/dev/null || true)"
#    re-run after a later failure does not rewrite files it already wrote)
step "3. Bump version + HT_RELEASE_DATE"
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
if [[ ! -f ht.config.js ]]; then
  warn "There is no ht.config.js, so the release date was not set anywhere - if the file was moved, set the release date to $DATE_HT in its new home and commit it on release/$VERSION."
elif ! grep -q HT_RELEASE_DATE ht.config.js; then
  warn "ht.config.js has no HT_RELEASE_DATE key, so the release date was not set - add HT_RELEASE_DATE: '$DATE_HT' and commit it on release/$VERSION."
else
  # Accept either quote style, matching the write below: a double-quoted value
  # the read could not see would defeat the skip this step exists to add.
  CURRENT_HT_DATE="$(sed -n "s/.*HT_RELEASE_DATE[[:space:]]*:[[:space:]]*['\"]\([^'\"]*\)['\"].*/\1/p" ht.config.js | head -1 || true)"
  if [[ "$CURRENT_HT_DATE" == "$DATE_HT" ]]; then
    skip "ht.config.js HT_RELEASE_DATE already $DATE_HT"
  elif $DRY_RUN; then
    echo "    (set ht.config.js HT_RELEASE_DATE='$DATE_HT')"
  elif CF_D="$DATE_HT" node -e 'const f="ht.config.js",fs=require("fs");const s=fs.readFileSync(f,"utf8");const n=s.replace(/(HT_RELEASE_DATE\s*:\s*)([\x27"])[^\x27"]*\2/,`$1$2${process.env.CF_D}$2`);if(n===s)process.exit(1);fs.writeFileSync(f,n)'; then
    echo "    ht.config.js HT_RELEASE_DATE -> $DATE_HT"
  else
    # The replace above matched nothing - the value is not a plain quoted string
    # (a template literal, an extracted constant, a quoted key). The key was
    # there, so the earlier grep passed; without this branch the file would be
    # rewritten unchanged and the '-> DATE' success line would still print.
    warn "ht.config.js HT_RELEASE_DATE is not a plain quoted string, so the release date was not set - set it to $DATE_HT by hand and commit it on release/$VERSION."
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
#    branch in step 2, and nothing since has changed the branch it follows).
#    'npm run test' is lint, the unit tests and the browser suite, so it needs
#    headless Chrome and Firefox on this machine - there is no separate lint
#    call here because that script runs it first.
step "5. Build, lint + test"
run npm run bundle-all
run npm run test

# 6. CHANGELOG.md - add version heading under [Unreleased]
step "6. Update CHANGELOG.md"
if [[ ! -f CHANGELOG.md ]] || ! grep -q '^## \[Unreleased\]' CHANGELOG.md; then
  warn "Could not find '## [Unreleased]' in CHANGELOG.md, so there is no $VERSION section - add it by hand and commit it on release/$VERSION (the release notes and the GitHub release both come from it)."
elif grep -q "^## \[${VERSION//./\\.}\]" CHANGELOG.md; then
  skip "already has an entry for $VERSION"
elif $DRY_RUN; then
  echo "    (insert '## [$VERSION] - $DATE_ISO' under [Unreleased] - the new section will read:)"
  preview "$(printf '## [%s] - %s\n\n%s' "$VERSION" "$DATE_ISO" "$(changelog_section_body '## [Unreleased]')")"
else
  # Transform through a temp, then copy the bytes back into CHANGELOG.md rather
  # than 'mv'-ing the temp over it: mv replaces the inode, so the file would
  # inherit mktemp's 0600 instead of keeping its own mode.
  local tmp; tmp="$(mktemp)"
  awk -v v="## [$VERSION] - $DATE_ISO" '
    {print}
    /^## \[Unreleased\]/ && !d {print ""; print v; d=1}' CHANGELOG.md >"$tmp"
  cat "$tmp" > CHANGELOG.md
  rm -f "$tmp"
  echo "    inserted '## [$VERSION] - $DATE_ISO'"
fi

# 7. Release notes - transform the changelog entry into release-notes.md
#    (## [x] - iso  ->  ## x  +  **Release date: Month D, YYYY**  + same bullets)
step "7. Generate release notes"
RN="docs/guide/release-notes.md"
if [[ ! -f CHANGELOG.md || ! -f "$RN" ]]; then
  warn "CHANGELOG.md or $RN is missing, so no release notes were generated - write the $VERSION entry by hand and commit it on release/$VERSION."
else
  # Extract the changelog body with the SAME helper step 6's preview uses, then
  # hand it to node - so CHANGELOG.md is parsed in one place, not two. In a dry
  # run step 6 has not inserted the version heading yet, so the bullets are still
  # under [Unreleased]; on a real run they are under the new '## [VERSION]'.
  if $DRY_RUN; then
    RN_HEADING='## [Unreleased]'; RN_PATTERN='^## \[Unreleased\]'
  else
    RN_HEADING="## [$VERSION]"; RN_PATTERN="^## \[${VERSION//./\\.}\]"
  fi
  grep -q "$RN_PATTERN" CHANGELOG.md && RN_FOUND=1 || RN_FOUND=0
  CF_V="$VERSION" CF_LONG="$DATE_LONG" CF_RN="$RN" CF_FENCE="$PREVIEW_FENCE" \
  CF_FOUND="$RN_FOUND" CF_BODY="$(changelog_section_body "$RN_HEADING")" \
  CF_DRY="$($DRY_RUN && echo 1 || echo '')" node <<'NODE'
const fs = require('fs');
const v = process.env.CF_V, long = process.env.CF_LONG, rnPath = process.env.CF_RN;
const dryRun = process.env.CF_DRY === '1';
const esc = v.replace(/\./g, '\\.');

// Same register the shell's 'warn' writes to, so a soft failure raised in here
// reaches the closing checklist too rather than scrolling past as one '!' line.
const warningsFile = process.env.FAILURES_FILE || '';
function warn(message) {
  console.log('    ! ' + message);
  if (warningsFile) {
    try { fs.appendFileSync(warningsFile, message + '\n'); } catch (e) { /* the log line still stands */ }
  }
}

// The changelog body was extracted in the shell (changelog_section_body) and
// passed in through the environment, so this step no longer re-parses the file.
const found = process.env.CF_FOUND === '1';
const body = process.env.CF_BODY || '';
if (!found) {
  warn('CHANGELOG.md has no ' + v + ' section, so no release notes were generated - write both by hand and commit them on release/' + v + '.');
  process.exit(0);
}

const rnLines = fs.readFileSync(rnPath, 'utf8').split('\n');
if (rnLines.some(l => new RegExp('^## ' + esc + '\\s*$').test(l))) {
  console.log('    = release notes already has ' + v); process.exit(0);
}
// An entry with no bullets is a real failure to report, not a footnote on a
// success line: the release notes would ship a version heading and a date with
// nothing under them. Raised in both modes, with the same wording, so the dry
// run warns about it before the real run writes it.
if (!body) {
  warn('The [Unreleased] section of CHANGELOG.md is empty, so the ' + v + ' release notes have a heading and a date but no content - fill both in by hand and commit them on release/' + v + '.');
}
// Trailing newlines trimmed here, not at the seams below: with an empty body
// the entry would otherwise end in its own blank line and the seam would add a
// second, writing three consecutive blank lines into the file.
const entry = ('## ' + v + '\n\n**Release date: ' + long + '**\n\n' + body).replace(/\s+$/, '');
if (dryRun) {
  console.log('    (add to the top of ' + rnPath + ':)');
  console.log(process.env.CF_FENCE + '\n' + entry + '\n' + process.env.CF_FENCE);
  process.exit(0);
}
let idx = rnLines.findIndex(l => /^## /.test(l));           // before newest existing entry
if (idx === -1) idx = rnLines.length;                        // or append if none
// Normalise only the two seams this insert creates. Collapsing blank runs
// across the whole file would silently reformat parts of it the step was never
// asked to touch - and the dry run above previews the entry, not that.
const head = rnLines.slice(0, idx).join('\n').replace(/\s+$/, '');
const tail = rnLines.slice(idx).join('\n').replace(/^\n+/, '').replace(/\s+$/, '');
fs.writeFileSync(rnPath, head + '\n\n' + entry + '\n\n' + tail + '\n');
console.log('    added "## ' + v + '" to ' + rnPath);
NODE
fi

# 8. Major/minor only: hyperformula-demos + CodeSandbox URLs in docs/
step "8. Demos + docs URLs (major/minor only)"
if [[ "$RELEASE_TYPE" == patch ]]; then
  skip "patch release - the demos and the CodeSandbox URLs already name $VERSION_BRANCH"
else
  # The sanity checks have already proved the demos clone is usable and carries
  # set-hyperformula-version.sh.
  echo "    updating $DEMOS_DIR -> $VERSION, branch $VERSION_BRANCH"
  ( cd "$DEMOS_DIR"
    sync_branch develop
    run sh set-hyperformula-version.sh "$VERSION"
    if $DRY_RUN || [[ -n "$(git status --porcelain)" ]]; then
      run git add .
      run git commit -m "Set hyperformula version for all demos"
    else
      skip "demos already at $VERSION - no commit needed"
    fi
    run git push origin develop
    merge_develop_into_version_branch "$VERSION_BRANCH" )
  # CodeSandbox / StackBlitz demo URLs in this repo's docs: point every one at
  # the new branch, whatever branch it names now (old releases left several
  # behind). Scans docs/guide and docs/index.md only - the tracked files that
  # carry these URLs. Walking all of docs/ would also descend into the gitignored
  # generated trees (docs/api, docs/functions, docs/.vuepress/dist), whose built
  # HTML repeats the same URLs but is never committed - it would bury the dry-run
  # preview under hundreds of lines and inflate the reported file count.
  DOC_URL_PATHS=()
  [[ -d docs/guide ]] && DOC_URL_PATHS+=(docs/guide)
  [[ -f docs/index.md ]] && DOC_URL_PATHS+=(docs/index.md)
  if [[ ${#DOC_URL_PATHS[@]} -gt 0 ]]; then
    CF_NEW="$VERSION_BRANCH" CF_FENCE="$PREVIEW_FENCE" \
    CF_DRY="$($DRY_RUN && echo 1 || echo '')" perl - "${DOC_URL_PATHS[@]}" <<'PERL'
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
find(sub { push @docFiles, $File::Find::name if -f }, @ARGV);

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
  else
    skip "no docs/guide or docs/index.md here - no demo URLs to rewrite"
  fi
fi

# 9. Commit the release branch and publish it (git flow release publish = push)
step "9. Commit + push release/$VERSION"
# Named pathspecs, not '.': an unrelated uncommitted change elsewhere in the
# working tree (something the operator was working on, unrelated to the
# freeze) must not ride along into the release commit. These are whole paths
# though, not a list of files this run wrote, so they cannot tell the freeze's
# edits from the operator's inside the same path - which is why the preflight
# refuses to start a fresh freeze on a dirty tree.
# package-lock.json, ht.config.js and docs/ are each conditional on existing:
# step 4 deletes and regenerates the lock file, so between an 'npm i' and its
# write it is briefly gone, and both files can be legitimately absent altogether
# (see step 3) - a bare pathspec for any of them would die under 'set -e' when
# it is not there.
# Anything a future step writes outside these paths will not be committed, so
# add its path here too.
ADD_PATHS=(package.json CHANGELOG.md)
[[ -f package-lock.json ]] && ADD_PATHS+=(package-lock.json)
[[ -f ht.config.js ]] && ADD_PATHS+=(ht.config.js)
[[ -d docs ]] && ADD_PATHS+=(docs)
run git add "${ADD_PATHS[@]}"
if $DRY_RUN || [[ -n "$(git status --porcelain -- "${ADD_PATHS[@]}")" ]]; then
  run git commit -m "$VERSION"
else
  skip "nothing to commit"
fi
run git push -u origin "release/$VERSION"

# A freeze that could not do part of its job must not sign off as if it had.
FREEZE_WARNINGS="$(warning_count)"
if [[ "$FREEZE_WARNINGS" == 0 ]]; then
  step "Done - release/$VERSION is ready for the freeze"
else
  step "Finished, but $FREEZE_WARNINGS thing(s) could not be done - release/$VERSION is NOT ready yet"
fi
if $DRY_RUN; then echo "  (dry run - nothing changed; re-run with --real-run to do it for real)"; fi

# Recorded soft failures first: they are the work that has to happen before the
# freeze is really under way, and they belong on the same list as the rest of it.
manual_checklist <<NEXT
  [ ] Post a heads-up about the code freeze in #hyperformula and #release

  During the freeze:
  [ ] Review the docs changes (GitHub compare)
  [ ] Test the code examples on staging
  [ ] Work with marketing on the blog post and social media content
$( [[ "$RELEASE_TYPE" == major ]] && printf '  [ ] Major release: test the demos by hand against the rc build\n' )
  [ ] Check that CI is green on release/$VERSION before publishing (the freeze runs
      lint and the whole test suite locally; CI re-runs them on the pushed branch)
NEXT
exit 0
}

# ============================================================================
# Command: publish
# ============================================================================
cmd_publish() {
local DRY_RUN=true SKIP_BUILD=false DEMOS_DIR="" VERSION=""
start_warning_register

# ---- args ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --real-run)     DRY_RUN=false ;;
    --dry-run)      DRY_RUN=true ;;
    --skip-build)   SKIP_BUILD=true ;;
    --demos-dir)    [[ $# -ge 2 ]] || die "Missing value for $1"; DEMOS_DIR="$2"; shift ;;
    -h|--help)      usage_publish; exit 0 ;;
    -*)             die "Unknown option: $1" ;;
    *) if [[ -z "$VERSION" ]]; then VERSION="$1"
       else die "Unexpected arg: $1"; fi ;;
  esac
  shift
done

[[ -n "$VERSION" ]] || read -r -p "Version to publish (e.g. 2.1.0): " VERSION \
  || die "no version given and no terminal to ask on."
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || die "Bad version: $VERSION"

# Not configurable, as in code-freeze: test/fetch-tests.sh and the CI workflows
# all hardcode this path.
TESTS_DIR="test/hyperformula-tests"

# ---- sanity checks ----
# Named, as in code-freeze, so a failure in any of the checks below is reported
# against a step instead of against "startup".
step "Preflight"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repo."
[[ -f package.json ]] || die "No package.json here - run from the hyperformula repo root."
# node reads package.json on the release ref in the preflight below.
for tool in npm node; do
  command -v "$tool" >/dev/null || die "$tool not found."
done
branch_exists master  || die "No 'master' branch."
branch_exists develop || die "No 'develop' branch."
[[ -z "$(git status --porcelain)" ]] || die "Working tree is dirty - commit or stash first."

# default demos location, as in code-freeze
PARENT="$(dirname "$PWD")"
[[ -z "$DEMOS_DIR" && -d "$PARENT/hyperformula-demos" ]] && DEMOS_DIR="$PARENT/hyperformula-demos"

# Both sibling repositories are written to during a publish, so both are
# required - same rule as code-freeze. The tests repo also needs master, which
# step 6 merges into. Both run unconditionally, same reason as code-freeze.
# The demos script is checked here for a sharper reason than in the freeze: it
# runs in step 8, after the npm publish that cannot be undone, so a wrong
# --demos-dir has to be caught now or not at all.
SIBLINGS_OK=true
require_repo hyperformula-tests "$TESTS_DIR" "run 'npm run test:setup-private' first" master develop || SIBLINGS_OK=false
if require_repo hyperformula-demos "$DEMOS_DIR" "pass --demos-dir PATH" develop; then
  require_script hyperformula-demos "$DEMOS_DIR" update-hyperformula-in-lock-files.sh || SIBLINGS_OK=false
else
  SIBLINGS_OK=false
fi
$SIBLINGS_OK || die "Fix the sibling clone problem(s) reported above before continuing."

# Fetching writes only refs the release reads (remote-tracking branches, and
# local tags via --tags), never the working tree - so it is safe in a dry run,
# and every "is this already done?" check below needs the fresh state. Marked
# "(always runs)" because elsewhere a '$' line means "only with --real-run".
printf '    $ git fetch origin --tags   (always runs)\n'
git fetch origin --tags >/dev/null 2>&1 || die "git fetch origin failed."

# Both release branches are prerequisites: 'publish' finishes a freeze, it never
# improvises one. A missing branch means the freeze did not run for this version,
# so it is an error rather than a step to skip. resolve_branch prefers the local
# branch, falls back to origin's so publishing works from a fresh clone too, and
# refuses a local branch that has drifted from origin's.
resolve_branch "release/$VERSION" . "run 'release.sh code-freeze $VERSION <date>' first"
RELEASE_REF="$RESOLVED_REF"
RELEASE_TIP="$RESOLVED_TIP"
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
# touches master, rather than half-way through the merge-back. The same helper,
# so the two guards cannot drift apart: they used to be two hand-written copies.
printf '    $ git -C %s fetch origin   (always runs)\n' "$TESTS_DIR"
git -C "$TESTS_DIR" fetch origin >/dev/null 2>&1 || die "git fetch failed in $TESTS_DIR."
resolve_branch "release/$VERSION" "$TESTS_DIR" "the freeze did not create it"
TESTS_REF="$RESOLVED_REF"
TESTS_TIP="$RESOLVED_TIP"

NPM_USER="$(npm whoami 2>/dev/null || true)"
if [[ -z "$NPM_USER" ]]; then
  $DRY_RUN || die "npm whoami failed - run 'npm login' first."
  NPM_USER="<not logged in>"
fi

IFS='.' read -r nM nm _ <<<"$VERSION"
VERSION_BRANCH="${nM}.${nm}.x"

# A plain x.y.z is a normal release: it takes npm's 'latest' dist-tag and, on
# GitHub, "latest release". Anything with a prerelease/build suffix (an rc, say)
# must NOT - the version regex above deliberately accepts those, and a bare
# 'npm publish' would move 'latest' to it, so every 'npm install hyperformula'
# would resolve to the rc. Publish those under 'next' and flag the GitHub
# release as a pre-release in the closing checklist below.
if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NPM_TAG='latest'; IS_PRERELEASE=false
else
  NPM_TAG='next'; IS_PRERELEASE=true
fi

# The demos version branch is written to in step 8, which runs after the npm
# publish. Report a missing one now, while the operator can still act on it -
# but as a warning, not an error: by the time step 8 runs the release is out,
# so refusing there would leave a published package and a dead script. A branch
# that is missing at publish time usually means the freeze's demos step never
# completed, which also means the CodeSandbox URLs in docs/ were never rewritten.
if ! branch_exists "$VERSION_BRANCH" "$DEMOS_DIR" && ! remote_branch_exists "$VERSION_BRANCH" "$DEMOS_DIR"; then
  note "hyperformula-demos has no $VERSION_BRANCH branch, so step 8 will create it from develop. For a major or minor release the freeze's demos step should already have created it, so check that the CodeSandbox URLs in docs/ name tree/$VERSION_BRANCH as well. For the first patch on a new minor line there may simply be nothing there yet."
fi

step "Plan"
cat <<INFO
  version:      $VERSION
  release ref:  $RELEASE_REF
  npm user:     $NPM_USER
  npm dist-tag: $NPM_TAG$($IS_PRERELEASE && echo '   (prerelease - not tagged latest; GitHub release flagged pre-release)')
  demos repo:   $DEMOS_DIR  (branch $VERSION_BRANCH)
  tests repo:   $TESTS_DIR  ($TESTS_REF)
  build:        $($SKIP_BUILD && echo 'SKIPPED (--skip-build; package check still runs)' || echo 'npm ci + lint + tests + bundle-all + package check')
  mode:         $($DRY_RUN && echo 'DRY RUN (preview; pass --real-run to make changes)' || echo 'REAL RUN (making changes)')
INFO

# 1. Prove the release before anything moves. This is the last moment at which
#    the run has changed nothing, so a broken build or a failing test costs only
#    the time it took: no merge to unpick, no tag to delete, nothing pushed.
#    Built from the release ref, not from master, because master does not carry
#    the release yet - step 2 then proves that merging it changed nothing, so
#    what is verified here is what step 7 publishes.
step "1. Test, build + verify the package from $RELEASE_REF"
run git checkout "$RELEASE_REF"
if $SKIP_BUILD; then
  skip "--skip-build: reusing the build on disk (npm ci, the tests and bundle-all not run)"
else
  run npm ci
  # The suites collect test/**, private suite included, so the tests are the
  # release's own only while that clone sits on the release branch - and nothing
  # keeps it there between the freeze and the publish. The same pinned commit
  # step 6 merges back, so both steps see one release of the suite.
  run git -C "$TESTS_DIR" checkout "$TESTS_REF"
  # As in the freeze: lint, the unit tests and the browser suite in one script.
  run npm run test
  run npm run bundle-all
fi
run npm run verify:publish-package

# 2. master gets the release
step "2. Merge $RELEASE_REF into master"
merge_release_into master "$RELEASE_REF" "$RELEASE_TIP"
# npm packs the working tree, so what step 7 publishes is master's tracked files
# plus the artifacts step 1 built from the release ref. That only holds together
# while the merge is content-neutral - the normal case, master being behind the
# release branch and contributing nothing of its own. When master does carry
# something the release branch does not (a hotfix landed during the freeze, say)
# it now holds code that was never built or tested here, so stop while nothing
# has been pushed or published.
if $DRY_RUN; then
  skip "dry run - master has not moved, so its content cannot be compared with $RELEASE_REF yet"
elif [[ "$(git rev-parse 'master^{tree}')" == "$(git rev-parse "$RELEASE_TIP^{tree}")" ]]; then
  skip "master's content matches $RELEASE_REF - the verified build is what gets published"
else
  die "master now holds content that is not in $RELEASE_REF, so the package verified in step 1 is not what master would publish - see 'git diff $RELEASE_TIP master'. Nothing has been pushed or published: merge master into release/$VERSION, let CI run on it, then publish again."
fi

# 3. Tag the release on master (git flow release finish tags here)
step "3. Tag $VERSION"
if tag_exists "$VERSION"; then
  # Accept the tag when it sits on master's history OR origin/master's. In a real
  # run step 2 has already fast-forwarded local master, so the two agree; in a dry
  # run nothing has moved master, so a local copy left behind by anyone who has
  # not pulled since the release would otherwise fail this check on a tag that is
  # perfectly fine on origin. The preflight's 'git fetch origin --tags' already
  # refreshed origin/master, so consulting it here needs no pull of its own.
  if is_ancestor "refs/tags/$VERSION" master || is_ancestor "refs/tags/$VERSION" origin/master; then
    skip "tag $VERSION already exists on master's history"
  else
    die "tag $VERSION exists but is not in master's or origin/master's history - check it before continuing."
  fi
else
  run git tag -a "$VERSION" -m "$VERSION"
fi

# 4. develop gets the release too
step "4. Merge $RELEASE_REF into develop"
merge_release_into develop "$RELEASE_REF" "$RELEASE_TIP"

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
# npm packs the working tree, so the tarball is the checked-out branch's files
# plus the build on disk. Step 4 left HEAD on develop, whose commits from during
# the freeze are not part of this release - publish the tagged commit instead.
run git checkout master
if on_npm "$VERSION"; then
  skip "hyperformula@$VERSION is already on npm - not publishing again"
elif $DRY_RUN; then
  echo "    (would ask for confirmation, then run: npm publish --tag $NPM_TAG)"
else
  confirm_publish "$VERSION" "$NPM_USER"
  run npm publish --tag "$NPM_TAG"
  wait_for_npm "$VERSION"
fi

# 8. Demos consume the published version, so they come after the publish.
#    Preflight has already proved the clone is usable. No 'trap - ERR' here: a
#    failure inside this subshell must still name the step.
step "8. Update hyperformula-demos"
( cd "$DEMOS_DIR"
  sync_branch develop
  run sh update-hyperformula-in-lock-files.sh
  if $DRY_RUN || [[ -n "$(git status --porcelain)" ]]; then
    run git add .
    run git commit -m "Update hyperformula version in all lock files"
  else
    skip "lock files already up to date - nothing to commit"
  fi
  run git push origin develop

  # A branch the freeze failed to create is created here rather than stranding a
  # published release; the preflight has already noted that case, while the
  # operator could still act on it.
  merge_develop_into_version_branch "$VERSION_BRANCH"
  # All three clones end on develop - see step 9 below for this repo. Unlike
  # code-freeze, there is no reason to leave the operator on the version branch
  # here: the freeze just created it, but publish only ever revisits it.
  run git checkout develop )

# 9. Leave the operator where the next cycle starts.
step "9. Back to develop"
run git checkout develop

# No step in publish records a soft failure: every failure path here uses 'die',
# and the one soft report - a missing demos version branch - is a 'note', which
# by design does not change this banner. So the banner is always the plain Done.
step "Done - $VERSION is released"
if $DRY_RUN; then echo "  (dry run - nothing changed; re-run with --real-run to do it for real)"; fi

manual_checklist <<NEXT
  [ ] Create the GitHub release for $VERSION (body = the $VERSION section of CHANGELOG.md):
        https://github.com/handsontable/hyperformula/releases/new?tag=$VERSION&title=$VERSION$($IS_PRERELEASE && printf '&prerelease=1\n      (prerelease - leave the "Set as the latest release" box unchecked)')
  [ ] Check that the docs workflow deployed the documentation to gh-pages
  [ ] Review the deployed docs and test the demos
  [ ] Announce the release in #hyperformula and #release
  [ ] Close the GitHub and ClickUp tasks in this release, announcing $VERSION,
      notify everyone involved in the discussions, and check linked issues
NEXT
exit 0
}

# ============================================================================
# Dispatch
# ============================================================================
if [[ $# -eq 0 ]]; then usage_top; exit 0; fi
COMMAND="$1"; shift
case "$COMMAND" in
  code-freeze)    cmd_code_freeze "$@" ;;
  publish)        cmd_publish "$@" ;;
  -h|--help|help) usage_top ;;
  *) printf 'Unknown command: %s\n\n' "$COMMAND" >&2; usage_top >&2; exit 1 ;;
esac
