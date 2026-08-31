# Target monorepo layout

This repository is becoming a monorepo (HF-359). The layout it stands at today is [`STRUCTURE.md`](STRUCTURE.md).

## Packages

| Package | Directory | Purpose | Published |
|---|---|---|---|
| `hyperformula` | `hyperformula/` | The calculation engine. Everything in `src/` and `test/` today. | yes |
| `hyperformula-ui` | `hyperformula-ui/` | UI components for working with HyperFormula: reference highlighting, inline formula editor, function help. | yes |
| `hyperformula-docs` | `docs/` | The VuePress documentation portal. | no |

`docs/` is not a workspace member: the portal drags in a large, old dependency tree (VuePress, `--openssl-legacy-provider`) that must not reach an engine install. It keeps its own `package.json` and is installed separately.

## Tree

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

## Migration steps

1. **Move `src/` and `test/` into `hyperformula/`.** Mechanical, but it invalidates every path in CI, in `tsconfig.json`, `jest.config.js`, `karma.conf.js`, `.eslintignore`, and the docs generator scripts. The private suite's specs need no change: they import the engine relatively, and the depth from a spec to the package root is unchanged.
2. **Add `workspaces` to the root `package.json`** and make it `private: true`. Move the build scripts down into `hyperformula/package.json`, leaving fan-out scripts at the root.
3. **Give `docs/` its own `package.json`** and take it out of the root dependency tree.
4. **Move `wrangler.jsonc` and `worker/` under `docs/`.** Update `wrangler.jsonc`'s `main`, the `docs:*:cf` scripts, and `script/prepare-cf-assets.js` in the same change. Verify with `npm run docs:preview:cf` — a broken `main` path fails only at deploy time.
5. **Bring in `hyperformula-ui`**, preserving its history.
6. **Split `CHANGELOG.md` per package**, each keeping the current Keep a Changelog form.
7. **Give every package an `.nvmrc` saying `22`.**
8. **Update the private test suite's checkout path**, from `test/hyperformula-tests/` to `hyperformula/test/hyperformula-tests/`, in `fetch-tests.sh`, `.gitignore`, the three workflows that check it out, and `.worktreeinclude`. It stays branch-matched.
9. **Path-filter CI.** Each package's jobs run only when its paths change; full runs on `develop`, `master`, and release branches.
