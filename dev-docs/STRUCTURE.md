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
│   ├── .config/                      # webpack, karma, and babel config factories
│   ├── tsconfig.json  jest.config.js  karma.conf.js  webpack.config.js
│   ├── babel.config.js  ht.config.js  jasmine.json  .npmignore
│   ├── .typedoc.ts  .typedoc.md.ts   # API reference generation, output into docs/api
│   ├── package.json  .nvmrc  CHANGELOG.md  README.md  LICENSE.txt
│   └── AGENTS.md  CLAUDE.md
│
├── hyperformula-ui/                  # ── package: UI components (not imported yet)
│
├── docs/                             # ── the documentation portal (NOT a workspace member)
│   ├── guide/                        # Markdown guides
│   ├── api/                          # API reference (generated; git-ignored)
│   ├── examples/                     # Code examples embedded in guides
│   ├── .vuepress/                    # VuePress configuration, theme, components, plugins
│   ├── script/                       # Generates guide/built-in-functions.md
│   ├── worker/index.js               # Cloudflare Worker serving the built portal
│   ├── wrangler.jsonc                # Its deploy configuration
│   ├── package.json  .nvmrc
│   └── AGENTS.md  CLAUDE.md  README.md
│
├── script/                           # Repository-wide scripts: build checks, release, agent hooks
├── examples/                         # Images and CSV fixtures used by the docs
├── dev-docs/                         # Developer reference (this directory; start at README.md)
├── .ai/                              # One sentence pointing at dev-docs/, for agents that look here
├── .claude/                          # Claude Code settings, skills, and hooks
├── .github/                          # CI workflows, issue and PR templates
├── .eslintrc.js  .eslintignore       # Linting, run once from the root over everything
├── package.json                      # Private workspace root: fan-out scripts only
├── package-lock.json  .nvmrc  .worktreeinclude
├── AGENTS.md  CLAUDE.md  README.md  CONTRIBUTING.md  CHANGELOG.md  LICENSE.txt
└── CODE_OF_CONDUCT.md
```

## Workspaces

`workspaces` in the root `package.json` lists `hyperformula` and `hyperformula-ui`. `npm ci` at the root installs both into a shared `node_modules`.

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

## Directories with their own `AGENTS.md`

`hyperformula/`, `hyperformula/src/`, `hyperformula/src/parser/`, `hyperformula/src/interpreter/`, `hyperformula/src/interpreter/plugin/`, `hyperformula/src/interpreter/functionMetadata/`, `hyperformula/src/DependencyGraph/`, `hyperformula/src/i18n/`, `hyperformula/test/`, `docs/`, and `script/`.

Each is a pointer of a few lines — what the directory is, and which `dev-docs/` page or local `README.md` holds the detail. They load automatically when an agent reads a file in that subtree, so they stay small on purpose.

## What the move still owes

1. **Import `hyperformula-ui`.** The directory exists and is listed in the root `workspaces` array; the package itself is imported from the formula-builder repository in a separate change, preserving its history. It keeps the scope it publishes under today. When it lands it needs an `.nvmrc` saying `22`, a `CHANGELOG.md`, and an `AGENTS.md` with a `CLAUDE.md` symlink.
2. **Path-filter CI.** Each package's jobs should run only when its own paths change, with full runs on `develop`, `master`, and release branches. Not done here on purpose: a naive `paths:` filter on a workflow that branch protection lists as a required check leaves the check permanently pending, and pull requests become unmergeable. Doing it safely needs the required-checks list, which lives in repository settings rather than in the tree, and the `dorny/paths-filter`-plus-single-gate shape that the Handsontable monorepo uses.

## What the move decided

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
