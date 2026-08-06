# release.sh

Local automation for the HyperFormula
[release process](https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135).

Usage:

```bash
npm run release -- <command> [options]     # or: bash script/release/release.sh
```

This file describes what each step *does*. It deliberately does not transcribe
the commands the script runs — as it goes, the script prints each command that
changes something (as a `$` line, and in a dry run prints it without running it)
and previews the content it would write, so the script is the authority and this
file cannot drift out of step with it. Not everything is echoed verbatim, though:
read-only state checks run silently, and the in-place `node`/`perl` file edits
are shown as preview blocks or `(set …)` lines rather than as literal commands.

## Before you start

Both commands work across three repositories: this one, `hyperformula-tests`,
and `hyperformula-demos`. Before making any change — including during a dry
run — each command checks that all three are usable, and refuses to start if
they are not.

- **This repository** must be a git work tree with `package.json` present, the
  branches the command will move, and a clean working tree. `code-freeze` relaxes
  the last one for a dry run and for a resume: see [its preflight](#preflight).
- **`hyperformula-tests`** always lives at `test/hyperformula-tests`. This is not
  configurable, because `test/fetch-tests.sh` and the CI workflows all hardcode
  it — if the script let you point it elsewhere, a freeze would validate one
  clone and mutate another. If you have never had a private test clone, run
  `npm run test:setup-private` first; it creates the clone for you. `code-freeze`
  and `publish` deliberately do not clone it for you mid-run.
- **`hyperformula-demos`** defaults to `../hyperformula-demos`, override with
  `--demos-dir PATH`.
- Each sibling clone must have a clean working tree, a reachable `origin`, the
  branches the command will move (`develop` in both, plus `master` in
  `hyperformula-tests` while running `publish`), and the script that command runs
  inside it. The last one matters most for `publish`, whose demos script runs
  *after* the npm publish that cannot be undone — so a wrong `--demos-dir` has to
  be caught in the preflight or not at all.
- A missing, dirty, or wrong clone is an **error**, not a warning. This applies
  to dry runs too: a preview that cannot see the repositories it would touch is
  not a faithful preview.

## Command: `code-freeze`

Starts a HyperFormula code freeze. **Previews by default** — prints every command
and changes nothing. Add `--real-run` to actually do it.

```bash
# Preview (dry run) — the default:
npm run release -- code-freeze 2.1.0 2026-08-30

# Do it for real:
npm run release -- code-freeze 2.1.0 2026-08-30 --real-run
```

(The `--` tells npm to pass the rest through to the script. Or run it directly:
`bash script/release/release.sh code-freeze 2.1.0 2026-08-30 --real-run`.)

Arguments are `<version>` (e.g. `2.1.0`) and `<release-date>` in `YYYY-MM-DD`.

### Options

| Flag | Effect |
|------|--------|
| `--real-run` | Actually run the commands. Without it, the script only previews (dry run). |
| `--dry-run` | Preview only. This is the default; the flag exists to override a shell alias. |
| `--demos-dir PATH` | Path to your `hyperformula-demos` clone. |
| `-h`, `--help` | Show help for this command. |

### Preflight

Before changing anything, and in a dry run too, `code-freeze` fetches `origin`
(see below — the checks depend on it) and then checks that:

1. This is a git work tree with `package.json` and a `develop` branch, and that
   `npm`, `node` and `perl` are all on `PATH` — `node` makes the version, date
   and release-notes edits, `perl` rewrites the demo URLs.
2. `<version>` is not already tagged. A tag means the version is released, so
   freezing it again is a typo rather than an intention. This is why the fetch
   comes first: a tag a colleague pushed is invisible until it is fetched, which
   is exactly the case worth catching.
3. `<release-date>` is a date that exists. The `YYYY-MM-DD` shape is not enough:
   `2026-02-30` would otherwise reach `ht.config.js` verbatim while the release
   notes silently said March 2 and the changelog said February 30.
4. Both sibling clones are usable (see [Before you start](#before-you-start)).
5. The working tree is clean. Two cases stop short of refusing: a dry run
   changes nothing, so it previews from a dirty tree and just says a real run
   would refuse; and a resume — meaning `release/<version>` already exists **in
   this clone** — is exempt, because there the dirty tree is the freeze's own
   unfinished work and refusing would break the resume. Both are noted under
   "worth checking" rather than treated as failures. A branch that exists only on
   origin is *not* a resume: another clone ran that freeze, so anything dirty here
   is your own and the run refuses.

That fetch runs for real even in a dry run, so that every "does origin already
have this?" answer is fresh, check 2 can see a tag someone else pushed, and the
release type is classified against origin's `develop` rather than a possibly
stale local copy. Only this repository is fetched with `--tags` — the tag checks
above are what need them. The sibling clones are fetched the same way as each
command reaches them, but plainly: neither `hyperformula-tests` nor
`hyperformula-demos` is tag-gated, so a bare `git fetch origin` is enough there.

So a dry run is not quite a no-op on disk: it updates remote-tracking refs and
creates local tags. It never touches a working tree, a local branch, or a remote,
which is what "changes nothing" means here — and without it the preview would
describe decisions made from stale refs. The script marks these fetches
`(always runs)` to distinguish them from the `$` lines that only execute with
`--real-run`.

### What it does

1. **Gets onto `release/<version>`.** Creates it off `develop` the first time;
   on a re-run, resumes the existing branch — fast-forwarding a local one, or
   creating it from origin's when only the remote has it.
2. **Gives the freeze a branch in `hyperformula-tests` and syncs the suite.**
   Creates and pushes `release/<version>` there, then points the private test
   suite at it via `npm run test:setup-private`. The push comes first on purpose:
   `test/fetch-tests.sh` pulls the matching branch *from origin*, so a branch
   that existed only locally used to make every resume fail here. Pushing it now
   also publishes it for CI and for the other developers who add tests during
   the freeze.
3. **Sets the version and the release date** — `version` in `package.json` and
   `HT_RELEASE_DATE` in `ht.config.js`. Each is skipped when it already matches,
   so a re-run does not rewrite files it already wrote.
4. **Reinstalls dependencies** and regenerates the lock file — skipped when
   `package-lock.json` already names the new version *and* `node_modules` exists.
   Both are required: an interrupted install can leave the lock file written and
   `node_modules` missing, and skipping then would carry a broken install
   straight into the build.
5. **Builds, then lints and runs the whole test suite** — the unit tests and the
   browser suite, which needs headless Chrome and Firefox on this machine.
   These always run, even when resuming a freeze that got this far before.
6. **Adds the version section to `CHANGELOG.md`**, directly under
   `## [Unreleased]` so that the bullets accumulated during development become
   the new section — unless that section already exists.
7. **Generates the release notes** from that changelog section: a `## <version>`
   entry in `docs/guide/release-notes.md` with the release date and the same
   bullets, unless it is already there. Only the two seams the insert creates are
   reformatted, so the rest of the file is left exactly as it was.
8. **Major/minor only — updates the demos and the docs URLs.** In
   `hyperformula-demos`: sets the HyperFormula version across the demos on
   `develop`, commits and pushes, then gets onto the `M.m.x` branch (creating it
   if needed, fast-forwarding it first if it already exists) and makes sure the
   version bump is on it. Then, in this repository, repoints every CodeSandbox
   and StackBlitz demo URL in `docs/guide/` and `docs/index.md` — the tracked
   files that carry them, so the rewrite never descends into generated output
   like `docs/api/` — at `tree/<M.m.x>`, whatever branch it names today; old
   releases left several behind. URLs for demos that no longer exist on the
   current branch stay pinned to the last branch that has them (`vue-demo`, the
   Vue 2 example replaced by `vue-3-demo` after 2.5.x); if you retire a demo, add
   it to that list in the script. Skipped entirely for a patch release, where
   `M.m.x` already names the right branch.
9. **Commits and pushes the release branch.** Commits only if there is something
   to commit. Stages **named paths, not `git add .`** — `package.json`,
   `CHANGELOG.md`, and whichever of `package-lock.json`, `ht.config.js` and
   `docs/` exist — so unrelated work elsewhere in your tree cannot ride along.
   These are whole paths, though, not a list of files the run wrote, which is why
   the preflight refuses to start a fresh freeze on a dirty tree. If you add a
   step that writes somewhere new, add its path to that list too.

### What stays manual

The script finishes by printing these as a highlighted `[ ]` checklist, so they
are hard to miss in the output:

```
  [ ] Post a heads-up about the code freeze in #hyperformula and #release

  During the freeze:
  [ ] Review the docs changes (GitHub compare)
  [ ] Test the code examples on staging
  [ ] Work with marketing on the blog post and social media content

  [ ] Check that CI is green on release/<version> before publishing (the freeze runs
      lint and the whole test suite locally; CI re-runs them on the pushed branch)
```

A major release adds an item about testing the demos against the rc build.
Anything the run could not do is listed in the same box, above these — see
[Recorded failures](#recorded-failures).

## Command: `publish`

Publishes a finished release: builds, tests and verifies the package, merges
`release/<version>` into `master` and `develop`, tags it, publishes it to npm,
and updates `hyperformula-tests` and `hyperformula-demos`. **Previews by
default** — prints every command and changes nothing. Add `--real-run` to
actually do it.

```bash
# Preview (dry run) — the default:
npm run release -- publish 2.1.0

# Do it for real:
npm run release -- publish 2.1.0 --real-run
```

(The `--` tells npm to pass the rest through to the script. Or run it
directly: `bash script/release/release.sh publish 2.1.0 --real-run`.)

The argument is `<version>` (e.g. `2.1.0`) — the same version `code-freeze`
started. `publish` requires `release/<version>` to already exist in this repo
AND in `hyperformula-tests`; run `code-freeze` first if it doesn't.

### Options

| Flag | Effect |
|------|--------|
| `--real-run` | Actually run the commands. Without it, the script only previews (dry run). |
| `--dry-run` | Preview only. This is the default; the flag exists to override a shell alias. |
| `--skip-build` | Skip the reinstall, the test suite and the rebuild (assumes the on-disk build already matches the release commit). The package check still runs. Meant for a fast resume after a late failure. |
| `--demos-dir PATH` | Path to your `hyperformula-demos` clone. |
| `-h`, `--help` | Show help for this command. |

### Preflight

Before changing anything, `publish` checks every hard requirement and exits
with an error — in a dry run too — if one is not met:

1. This repo is a usable git work tree: `package.json` present, both `master`
   and `develop` branches exist, and the working tree is clean — unconditionally
   here, unlike `code-freeze`, because `publish` never leaves work uncommitted.
   `npm` and `node` must both be on `PATH`; `node` reads `package.json` off the
   release ref in check 5.
2. Both sibling clones are usable, including the demos script this run will
   execute (see [Before you start](#before-you-start)).
3. `release/<version>` exists — locally or on origin — in this repo AND in
   `hyperformula-tests`. `publish` finishes a freeze; it never improvises one,
   so a missing branch is an error rather than a step it works around.
4. Where both a local `release/<version>` and `origin/release/<version>` exist,
   they must point at the same commit — otherwise a late fix pushed to the freeze
   branch would be silently dropped. The error names the commits and how to
   reconcile them. Checked in both repositories, by the same code, so the two
   guards cannot drift apart.
5. `package.json` on `release/<version>` has `version` equal to the version
   you passed.
6. `npm whoami` succeeds. In a dry run, a failure here doesn't stop the
   preview — it just shows `<not logged in>` in the plan.
7. `hyperformula-demos` has the `M.m.x` branch. A missing one is noted rather
   than fatal: step 8 can create it, and by then the release is already out, so
   refusing there would leave a published package and a dead script. Reporting it
   in the preflight is what gives you the chance to act. For a major or minor
   release a missing `M.m.x` means the freeze's demos step never finished, so the
   CodeSandbox URLs in `docs/` are probably wrong too; for the first patch on a
   new minor line there may simply be nothing there yet.

The commit `publish` merges is pinned during the preflight, so the later steps
merge exactly the commit these checks verified, even though pulling along the way
refreshes the refs.

### What it does

1. **Tests, builds and verifies the package** from `release/<version>`:
   reinstall, point the private test suite at the release branch, lint and run
   the whole test suite (unit and browser, as in the freeze), rebuild (all
   skipped by `--skip-build`), then always the publish-package check. It comes
   first because this is the last moment at which the run has changed nothing,
   so a failing test or a broken build costs only the time it took — no merge to
   unpick, no tag to delete, nothing pushed. It builds from the release branch
   rather than from `master`, which does not carry the release yet; step 2 is
   what proves the two hold the same content.
   The private suite is moved onto the release branch first because nothing
   keeps it there between the freeze and the publish, and the tests are only
   this release's tests while it is.
2. **Merges `release/<version>` into `master`** as a merge commit, unless it is
   already merged — then checks that `master`'s content now matches the release
   branch's. `npm publish` packs the working tree, so what ships is `master`'s
   files plus the artifacts step 1 built, and that only holds together while the
   merge brings nothing of `master`'s own. When it does — a hotfix committed
   straight to `master` during the freeze, say — `master` carries code that was
   never built or tested here, so the run stops with nothing pushed and nothing
   published: merge `master` into the release branch, let CI run on it, and
   publish again. A dry run cannot check this, having moved no branch.
3. **Tags `<version>` on `master`** — an annotated tag, message = the version —
   unless that tag already exists and is already in `master`'s (or
   `origin/master`'s) history — the latter so a dry run against a stale local
   `master` still recognises a tag that is fine on origin. If it exists anywhere
   else, the run stops so you can check it.
4. **Merges `release/<version>` into `develop`**, unless already merged.
5. **Pushes `master`, `develop` and the tags** in one atomic push, so a rejected
   `master` cannot leave the tag and `develop` published on their own. This
   happens before the npm publish, so the commit npm ships is already on origin.
6. **Merges the release branch back in `hyperformula-tests`**, into both `master`
   and `develop` there, and pushes both atomically. No tag — that repo is not
   versioned.
7. **The pause — the only step that cannot be undone.** Gets back onto `master`
   first: `npm publish` packs the working tree, and step 4 left you on
   `develop`, whose commits from during the freeze are not part of this release.
   Then, unless `hyperformula@<version>` is already on npm, prints the registry
   and the `npm whoami` user and asks you to type the version back (anything
   else aborts), then publishes and waits up to 60s for the new version to
   become visible on the registry. A plain `x.y.z` publishes under npm's
   `latest` tag; a version carrying a prerelease suffix (an rc, e.g.
   `3.5.0-rc.1`) publishes under `next` instead, so `npm install hyperformula`
   never resolves to it.
8. **Updates `hyperformula-demos`.** Syncs `develop`, refreshes the lock files,
   commits if anything changed, and pushes; then gets onto the `M.m.x` branch
   (fast-forwarding it first) and merges `develop` into it unless already merged,
   pushing that too. Ends on `develop` there.
9. **Leaves you on `develop`** in this repo, where the next cycle starts.

### What stays manual

The script finishes by printing these as a highlighted `[ ]` checklist, so
they are hard to miss in the output:

```
  [ ] Create the GitHub release for <version> (body = the <version> section of CHANGELOG.md):
        https://github.com/handsontable/hyperformula/releases/new?tag=<version>&title=<version>
  [ ] Check that the docs workflow deployed the documentation to gh-pages
  [ ] Announce the release in #hyperformula and #release
  [ ] Close the GitHub and ClickUp tasks in this release, announcing <version>,
      notify everyone involved in the discussions, and check linked issues
  [ ] Review the deployed docs and test the demos
```

For a prerelease version (an rc — anything not a plain `x.y.z`) the GitHub link
carries `&prerelease=1` and the checklist reminds you to leave *Set as the latest
release* unchecked, so the prerelease is not marked latest on GitHub either —
matching the `next` npm tag from step 7.

## Recorded failures

Both commands record anything you need to act on and re-print it as a `[ ]` item
at the top of the closing checklist. A single marker line mid-run cannot carry
that weight — it scrolls past in an output that also holds a full install, build
and test log. There are two kinds, and only one of them means the run fell short:

- **`!` — the script could not do it.** A step's target file has been
  restructured, or the `[Unreleased]` section is empty, so the step cannot do its
  job but the run is still worth finishing. These change the closing banner.
- **`i` — worth checking.** The run did its job, but something deserves a look:
  a resume that started from a dirty tree, or a demos version branch `publish`
  had to create itself. These are listed without changing the banner, so an
  ordinary resume does not announce itself as a failure.

So `Done - release/<version> is ready for the freeze` (or `Done - <version> is
released`) means the run did everything it set out to do, whatever is in the
"worth checking" list. `Finished, but N thing(s) could not be done` means the box
lists work that is still yours, and for a freeze the release branch needs those
fixes committed before the freeze is really under way.

The exit status stays 0 either way: these are interactive commands whose output
*is* the report, and a non-zero exit would make `npm run release` bury the
highlighted box under its own error block.

## Notes

- Both commands are re-runnable. Every step checks whether it is already done
  before acting; a `=` marker (instead of `run`'s `$`) means the step found
  nothing to do and skipped. If a run fails partway, fix the problem and run
  the same command again — it resumes from wherever it stopped, rather than
  redoing already-finished work.
- Dry run is the default; nothing changes until you pass `--real-run`. Wherever
  the script generates or edits content it previews the exact text, fenced by
  `-----` lines, so you can proofread it before the real run: the new
  `CHANGELOG.md` section, the new `release-notes.md` entry, and every
  CodeSandbox URL line it would rewrite (`-` current, `+` replacement).
- If any step fails, the script stops right there, prints which step failed, and
  runs nothing further.
- Getting onto a branch is one shared operation, wherever it happens: fetch
  first, prefer the local branch and fast-forward it, else create it from
  origin's, else create it from a named base. It never merges to get there, so a
  branch that has genuinely diverged is an error you get to look at rather than a
  merge commit invented on `develop` or on a shared version branch.
- Verification steps (build, lint, tests, and `publish`'s package check)
  always re-run, even on a resumed freeze or a resumed publish — nothing on
  disk proves the build artifacts still match the release commit, and these
  are usually the steps a re-run is retrying anyway. `publish`'s
  `--skip-build` is the explicit, deliberate override for the slow part (the
  reinstall, the test suite and the rebuild); the package check still runs
  even then.
- Release notes come straight from the changelog, so keep the `[Unreleased]`
  section tidy during development — that's exactly what becomes the notes.
- The git-flow steps are translated to plain git: `release start` becomes a
  branch off `develop`, `release publish` becomes a push. `publish` (this
  script's command) covers the rest of `release finish` — the merges into
  `master` and `develop`, and the tag — except that it never deletes
  `release/<v>`; the branch is kept in both repositories.
- The way both commands handle `hyperformula-tests` deliberately differs from
  the [ClickUp process doc](https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135)
  linked at the top of this file: the freeze gives that repo its own
  `release/<version>` branch and `publish` merges it back, where the doc still
  describes pointing its `master` at `develop` by hand. The ClickUp doc still
  needs updating to match.
- Not automated, and not on either checklist: the ClickUp doc's step of deploying
  the documentation to staging during the freeze. The checklist item about
  testing the code examples on staging assumes you have done it.

## Adding a command later

Each command is a `cmd_<name>` function plus a line in the `case` at the bottom of
the script, and a `usage_<name>` help function. To add, say, `post-release`: write
`cmd_post_release()`, add `post-release) cmd_post_release "$@" ;;` to the dispatch,
and list it in `usage_top`. (`cmd_code_freeze` and `cmd_publish` already follow
this shape — use either as a reference.) Call `start_warning_register` first if
the command has any step that can fail softly.
