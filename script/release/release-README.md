# release.sh

Local automation for the HyperFormula
[release process](https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135).

Usage:

```bash
npm run release -- <command> [options]     # or: bash script/release/release.sh
```

## Before you start

Both commands work across three repositories: this one, `hyperformula-tests`,
and `hyperformula-demos`. Before making any change — including during a dry
run — each command checks that all three are usable, and refuses to start if
they are not.

- `hyperformula-tests` (default `test/hyperformula-tests`, override with
  `--tests-dir PATH`) and `hyperformula-demos` (default `../hyperformula-demos`,
  override with `--demos-dir PATH`) must each be a clone that has:
  - a clean working tree,
  - the branches this release will move (`develop` in both repos, plus
    `master` in `hyperformula-tests` while running `publish`),
  - a reachable `origin`.
- If you have never had a private test clone, run `npm run test:setup-private`
  first — it creates `test/hyperformula-tests` for you. `code-freeze` and
  `publish` deliberately do not clone it for you mid-run.
- A missing or dirty clone is an **error**, not a warning. This applies to dry
  runs too: a preview that cannot see the repositories it would touch is not a
  faithful preview.

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
| `--demos-dir PATH` | Path to your `hyperformula-demos` clone. |
| `--tests-dir PATH` | Path to your `hyperformula-tests` clone. |
| `-h`, `--help` | Show help for this command. |

`--tests-dir` should normally stay at its default. `test/fetch-tests.sh`
(invoked by the freeze through `npm run test:setup-private`) and the CI
workflows all hardcode `test/hyperformula-tests`, so pointing `--tests-dir`
elsewhere splits the freeze across two clones — and you must pass the same
`--tests-dir` to `publish` later, or it will look in `test/hyperformula-tests`
and fail to find the release branch.

### What it does

1. Gets onto `release/<version>`: creates it off `develop` the first time; on
   a re-run, resumes an existing one — checking out the local branch, or
   fetching it from origin first when only the remote has it (a cold local
   tracking ref).
2. Syncs the private test suite: `npm run test:setup-private` points
   `test/hyperformula-tests` at a branch matching the current branch name,
   creating that branch from `develop` the first time.
3. Sets `version` in `package.json` and `HT_RELEASE_DATE` in `ht.config.js` —
   each skipped when it already matches the target, so a re-run does not
   rewrite files it already wrote.
4. Reinstalls dependencies (wipes `node_modules`, deletes `package-lock.json`,
   runs `npm i`) — skipped when `package-lock.json` already names the new
   version and `node_modules` exists.
5. `npm run bundle-all`, then `npm run lint` and `npm run test:jest`. These
   always run, even when resuming a freeze that got this far before.
6. Inserts `## [<version>] - <date>` under `## [Unreleased]` in
   `CHANGELOG.md`, unless that entry already exists.
7. **Generates the release notes**: turns that changelog entry into a
   `docs/guide/release-notes.md` entry (`## <version>` +
   `**Release date: Month D, YYYY**` + the same bullets), unless it's already there.
8. **Major/minor only:** in `hyperformula-demos` runs `set-hyperformula-version.sh`,
   commits, pushes, and creates the `M.m.x` branch; then find-replaces the
   CodeSandbox demo URLs in `docs/`. Skipped entirely for a patch release.
9. `git add . && git commit -m <version> && git push -u origin release/<version>`
   — commits only if there is something to commit.
10. Creates `release/<version>` in `hyperformula-tests` too (the same resume
    logic as step 1), then `git push -u origin release/<version>` — so the
    branch is ready for CI and for other developers for the rest of the freeze.

### What stays manual

The script finishes by printing these as a highlighted `[ ]` checklist, so they
are hard to miss in the output:

```
  [ ] Post a heads-up about the code freeze in #hyperformula and #release

  During the freeze:
  [ ] Review the docs changes (GitHub compare)
  [ ] Test the code examples on staging
  [ ] Work with marketing on the blog post and social media content
```

## Command: `publish`

