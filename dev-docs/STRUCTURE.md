# Repository structure

The layout as it stands today. For the monorepo layout this repository is moving to, see [`MONOREPO.md`](MONOREPO.md).

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
├── DOCS_CONTENT_GUIDE.md             # Writing style and structure for docs content
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
