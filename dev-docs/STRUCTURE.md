# Repository structure

A monorepo. Three top-level directories hold code; the rest is repository-wide. What the move still owes is at the bottom of this page.

```
.
├── hyperformula/                     # ── package: the calculation engine (published)
│   ├── src/                          # Source code
│   │   ├── HyperFormula.ts           # Main engine class, public API entry point
│   │   ├── parser/                   # Formula parsing (Chevrotain parser generator)
│   │   ├── interpreter/              # Formula evaluation
│   │   │   ├── plugin/               # Built-in spreadsheet function plugins
│   │   │   └── functionMetadata/     # Human-readable metadata for every built-in
│   │   ├── DependencyGraph/          # Cell dependency tracking and recalculation order
│   │   ├── dependencyTransformers/   # AST rewrites when rows/columns/sheets move
│   │   ├── i18n/languages/           # Function-name translations, one file per language
│   │   ├── format/  helpers/  Lookup/  statistics/
│   ├── test/                         # Smoke tests; the private suite mounts here
│   │   ├── smoke.spec.ts             # Public smoke tests
│   │   ├── fetch-tests.sh            # Clones/updates the private test repository
│   │   └── hyperformula-tests/       # Private suite (git-ignored, branch-matched)
│   ├── dev-docs/                     # the engine's own internals reference
│   ├── script/                       # its build checks: check-file, check-publish-package, if-ne-env
│   ├── .config/                      # webpack, karma, and babel config factories
│   ├── tsconfig.json  jest.config.js  karma.conf.js  webpack.config.js
│   ├── babel.config.js  ht.config.js  jasmine.json  .npmignore
│   ├── .typedoc.ts  .typedoc.md.ts   # API reference generation, output into docs/api
│   ├── package.json  .nvmrc  README.md  LICENSE.txt
│   └── AGENTS.md  CLAUDE.md
│
├── hyperformula-ui/                  # ── package: UI components (not imported yet)
│
├── docs/                             # ── the documentation portal (NOT a workspace member)
│   ├── guide/                        # Markdown guides
│   ├── api/                          # API reference (generated; git-ignored)
│   ├── examples/                     # Code examples embedded in guides
│   ├── .vuepress/                    # VuePress configuration, theme, components, plugins
│   ├── script/                       # Generates guide/built-in-functions.md; composes the Worker assets
│   ├── worker/index.js               # Cloudflare Worker serving the built portal
│   ├── wrangler.jsonc                # Its deploy configuration
│   ├── package.json  .nvmrc
│   └── AGENTS.md  CLAUDE.md  README.md
│
├── script/                           # Repository-wide only: the release procedure and the licence gate
├── dev-docs/                         # Repository-wide reference (this directory; start at README.md)
├── .ai/                              # One sentence pointing at dev-docs/, for agents that look here
├── .claude/                          # Claude Code settings and skills
├── .github/                          # CI workflows, issue and PR templates
├── .eslintrc.js  .eslintignore       # Linting, run once from the root over everything
├── package.json                      # Private workspace root: fan-out scripts only
├── package-lock.json  .nvmrc  .worktreeinclude
├── AGENTS.md  CLAUDE.md  README.md  CONTRIBUTING.md  LICENSE.txt
├── CHANGELOG.md                      # one history for every package
└── CODE_OF_CONDUCT.md
```

## Workspaces

