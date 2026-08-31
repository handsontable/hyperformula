# The monorepo migration

The move landed in HF-359. The layout as it now stands is [`STRUCTURE.md`](STRUCTURE.md); this page records what the migration decided, what it deliberately left alone, and what is still outstanding.

## Still outstanding

1. **Import `hyperformula-ui`.** The directory exists and is listed in the root `workspaces` array; the package itself is imported from the formula-builder repository in a separate change, preserving its history. It keeps the scope it publishes under today. When it lands it needs an `.nvmrc` saying `22`, a `CHANGELOG.md`, and an `AGENTS.md` with a `CLAUDE.md` symlink.
2. **Path-filter CI.** Each package's jobs should run only when its own paths change, with full runs on `develop`, `master`, and release branches. Not done here on purpose: a naive `paths:` filter on a workflow that branch protection lists as a required check leaves the check permanently pending, and pull requests become unmergeable. Doing it safely needs the required-checks list, which lives in repository settings rather than in the tree, and the `dorny/paths-filter`-plus-single-gate shape that the Handsontable monorepo uses.

## What the migration decided

- **npm workspaces, not pnpm.** A package-manager migration is a risk the move did not need to carry at the same time.
- **`docs/` is not a workspace member.** VuePress 1.x and its `--openssl-legacy-provider` dependency tree must never reach an engine install. It installs on its own with `npm run docs:install`, and CI installs it before building the portal.
- **One `dev-docs/`, at the root.** The original plan put an engine-scope copy inside `hyperformula/`. That was dropped: two directories fragment the single source of truth, and every page would have to know which scope it was written from. The engine's subsystem pages live here alongside the repository-wide ones.
- **Every package versions and releases on its own cadence**, with its own `CHANGELOG.md` in the existing Keep a Changelog form. No fragment mechanism.
- **Every `.nvmrc` says `22`.**
- **Linting stays at the root**, run once over the whole repository, so nothing between packages falls through the gap.
- **The private test suite stays branch-matched.** Only its checkout path moved, to `hyperformula/test/hyperformula-tests/`. Its specs needed no change: they import the engine relatively, and the depth from a spec to the package root is unchanged.

## Two things the move uncovered

Both were pre-existing, and both are recorded here because the next person will otherwise rediscover them the hard way.

- **The source language packs were never linted.** The old ignore list carried a bare `languages` entry meant for the build output. An unanchored pattern matches a directory of that name at any depth, so it also excluded `src/i18n/languages/`, and the `sort-keys` override targeting those files never ran. Anchoring the build-output entry exposed 881 violations. They are excluded again, deliberately and with a comment, in [`.eslintignore`](../.eslintignore); sorting 19 translation files is a change of its own.
- **`@vuepress/shared-utils` only works inside a full VuePress dependency tree.** It requires `markdown-it-emoji` and a `lru-cache` major it does not declare, and relied on `vuepress` hoisting them. That is why the built-in-functions generator moved into `docs/script/`, where that tree exists, rather than staying beside the engine build scripts.