Publishes a finished release: merges `release/<version>` into `master` and
`develop`, tags it, builds and verifies the package, publishes it to npm, and
updates `hyperformula-tests` and `hyperformula-demos`. **Previews by
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
| `--skip-build` | Skip `npm ci` + `npm run bundle-all` (assumes the on-disk build already matches the release commit). `npm run verify:publish-package` still runs. Meant for a fast resume after a late failure. |
| `--demos-dir PATH` | Path to your `hyperformula-demos` clone. |
| `--tests-dir PATH` | Path to your `hyperformula-tests` clone. |
| `-h`, `--help` | Show help for this command. |

### Preflight

Before changing anything, `publish` checks every hard requirement and exits
with an error — in a dry run too — if one is not met:

1. This repo is a usable git work tree: `package.json` present, both `master`
   and `develop` branches exist, and the working tree is clean.
2. Both sibling clones are usable (see [Before you start](#before-you-start)).
3. `release/<version>` exists — locally or on origin — in this repo AND in
   `hyperformula-tests`. `publish` finishes a freeze; it never improvises one,
   so a missing branch is an error rather than a step it works around.
4. If both a local `release/<version>` and `origin/release/<version>` exist in
   this repo, they must point at the same commit — reconcile them first with
   `git checkout release/<version> && git pull --ff-only`.
5. `package.json` on `release/<version>` has `version` equal to the version
   you passed.
6. `npm whoami` succeeds. In a dry run, a failure here doesn't stop the
   preview — it just shows `<not logged in>` in the plan.

### What it does

1. Merges `release/<version>` into `master` (`--no-ff`), unless it is already
   merged.
2. Tags `<version>` on `master` — an annotated tag, message = the version —
   unless that tag already exists and is already in `master`'s history (if it
   exists anywhere else, the run stops so you can check it).
3. Merges `release/<version>` into `develop` (`--no-ff`), unless it is already
   merged.
4. Checks out `master` and builds: `npm ci` + `npm run bundle-all` (both
   skipped by `--skip-build`), then always `npm run verify:publish-package`.
5. Pushes `master`, `develop` and every tag in one atomic push:
   `git push --atomic origin master develop --tags`.
6. In `hyperformula-tests`: merges `release/<version>` into `master` and into
   `develop` there too (no tag — that repo isn't versioned), then
   `git push --atomic origin master develop`.
7. **The pause — the only irreversible step.** Unless `hyperformula@<version>`
   is already on npm, prints the registry and the `npm whoami` user and asks
   you to type the version back (anything else aborts), then runs
   `npm publish` and waits up to 60s for the new version to become visible on
   the registry.
8. Updates `hyperformula-demos`: fetches, syncs `develop`, runs
   `update-hyperformula-in-lock-files.sh`, commits if anything changed, and
   pushes; then gets onto the `M.m.x` branch (creating it if needed) and
   merges `develop` into it (unless already merged), pushing that too.
9. Leaves you on `develop` in this repo.

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
- Verification steps (build, lint, tests, and `publish`'s package check)
  always re-run, even on a resumed freeze or a resumed publish — nothing on
  disk proves the build artifacts still match the release commit, and these
  are usually the steps a re-run is retrying anyway. `publish`'s
  `--skip-build` is the explicit, deliberate override for the slow part
  (`npm ci` + `npm run bundle-all`); the package check still runs even then.
- Release notes come straight from the changelog, so keep the `[Unreleased]`
  section tidy during development — that's exactly what becomes the notes.
- The git-flow steps are translated to plain git: `release start` →
  `git checkout -b release/<v> develop`; `release publish` →
  `git push -u origin release/<v>`. `publish` (this script's command) covers
  the rest of `release finish` — the merges into `master` and `develop`, and
  the tag — except that it never deletes `release/<v>`; the branch is kept in
  both repositories.
- The way both commands handle `hyperformula-tests` deliberately differs from
  the [ClickUp process doc](https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135)
  linked at the top of this file. See
  `test/hyperformula-tests/dev_docs/2026-08-03-release-script-publish-command.md`
  for why the two disagree. The ClickUp doc still needs updating to match.

## Adding a command later

Each command is a `cmd_<name>` function plus a line in the `case` at the bottom of
the script, and a `usage_<name>` help function. To add, say, `post-release`: write
`cmd_post_release()`, add `post-release) cmd_post_release "$@" ;;` to the dispatch,
and list it in `usage_top`. (`cmd_code_freeze` and `cmd_publish` already follow
this shape — use either as a reference.)
