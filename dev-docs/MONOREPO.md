# Target monorepo layout

This repository is becoming a monorepo (HF-359). This file is the target: what the tree looks like, which directories are workspace members, and what the migration has to solve. It is a proposal until the migration lands — the authoritative layout of the repository as it stands today is [`STRUCTURE.md`](STRUCTURE.md).

## Packages

| Package | Directory | Purpose | Published |
|---|---|---|---|
| `hyperformula` | `hyperformula/` | The calculation engine. Everything in `src/` and `test/` today. | yes |
| `@hyperformula/ui-core` | `hyperformula-ui/packages/core/` | Formula editor UI: reference highlighting, inline editor, function help. | yes |
| `@hyperformula/handsontable-adapter` | `hyperformula-ui/packages/handsontable-adapter/` | Binds the editor to Handsontable. | yes |
| `@hyperformula/plain-table-adapter` | `hyperformula-ui/packages/plain-table-adapter/` | Binds the editor to a plain HTML table. | yes |
| `@hyperformula/tanstack-table-adapter` | `hyperformula-ui/packages/tanstack-table-adapter/` | Binds the editor to TanStack Table. | yes |
| `hyperformula-skill` | `hyperformula-skill/` | The agent skill that teaches coding agents to use HyperFormula. | as a plugin/zip |
| `hyperformula-docs` | `docs/` | The VuePress documentation portal. | no |
| — | `hyperformula-ui/demo/`, `hyperformula-ui/e2e/` | Demo app and end-to-end tests for the UI packages. | no |

`docs/` is deliberately **not** a workspace member: the portal drags in a large, old dependency tree (VuePress, `--openssl-legacy-provider`) that must not reach an engine install. It keeps its own `package.json` and is installed separately. This mirrors how the Handsontable monorepo isolates its documentation site.

## Tree

```
hyperformula/                              # repository root — private, workspace root
├── AGENTS.md                              # monorepo-wide rules + routing map
├── CLAUDE.md -> AGENTS.md
├── DEV_DOCS.md                            # pointer into dev-docs/
├── README.md  CONTRIBUTING.md  CHANGELOG.md  LICENSE.txt
├── package.json                           # private: true, npm workspaces, fan-out scripts
├── package-lock.json
├── .worktreeinclude
├── .changelogs/                           # one JSON fragment per PR (see below)
├── .claude/
│   ├── settings.json                      # hooks, enabledPlugins, worktree settings
│   ├── skills/                            # ALL skills, scoped by frontmatter path
│   └── agents/
├── dev-docs/                              # monorepo-scope reference
│   ├── README.md  STRUCTURE.md  BUILD.md  TESTING.md
│   ├── DEFINITION-OF-DONE.md  CODE-STYLE.md  DOC-STANDARDS.md
│   ├── WORKTREES.md  MONOREPO.md
│
├── hyperformula/                          # ── package: the engine
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   ├── package.json
│   ├── dev-docs/                          # engine-scope reference
│   │   ├── ARCHITECTURE.md  FUNCTION-CATALOGUE.md  I18N.md
│   ├── src/
│   │   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   │   ├── HyperFormula.ts  Config.ts  CrudOperations.ts  Evaluator.ts  …
│   │   ├── parser/                        AGENTS.md
│   │   ├── interpreter/                   AGENTS.md
│   │   │   ├── plugin/                    AGENTS.md
│   │   │   └── functionMetadata/          AGENTS.md
│   │   ├── DependencyGraph/               AGENTS.md
│   │   ├── dependencyTransformers/
│   │   ├── i18n/languages/                AGENTS.md
│   │   ├── format/  helpers/  Lookup/  statistics/
│   └── test/                              AGENTS.md
│       ├── smoke.spec.ts  fetch-tests.sh
│       └── hyperformula-tests/            # private suite, git-ignored, branch-matched
│
├── hyperformula-ui/                       # ── formula editor UI
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   ├── dev-docs/
│   ├── packages/
│   │   ├── core/                          AGENTS.md
│   │   ├── handsontable-adapter/          AGENTS.md
│   │   ├── plain-table-adapter/           AGENTS.md
│   │   └── tanstack-table-adapter/        AGENTS.md
│   ├── demo/
│   └── e2e/
│
├── hyperformula-skill/                    # ── agent skill
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   ├── skills/hyperformula/SKILL.md
│   └── scripts/
│
├── docs/                                  # ── documentation portal (NOT a workspace member)
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   ├── package.json
│   ├── guide/  api/  .vuepress/
│
├── worker/                                # Cloudflare Worker serving the built docs
├── examples/                              # images and CSV fixtures used by the docs
├── script/                                AGENTS.md
└── .github/workflows/                     # path-filtered per-package jobs
```

