# Developer documentation

The canonical reference for everyone working on the HyperFormula source: maintainers, the internal team, and the AI agents they run. Written for humans first; agents read the same files.

Everything a developer needs to know lives here or is linked from here. External contributors start with [`CONTRIBUTING.md`](../CONTRIBUTING.md); users start with the [documentation portal](https://hyperformula.handsontable.com/docs).

## How the documentation is organised

| Layer | Answers | Loaded |
|---|---|---|
| `AGENTS.md` | *What is this directory, and where do I look next?* A pointer, nothing more. | Always, within its subtree |
| `dev-docs/` | *How does this work and why?* | On demand |
| `.claude/skills/` | *How do I do task X?* | On skill trigger |

In every directory, `CLAUDE.md` is a symlink to its sibling `AGENTS.md`. Edit `AGENTS.md` — the symlink keeps Claude Code and Cursor reading the same single source.

## Index

### Orientation

| File | Contents |
|---|---|
| [`STRUCTURE.md`](STRUCTURE.md) | Repository tree and what lives where. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the engine works: the pipeline, the core modules, and the invariants that hold everywhere in `hyperformula/src/`. |
| [`MONOREPO.md`](MONOREPO.md) | The monorepo layout this repository is moving to. |

### Subsystems

| File | Contents |
|---|---|
| [`PARSER.md`](PARSER.md) | `hyperformula/src/parser/` — formula text to AST, and back. |
| [`INTERPRETER.md`](INTERPRETER.md) | `hyperformula/src/interpreter/` — AST to value, and how a built-in function is written. |
| [`DEPENDENCY-GRAPH.md`](DEPENDENCY-GRAPH.md) | `hyperformula/src/DependencyGraph/` — dependency tracking and recalculation order. |
| [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md) | `hyperformula/src/interpreter/functionMetadata/` — what the API and the docs say about each function. |
| [`I18N.md`](I18N.md) | `hyperformula/src/i18n/` — function-name translations and where to source them. |

### Working on a change

| File | Contents |
|---|---|
| [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md) | What every change must include before review. |
| [`CODE-STYLE.md`](CODE-STYLE.md) | Code style, and the performance rules that apply to engine code. |
| [`TESTING.md`](TESTING.md) | Test suites, the private test repository, and how to write a case. |
| [`DOC-STANDARDS.md`](DOC-STANDARDS.md) | When documentation is required, and the rules it must satisfy — guides, API reference, JSDoc, and the changelog. |
| [`DOCS-CONTENT-GUIDE.md`](DOCS-CONTENT-GUIDE.md) | How to write a documentation page: structure, chunking, language, code examples, VuePress conventions, and the self-review checklist. |
| [`BUILD.md`](BUILD.md) | What the public [building guide](../docs/guide/building.md) does not cover: the intermediate build, generated docs, deployment, and release. |
| [`PULL-REQUESTS.md`](PULL-REQUESTS.md) | Branch naming, the pre-flight gate, and the pull request template. |
| [`WORKTREES.md`](WORKTREES.md) | Working in a linked git worktree: what is missing and how to bootstrap it. |
| [`AGENT-TOOLING.md`](AGENT-TOOLING.md) | How this repository is configured for AI agents: settings, hooks, and skills. |

### Elsewhere

| Where | For |
|---|---|
| [`docs/README.md`](../docs/README.md) | Running and extending the documentation portal |
| [`hyperformula/test/README.md`](../hyperformula/test/README.md) | Attaching the private test suite |
| [`script/README.md`](../script/README.md) | What each build and release script does |
| [`CHANGELOG.md`](../CHANGELOG.md) | Release history |
| [`.github/pull_request_template.md`](../.github/pull_request_template.md) | The pull request template |

## Conventions

- Cross-references use repository-root-relative paths (for example `dev-docs/TESTING.md`), not filesystem-relative `../` paths.
- Diagrams live only in `dev-docs/`, never in the always-loaded `AGENTS.md` files.
- Public, user-facing documentation belongs in [`docs/`](../docs/), not here. `dev-docs/` never ships.
- **Nothing outside this directory restates what is in it.** `AGENTS.md`, `README.md`, and `SKILL.md` files carry only what is so specific to their own context that it would be useless anywhere else; everything else is a link. Two copies of a rule means one of them is wrong within a release, and the reader cannot tell which.
- `.ai/` exists only because some agents look for it. It contains one sentence pointing here.