`workspaces` in the root `package.json` lists `hyperformula`. `npm ci` at the root installs it into a shared `node_modules`. `hyperformula-ui/` is a placeholder and is deliberately not listed yet — see [What the move still owes](#what-the-move-still-owes).

**`docs/` is deliberately outside the workspace.** The portal drags in a large, old dependency tree (VuePress 1.x, `--openssl-legacy-provider`) that must not reach an engine install. It has its own `package.json` and installs separately with `npm run docs:install`.

## Where a command runs

| Command | Runs in |
|---|---|
| `npm run lint` | The root, over the whole repository |
| `npm run test:jest`, `bundle-all`, `compile` | Fanned out to `hyperformula` |
| `npm run docs:*` | Orchestrated from the root across both `hyperformula` and `docs` |

Run a package's own scripts from its directory, or with `--workspace=hyperformula`. See [`BUILD.md`](BUILD.md).

## Build outputs

All git-ignored, all under `hyperformula/`: `lib/` (`tsc` output, the input to every bundle), `es/`, `commonjs/`, `dist/`, `languages/`, `typings/`. The portal's output is `docs/.vuepress/dist/`, and `docs/api/` plus `docs/guide/built-in-functions.md` are generated.

Never edit any of them. Never read the **build artifacts** — `lib/`, `es/`, `commonjs/`, `dist/`, `languages/`, `typings/`, `docs/.vuepress/dist/` — to answer a question about behaviour; read `hyperformula/src/` instead, and the agent deny list in `.claude/settings.json` enforces that.

`docs/api/` and `docs/guide/built-in-functions.md` are the exception. They are generated, so editing them is pointless, but they *are* the API reference and the function reference and reading them is often exactly right.

## `dev-docs/` at two levels

This directory holds what applies to the whole repository: the definition of done, code style, testing standards, documentation rules, the build and release process, pull requests, worktrees, and the agent setup.

[`hyperformula/dev-docs/`](../hyperformula/dev-docs/README.md) holds the engine's internals: architecture, the parser, the interpreter, the dependency graph, the function catalogue, translations, performance, its test suites, and its own build steps.

The split is by ownership. A fact lives in exactly one of them, and `hyperformula-ui` gets its own when it lands.

## Scripts at three levels

Each script lives with whatever invokes it, and every one has exactly one caller:

| Directory | Holds |
|---|---|
| `script/` | `release/` and `check-licenses.mjs` — both span the whole repository |
| `hyperformula/script/` | `check-file.js`, `check-publish-package.js`, `if-ne-env.js` — called by the engine's build |
| `docs/script/` | the built-in-functions generator and `prepare-cf-assets.js` — called by the portal |

## Directories with their own `AGENTS.md`

`hyperformula/`, `hyperformula/src/`, `hyperformula/src/parser/`, `hyperformula/src/interpreter/`, `hyperformula/src/interpreter/plugin/`, `hyperformula/src/interpreter/functionMetadata/`, `hyperformula/src/DependencyGraph/`, `hyperformula/src/i18n/`, `hyperformula/test/`, `docs/`, and `script/`.

Each is a pointer of a few lines — what the directory is, and which `dev-docs/` page or local `README.md` holds the detail. They load automatically when an agent reads a file in that subtree, so they stay small on purpose.

## What the move still owes

1. **Import `hyperformula-ui`.** The directory is a placeholder; the package is imported from the formula-builder repository in a separate change, preserving its history, and it keeps the scope it publishes under today. Add `hyperformula-ui` to the root `workspaces` array in that same change, not before: npm silently ignores an entry with no `package.json`, so listing it early buys nothing and the lockfile has to be regenerated when the package lands either way. When it arrives it also needs an `.nvmrc` saying `22` and an `AGENTS.md` with a `CLAUDE.md` symlink — but no changelog of its own, and its version moves in step with the engine's. The release script bumps one manifest today; give it the second one in the same change.
2. **Path-filter CI.** Each package's jobs should run only when its own paths change, with full runs on `develop`, `master`, and release branches. Not done here on purpose: a naive `paths:` filter on a workflow that branch protection lists as a required check leaves the check permanently pending, and pull requests become unmergeable. Doing it safely needs the required-checks list, which lives in repository settings rather than in the tree, and the `dorny/paths-filter`-plus-single-gate shape that the Handsontable monorepo uses.

## What the move decided

- **npm workspaces, not pnpm.** A package-manager migration is a risk the move did not need to carry at the same time.
- **`docs/` is not a workspace member.** VuePress 1.x and its `--openssl-legacy-provider` dependency tree must never reach an engine install. It installs on its own with `npm run docs:install`, and CI installs it before building the portal.
- **`dev-docs/` at two levels, not one at the root.** One directory at the root was the original plan; it was dropped in favour of splitting by ownership, so that each package's internals travel with the package and `hyperformula-ui` gets its own when it lands. Repository-wide standards stay here, and a fact lives in exactly one level — see [`dev-docs/` at two levels](#dev-docs-at-two-levels).
- **The packages release together, on one version, from one changelog.** A release cuts every published package at the same version, whether or not each one changed, and `CHANGELOG.md` at the repository root is the single history for all of them. That keeps one number to reason about — the version a user reports a bug against identifies the state of the whole repository — at the cost of publishing a package whose code did not move. Entries name the package they concern where it is not obvious.
- **The published tarball still carries a changelog.** `hyperformula`'s `prepack` copies the root `CHANGELOG.md` into the package and `postpack` removes it again, so there is one file under version control and npm consumers still get one.
- **Every `.nvmrc` says `22`.**
- **Linting stays at the root**, run once over the whole repository, so nothing between packages falls through the gap.
- **The private test suite stays branch-matched.** Only its checkout path moved, to `hyperformula/test/hyperformula-tests/`. Its specs needed no change: they import the engine relatively, and the depth from a spec to the package root is unchanged.

## Two things the move uncovered

Both were pre-existing, and both are recorded here because the next person will otherwise rediscover them the hard way.

- **The source language packs were never linted.** The old ignore list carried a bare `languages` entry meant for the build output. An unanchored pattern matches a directory of that name at any depth, so it also excluded `src/i18n/languages/`, and the `sort-keys` override targeting those files never ran. Anchoring the build-output entry exposed 881 violations. They are excluded again, deliberately and with a comment, in [`.eslintignore`](../.eslintignore); sorting 19 translation files is a change of its own.
- **`@vuepress/shared-utils` only works inside a full VuePress dependency tree.** It requires `markdown-it-emoji` and a `lru-cache` major it does not declare, and relied on `vuepress` hoisting them. That is why the built-in-functions generator moved into `docs/script/`, where that tree exists, rather than staying beside the engine build scripts.