## Why this shape

- **Flat, name-matched top-level directories.** A directory is named after the package it holds, so a path in a stack trace, a CI job name, and a changelog entry all say the same word. No `packages/` wrapper at the root — it adds a level that carries no information.
- **`hyperformula-ui/` keeps its own `packages/`** because it genuinely holds four published packages that share a source tree and a test setup. They still version independently, like every other package here. Its entry in the root `workspaces` array is `hyperformula-ui/packages/*`.
- **`AGENTS.md` travels with the code.** Every file listed above stays with its directory through the move, so the agent instructions survive the migration unchanged.
- **Every package versions and releases on its own cadence.** No lockstep version, no shared release train. Consequences to build in from the start: one `CHANGELOG.md` per package rather than one at the root, git tags namespaced by package (`hyperformula@3.5.0`, `@hyperformula/ui-core@0.2.0`), a changelog fragment that names its package, and a release workflow parameterised by package instead of one that ships everything. Cross-package dependencies are declared as ordinary semver ranges, so the UI packages pin an engine range and are not forced to re-release when the engine does.
- **One `.claude/skills/` at the root.** Skills are scoped by a `paths` glob in their frontmatter rather than by placement, so there is one place to look and one place to keep them consistent.

## Migration steps

1. **Stay on npm.** The engine uses npm with a committed `package-lock.json`, and it keeps doing so: `workspaces` in the root `package.json` covers what this repository needs, and a package-manager migration is a risk the monorepo move does not need to carry at the same time. The cost lands on the way in — `hyperformula-ui` arrives as a pnpm workspace, so its `pnpm-workspace.yaml` and `pnpm-lock.yaml` are dropped and its package globs fold into the root `workspaces` array. Reconsider pnpm only if npm's hoisting turns out to break the wrapper packages.
2. **Move `src/` and `test/` into `hyperformula/`.** Mechanical, but it invalidates every path in CI, in `tsconfig.json`, in `jest.config.js`, in `karma.conf.js`, in `.eslintignore`, and in the docs generator scripts.
3. **Give `docs/` its own `package.json`** and take it out of the root dependency tree.
4. **Move the root build scripts down into `hyperformula/package.json`**, leaving fan-out scripts at the root.
5. **Bring in `hyperformula-ui`** from the formula-builder repository, preserving its history. Decide the published scope (`@hfe/*` today) before the first release from here.
6. **Bring in `hyperformula-skill`** from the shared skills repository. Its marketplace entry has to keep resolving — either the plugin build publishes from here, or the old repository keeps pointing at this one.
7. **Split `CHANGELOG.md` into `.changelogs/*.json` fragments.** One `CHANGELOG.md` edited by every package's pull requests conflicts on every merge. A per-PR JSON fragment plus a `consume` step removes the conflict entirely. Each fragment names the package it belongs to, so `consume` can compile one package's changelog without touching the others.
8. **Keep the private test suite branch-matched.** `hyperformula-tests` stays keyed to this repository's branch name; only its checkout path moves, from `test/hyperformula-tests/` to `hyperformula/test/hyperformula-tests/`. Update `fetch-tests.sh`, the `test:setup-private` script, and `.gitignore` together, and re-check `.worktreeinclude`, which names the old path.
9. **Path-filter CI.** Each package's jobs run only when its paths change; full runs on `develop`, `master`, and release branches.

## Open questions

- Which scope do the UI packages publish under, and does renaming them break existing consumers?
