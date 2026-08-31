# `dev-docs/` — developer reference

Deep reference documentation for everyone working on HyperFormula: maintainers, the internal team, and the AI agents they run. Written for humans first; agents read the same files.

These files are **loaded on demand** — linked from the always-loaded `AGENTS.md` files and from skills, not read on every turn.

## Three-layer model

| Layer | Answers | Loaded |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` | *What must I never get wrong here, and where do I look next?* Lean rules plus a navigation map for the directory it lives in. | Always, within its subtree |
| `dev-docs/` | *How does this work and why?* Architecture, conventions, standards, deep detail. | On demand |
| `.claude/skills/` | *How do I do task X?* Step-by-step workflows. | On skill trigger |

In every directory, `CLAUDE.md` is a symlink to its sibling `AGENTS.md`. Edit `AGENTS.md` — the symlink keeps Claude Code and Cursor reading the same single source.

## Index

| File | Contents |
|---|---|
| [`STRUCTURE.md`](STRUCTURE.md) | Repository tree and what lives where. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Engine architecture: parser, interpreter, dependency graph, and the data flow between them. |
| [`BUILD.md`](BUILD.md) | Every build, bundle, lint, and release command, with its output. |
| [`TESTING.md`](TESTING.md) | Test suites, the private test repository, and what a change must cover. |
| [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md) | What every change must include before review. |
| [`CODE-STYLE.md`](CODE-STYLE.md) | Code style and the performance rules that apply to engine code. |
| [`DOC-STANDARDS.md`](DOC-STANDARDS.md) | Documentation rules across guides, API reference, JSDoc, and the changelog. |
| [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md) | The function metadata catalogue: what it feeds, and the two ways to get it wrong. |
| [`I18N.md`](I18N.md) | Function-name translations and where to source them. |
| [`WORKTREES.md`](WORKTREES.md) | Working in a linked git worktree: what is missing and how to bootstrap it. |
| [`MONOREPO.md`](MONOREPO.md) | The target monorepo layout and the migration it implies. |

## Conventions

- Cross-references use repository-root-relative paths (for example `dev-docs/TESTING.md`), not filesystem-relative `../` paths.
- Diagrams live only in `dev-docs/`, never in the always-loaded `AGENTS.md` files.
- Public, user-facing documentation belongs in [`docs/`](../docs/), not here. `dev-docs/` never ships.
