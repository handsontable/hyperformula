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

`dev-docs/` exists at two levels. This one holds what applies to the whole repository; each package holds its own internals. A fact has exactly one home in exactly one of them — the split is by ownership, never a copy.

## Where to look

Repository-wide standards and process live here. Each package documents its own internals: the engine's are in [`hyperformula/dev-docs/`](../hyperformula/dev-docs/README.md).

| You are working on | Read |
|---|---|
| What a change must include before review | [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md) |
| Code style | [`CODE-STYLE.md`](CODE-STYLE.md) |
| What a test must prove, and how a case is written | [`TESTING.md`](TESTING.md) |
| Documentation rules, and the changelog | [`DOC-STANDARDS.md`](DOC-STANDARDS.md) |
| Writing a documentation page | [`DOCS-CONTENT-GUIDE.md`](DOCS-CONTENT-GUIDE.md) |
| Installing the workspace, deploying the portal, cutting a release | [`BUILD.md`](BUILD.md) |
| Opening a pull request | [`PULL-REQUESTS.md`](PULL-REQUESTS.md) |
| Which package holds what, and what the monorepo move still owes | [`STRUCTURE.md`](STRUCTURE.md) |
| A linked git worktree | [`WORKTREES.md`](WORKTREES.md) |
| How this repository is set up for agents | [`AGENT-TOOLING.md`](AGENT-TOOLING.md) |
| Step-by-step task workflows | [`.claude/skills/`](../.claude/skills/) |

Inside the engine — architecture, the parser, the interpreter, the dependency graph, the function catalogue, translations, performance, its test suites and its build:

| You are working on | Read |
|---|---|
| Anything in `hyperformula/src/` | [`hyperformula/dev-docs/README.md`](../hyperformula/dev-docs/README.md) |

Outside both: [`docs/README.md`](../docs/README.md) for running the documentation portal, [`hyperformula/test/README.md`](../hyperformula/test/README.md) for attaching the private test suite, and [`CONTRIBUTING.md`](../CONTRIBUTING.md) for external contributors.

## Conventions

- Markdown **link targets** are filesystem-relative — `../test/README.md` from here, `../../../dev-docs/TESTING.md` from a nested `AGENTS.md` — so they resolve on GitHub and in an editor.
- A path **named in prose** rather than linked is spelled from the repository root: `dev-docs/TESTING.md`, `src/interpreter/plugin/`.
- Diagrams live only in `dev-docs/`, never in the always-loaded `AGENTS.md` files.
- Public, user-facing documentation belongs in [`docs/`](../docs/), not here. `dev-docs/` never ships.
- **Nothing outside this directory restates what is in it.** `AGENTS.md`, `README.md`, and `SKILL.md` files carry only what is so specific to their own context that it would be useless anywhere else; everything else is a link. Two copies of a rule means one of them is wrong within a release, and the reader cannot tell which.
- `.ai/` exists only because some agents look for it. It contains one sentence pointing here.
