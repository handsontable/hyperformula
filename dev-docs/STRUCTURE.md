# Repository structure

Where everything lives today, and where it is going. The repository is becoming a monorepo (HF-359); the second half of this page is the target and the steps that get there.

```
.
├── src/                              # Source code
│   ├── HyperFormula.ts               # Main engine class, public API entry point
│   ├── BuildEngineFactory.ts         # Engine construction from sheets, data, and config
│   ├── Config.ts, ConfigParams.ts    # Engine configuration and its defaults
│   ├── CrudOperations.ts             # Create/read/update/delete on sheets and cells
│   ├── Operations.ts, UndoRedo.ts    # Operation primitives and the undo/redo stack
│   ├── Evaluator.ts                  # Recalculation driver
│   ├── Serialization.ts, Exporter.ts # Reading values and formulas back out
│   ├── NamedExpressions.ts           # Named expression store
│   ├── parser/                       # Formula parsing (Chevrotain parser generator)
│   ├── interpreter/                  # Formula evaluation
│   │   ├── plugin/                   # Built-in spreadsheet function plugins
│   │   └── functionMetadata/         # Human-readable metadata for every built-in function
│   ├── DependencyGraph/              # Cell dependency tracking and recalculation order
│   ├── dependencyTransformers/       # AST rewrites when rows/columns/sheets move
│   ├── i18n/languages/               # Function-name translations, one file per language
│   ├── format/                       # Number and date format parsing
│   ├── helpers/                      # Shared utilities
│   ├── Lookup/                       # Lookup/search strategies used by lookup functions
│   └── statistics/                   # Instrumentation counters
├── test/                             # Smoke tests; the full suite is fetched here
│   ├── README.md                     # How to attach the private suite
│   ├── smoke.spec.ts                 # Public smoke tests
│   ├── fetch-tests.sh                # Clones/updates the private test repository
│   └── hyperformula-tests/           # Private suite (git-ignored, branch-matched)
├── docs/                             # Public documentation portal (VuePress)
│   ├── guide/                        # Markdown guides
│   ├── api/                          # API reference (generated from JSDoc; git-ignored)
│   └── .vuepress/                    # VuePress configuration, theme, components
├── script/                           # Maintenance, docs-generation, and release scripts
├── worker/                           # Cloudflare Worker that serves the built docs
├── examples/                         # Images and CSV fixtures used by the docs
├── dev-docs/                         # Developer reference (this directory)
├── .claude/                          # Claude Code settings, skills, and agents
├── .github/                          # CI workflows, issue and PR templates
├── AGENTS.md                         # Always-loaded agent rules and routing map
├── CLAUDE.md                         # Symlink to AGENTS.md
├── CONTRIBUTING.md                   # Guide for external contributors
├── README.md                         # Project overview
└── CHANGELOG.md
```

## Build outputs

All git-ignored, all produced by `npm run bundle-all` (see [`BUILD.md`](BUILD.md)):

| Directory | Contents |
|---|---|
| `lib/` | `tsc` output, the input to every bundle |
| `es/` | ES modules (`.mjs`) |
| `commonjs/` | CommonJS modules |
| `dist/` | UMD bundles, minified and not, base and `.full` |
| `languages/` | Standalone UMD language packs |
| `typings/` | Public `.d.ts` declarations |

Never edit these, and never read them to answer a question about behaviour — read `src/` instead.

## Directories with their own `AGENTS.md`

Each of these carries rules that load only when an agent works inside it:

`src/`, `src/parser/`, `src/interpreter/`, `src/interpreter/plugin/`, `src/interpreter/functionMetadata/`, `src/DependencyGraph/`, `src/i18n/`, `docs/`, `test/`, `script/`.

## Where it is going

The repository is becoming a monorepo. The tree above is what a checkout looks like now; everything below is the target.

### Packages

| Package | Directory | Purpose | Published |
|---|---|---|---|
| `hyperformula` | `hyperformula/` | The calculation engine. Everything in `src/` and `test/` today. | yes |
| `hyperformula-ui` | `hyperformula-ui/` | UI components for working with HyperFormula: reference highlighting, inline formula editor, function help. | yes |
| `hyperformula-docs` | `docs/` | The VuePress documentation portal. | no |

