#!/usr/bin/env bash
#
# release - HyperFormula release automation.
# Doc: https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135
#
# Usage: release.sh <command> [options]
#
# Commands:
#   code-freeze <version> <release-date> [--real-run]   Start a code freeze.
#   publish <version>                                   Publish a release. (not implemented yet)
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
run()  { printf '    $ %s\n' "$*"; $DRY_RUN || "$@"; }

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
require_repo() { # require_repo <label> <path> <flag> <required branch...>
  local label="$1" dir="$2" flag="$3" branch; shift 3
  [[ -n "$dir" && -d "$dir" ]] \
    || die "$label clone not found at '${dir:-<unset>}' - pass $flag PATH."
  git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || die "$dir is not a git repository ($label)."
  [[ -z "$(git -C "$dir" status --porcelain)" ]] \
    || die "Working tree in $dir ($label) is dirty - commit or stash there first."
  git -C "$dir" ls-remote --heads origin >/dev/null 2>&1 \
    || die "Cannot reach origin of $dir ($label)."
  for branch in "$@"; do
    branch_exists "$branch" "$dir" || remote_branch_exists "$branch" "$dir" \
      || die "$label has no '$branch' branch ($dir)."
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

usage_top() {
cat <<'USAGE'
release - HyperFormula release automation.

Usage: release.sh <command> [options]

Commands:
  code-freeze <version> <release-date> [--real-run]   Start a code freeze.
  publish <version>                                   Publish a release. (not implemented yet)

Run 'release.sh <command> --help' for command-specific options.
USAGE
}

usage_code_freeze() {
cat <<'USAGE'
Usage: release.sh code-freeze <version> <release-date> [options]

Starts a HyperFormula code freeze. Previews by default (prints commands,
changes nothing); add --real-run to make changes.

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

Publish a finished release - the "Release steps" section of the doc
(npm publish, tags, GitHub release, post-release). NOT IMPLEMENTED YET.
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
    --demos-dir)    DEMOS_DIR="${2:-}"; shift ;;
    --tests-dir)    TESTS_DIR="${2:-}"; shift ;;
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
git show-ref --verify --quiet refs/heads/develop || die "No 'develop' branch."
command -v npm >/dev/null || die "npm not found."

# ---- derive dates + release type ----
# ht.config.js wants DD/MM/YYYY; release notes want "Month D, YYYY".
DATE_HT="$(CF="$DATE_ISO"   node -e 'const[y,m,d]=process.env.CF.split("-");console.log(`${d}/${m}/${y}`)')"
DATE_LONG="$(CF="$DATE_ISO" node -e 'console.log(new Date(process.env.CF+"T00:00:00").toLocaleString("en-US",{month:"long",day:"numeric",year:"numeric"}))')"

CURRENT_VERSION="$(node -e 'process.stdout.write(require("./package.json").version||"")' 2>/dev/null || true)"
IFS='.' read -r nM nm _ <<<"$VERSION"
IFS='.' read -r cM cm _ <<<"${CURRENT_VERSION:-0.0.0}"
if   [[ "$nM" != "$cM" ]]; then RELEASE_TYPE=major
elif [[ "$nm" != "$cm" ]]; then RELEASE_TYPE=minor
else RELEASE_TYPE=patch; fi
VERSION_BRANCH="${nM}.${nm}.x"

# default repo locations (run from the hyperformula repo root):
#   demos: sibling ../hyperformula-demos      tests: ./test/hyperformula-tests
PARENT="$(dirname "$PWD")"
[[ -z "$DEMOS_DIR" && -d "$PARENT/hyperformula-demos"   ]] && DEMOS_DIR="$PARENT/hyperformula-demos"
[[ -z "$TESTS_DIR" && -d "$PWD/test/hyperformula-tests" ]] && TESTS_DIR="$PWD/test/hyperformula-tests"

