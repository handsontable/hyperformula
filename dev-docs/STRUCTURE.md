# Repository structure

A monorepo. Three top-level directories hold code; the rest is repository-wide.

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