`docs/` is not a workspace member: the portal drags in a large, old dependency tree (VuePress, `--openssl-legacy-provider`) that must not reach an engine install. It keeps its own `package.json` and is installed separately.

### Target tree

```
hyperformula/                              # repository root — private, workspace root
├── AGENTS.md                              # monorepo-wide rules + routing map
├── CLAUDE.md -> AGENTS.md
├── README.md  CONTRIBUTING.md  CHANGELOG.md  LICENSE.txt
├── package.json                           # private: true, npm workspaces, fan-out scripts
├── package-lock.json
├── .nvmrc                                 # 22, like every other one here
├── .worktreeinclude
├── .claude/
│   ├── settings.json                      # hooks, enabledPlugins, worktree settings
│   └── skills/                            # ALL skills, scoped by the `paths` frontmatter field
├── dev-docs/                              # monorepo-scope reference
│
├── hyperformula/                          # ── package: the engine
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   ├── package.json  .nvmrc  CHANGELOG.md
│   ├── dev-docs/                          # engine-scope reference
│   ├── src/
│   │   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   │   ├── parser/                        AGENTS.md
│   │   ├── interpreter/                   AGENTS.md
│   │   │   ├── plugin/                    AGENTS.md
│   │   │   └── functionMetadata/          AGENTS.md
│   │   ├── DependencyGraph/               AGENTS.md
│   │   ├── i18n/languages/                AGENTS.md
│   │   └── dependencyTransformers/  format/  helpers/  Lookup/  statistics/
│   └── test/                              AGENTS.md  README.md
│       └── hyperformula-tests/            # private suite, git-ignored, branch-matched
│
├── hyperformula-ui/                       # ── package: the UI components
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md
│   ├── package.json  .nvmrc  CHANGELOG.md
│   ├── dev-docs/
│   └── src/  test/
│
├── docs/                                  # ── documentation portal (NOT a workspace member)
│   ├── AGENTS.md  CLAUDE.md -> AGENTS.md  README.md
│   ├── package.json  .nvmrc
│   ├── wrangler.jsonc                     # deploy config for the portal
│   ├── worker/index.js                    # Cloudflare Worker serving the built portal
│   └── guide/  api/  .vuepress/
│
├── examples/                              # images and CSV fixtures used by the docs
├── script/                                AGENTS.md  README.md
└── .github/workflows/                     # path-filtered per-package jobs
```

### Migration steps

1. **Move `src/` and `test/` into `hyperformula/`.** Mechanical, but it invalidates every path in CI, in `tsconfig.json`, `jest.config.js`, `karma.conf.js`, `.eslintignore`, and the docs generator scripts. The private suite's specs need no change: they import the engine relatively, and the depth from a spec to the package root is unchanged.
2. **Add `workspaces` to the root `package.json`** and make it `private: true`. Move the build scripts down into `hyperformula/package.json`, leaving fan-out scripts at the root.
3. **Give `docs/` its own `package.json`** and take it out of the root dependency tree.
4. **Move `wrangler.jsonc` and `worker/` under `docs/`.** Update `wrangler.jsonc`'s `main`, the `docs:*:cf` scripts, and `script/prepare-cf-assets.js` in the same change. Verify with `npm run docs:preview:cf` — a broken `main` path fails only at deploy time.
5. **Bring in `hyperformula-ui`**, preserving its history.
6. **Split `CHANGELOG.md` per package**, each keeping the current Keep a Changelog form.
7. **Give every package an `.nvmrc` saying `22`.**
8. **Update the private test suite's checkout path**, from `test/hyperformula-tests/` to `hyperformula/test/hyperformula-tests/`, in `fetch-tests.sh`, `.gitignore`, the three workflows that check it out, and `.worktreeinclude`. It stays branch-matched.
9. **Path-filter CI.** Each package's jobs run only when its paths change; full runs on `develop`, `master`, and release branches.