step "Plan"
cat <<INFO
  version:      $VERSION   (was ${CURRENT_VERSION:-unknown}, $RELEASE_TYPE release)
  release date: $DATE_ISO  (ht.config.js: $DATE_HT | release notes: $DATE_LONG)
  demos repo:   ${DEMOS_DIR:-<none, will print manual steps>}$( [[ $RELEASE_TYPE == patch ]] && echo '  (skipped: patch)')
  tests repo:   ${TESTS_DIR:-<none, will print manual steps>}
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
  CURRENT_HT_DATE="$(sed -n "s/.*HT_RELEASE_DATE[[:space:]]*:[[:space:]]*'\([^']*\)'.*/\1/p" ht.config.js | head -1 || true)"
  if [[ "$CURRENT_HT_DATE" == "$DATE_HT" ]]; then
    skip "ht.config.js HT_RELEASE_DATE already $DATE_HT"
  elif $DRY_RUN; then
    echo "    (set ht.config.js HT_RELEASE_DATE='$DATE_HT')"
  else
    CF_D="$DATE_HT" node -e 'const f="ht.config.js",fs=require("fs");let s=fs.readFileSync(f,"utf8");s=s.replace(/(HT_RELEASE_DATE\s*:\s*)([\x27"])[^\x27"]*\2/,`$1$2${process.env.CF_D}$2`);fs.writeFileSync(f,s)'
    echo "    ht.config.js HT_RELEASE_DATE -> $DATE_HT"
  fi
fi

# 4. Regenerate the lock file. A lock file already naming the new version is
#    proof it was regenerated after the bump, so a re-run leaves it alone.
step "4. Reinstall dependencies"
LOCK_VERSION="$(node -e 'try{process.stdout.write(require("./package-lock.json").version||"")}catch(e){}' 2>/dev/null || true)"
if [[ "$LOCK_VERSION" == "$VERSION" ]]; then
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
  echo "    = already has an entry for $VERSION"
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
  if [[ -n "$DEMOS_DIR" && -d "$DEMOS_DIR" ]]; then
    echo "    updating $DEMOS_DIR -> $VERSION, branch $VERSION_BRANCH"
    ( trap - ERR; cd "$DEMOS_DIR"
      run git checkout develop
      run git pull
      run sh set-hyperformula-version.sh "$VERSION"
      run git add .
      run git commit -m "Set hyperformula version for all demos"
      run git push
      if git show-ref --verify --quiet "refs/heads/$VERSION_BRANCH"; then
        run git checkout "$VERSION_BRANCH"
      else
        run git checkout -b "$VERSION_BRANCH"
      fi
      run git push -u origin "$VERSION_BRANCH" )
    [[ "$RELEASE_TYPE" == major ]] && echo "    ! major: manually test demos against the rc build."
  else
    cat <<MANUAL
    ! demos repo not found - run in your hyperformula-demos clone:
        git checkout develop && git pull
        sh set-hyperformula-version.sh $VERSION
        git add . && git commit -m "Set hyperformula version for all demos" && git push
        git checkout -b $VERSION_BRANCH && git push -u origin $VERSION_BRANCH
MANUAL
  fi
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
  echo "    nothing to commit"
fi
run git push -u origin "release/$VERSION"

# 10. hyperformula-tests repo
step "10. Update hyperformula-tests"
if [[ -n "$TESTS_DIR" && -d "$TESTS_DIR" ]]; then
  ( trap - ERR; cd "$TESTS_DIR"; run git checkout master; run git pull origin develop )
else
  cat <<MANUAL
    ! tests repo not found - run in your hyperformula-tests clone:
        git checkout master
        git pull origin develop
MANUAL
fi

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
# Command: publish  (placeholder - implement later)
# ============================================================================
cmd_publish() {
  case "${1:-}" in -h|--help) usage_publish; exit 0 ;; esac
  echo "release.sh publish is not implemented yet - placeholder for a future step."
  echo "See the 'Release steps' section of the doc; for now, publish manually."
  exit 1
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
