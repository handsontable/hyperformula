# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Codex, Aider, and any other AI tool) working in this repository.

This is the **repository-level** guide: rules that apply everywhere, plus a map of where to look next. Directory-specific rules live in that directory's own `AGENTS.md`, which loads automatically when you work there.

In every directory, `CLAUDE.md` is a symlink to its sibling `AGENTS.md`. Edit `AGENTS.md` — the symlink keeps Claude Code and Cursor reading the same single source.

## Overview

HyperFormula is a headless spreadsheet calculation engine in TypeScript. No UI, no DOM, no server: it parses formulas, tracks cell dependencies, and recalculates incrementally, in the browser and in Node. It ships as ES, CommonJS, and UMD bundles plus standalone language packs.

## Where to look

Route to the lowest correct scope. `AGENTS.md` answers *"what must I never get wrong here, and where do I look next."* `dev-docs/` answers *"how does this work and why."* Skills answer *"how do I do task X."* `AGENTS.md` files load automatically in their subtree; `dev-docs/` files need an explicit read.

| You are working on | Look here |
|---|---|
| Anything repository-wide (build, release, workspace) | This file; [`dev-docs/`](dev-docs/) |
| Engine source, any subsystem | [`src/AGENTS.md`](src/AGENTS.md); [`dev-docs/ARCHITECTURE.md`](dev-docs/ARCHITECTURE.md) |
| Formula parsing | [`src/parser/AGENTS.md`](src/parser/AGENTS.md) |
| Formula evaluation | [`src/interpreter/AGENTS.md`](src/interpreter/AGENTS.md) |
| A built-in spreadsheet function | [`src/interpreter/plugin/AGENTS.md`](src/interpreter/plugin/AGENTS.md); skill `hyperformula-function-dev` |
| Function descriptions shown in the API and the docs | [`src/interpreter/functionMetadata/AGENTS.md`](src/interpreter/functionMetadata/AGENTS.md); [`dev-docs/FUNCTION-CATALOGUE.md`](dev-docs/FUNCTION-CATALOGUE.md) |
| Dependency tracking and recalculation order | [`src/DependencyGraph/AGENTS.md`](src/DependencyGraph/AGENTS.md) |
| Function-name translations | [`src/i18n/AGENTS.md`](src/i18n/AGENTS.md); [`dev-docs/I18N.md`](dev-docs/I18N.md) |
| Tests | [`test/AGENTS.md`](test/AGENTS.md); [`dev-docs/TESTING.md`](dev-docs/TESTING.md) |
| The documentation portal | [`docs/AGENTS.md`](docs/AGENTS.md); [`DOCS_CONTENT_GUIDE.md`](DOCS_CONTENT_GUIDE.md) |
| Build, docs-generation, and release scripts | [`script/AGENTS.md`](script/AGENTS.md) |
| Working inside a linked git worktree | [`dev-docs/WORKTREES.md`](dev-docs/WORKTREES.md) |
| Step-by-step task workflows | [`.claude/skills/`](.claude/skills/) |

`dev-docs/` reference index: [`dev-docs/README.md`](dev-docs/README.md).

## Mandatory for every change

1. **Tests.** Every change to `src/` ships tests in `test/`. A bug fix ships a test that fails against the unfixed code. See [`dev-docs/TESTING.md`](dev-docs/TESTING.md).
2. **Documentation.** A public-API, behaviour, or configuration change updates the JSDoc and the affected guides in the same change. A breaking change adds a migration-guide section. See [`dev-docs/DOC-STANDARDS.md`](dev-docs/DOC-STANDARDS.md).
3. **Changelog entry**, unless the change is documentation-only.
4. **Keep the pull request description current.** Update it as the branch evolves.
5. **Update `AGENTS.md`.** If the change introduces a convention, constraint, file location, or gotcha that future agents should know, record it in the `AGENTS.md` at the correct scope.

The full list, and what "correct" means for each item, is in [`dev-docs/DEFINITION-OF-DONE.md`](dev-docs/DEFINITION-OF-DONE.md).

## Never publish sensitive information

Never write any of the following into a commit message, branch name, pull request title or description, GitHub issue or comment, code comment, changelog entry, or documentation page:

- client, customer, and partner names, or details that identify them indirectly (their domains, deployments, or the wording of their reports)
- personal data of any kind &mdash; names, e-mail addresses, phone numbers, user accounts, IP addresses
- credentials and secrets &mdash; API keys, tokens, passwords, license keys, private URLs
- internal-only material &mdash; contents of private repositories and internal tickets, unreleased plans, contract and pricing details

Describe the change on its own technical terms instead: write "fix an off-by-one error in `SUMIFS` when the criteria range is empty", not "fix the bug reported by \<company\>". An internal ticket identifier such as `HF-123` is fine on its own; the contents of that ticket are not.

If a change cannot be described without such information, stop and ask the user how to proceed.

## Build and test

Node version is pinned in [`.nvmrc`](.nvmrc); install with `npm ci`.

| Command | Runs |
|---|---|
| `npm run test:jest` | Jest — the fast loop |
| `npm run test` | Lint, Jest, and the browser run — the full local gate |
| `npm run test:setup-private` | Fetch the private test suite for the current branch |
| `npm run lint` | ESLint, the source of truth for formatting and code rules |
| `npm run bundle-all` | Every bundle, then verify them |

The full command reference, with what each script leaves on disk, is in [`dev-docs/BUILD.md`](dev-docs/BUILD.md).

**Run `npm run test:setup-private` after every branch switch.** The private suite in `test/hyperformula-tests/` is branch-matched; a stale checkout silently runs another branch's tests.

## Never edit generated or built output

`lib/`, `es/`, `commonjs/`, `dist/`, `languages/`, `typings/`, `docs/api/`, and `docs/guide/built-in-functions.md` are all produced by a build step and git-ignored. Never edit them, never commit them, and never read them to answer a question about behaviour — read `src/` instead.

## Other important resources

- the repository [README.md](README.md) &mdash; high-level project description and quick install/usage
- the markdown files in [`docs/guide/`](docs/guide/) &mdash; user-facing guides (installation, configuration, built-in functions, custom functions, integrations, etc.)
- the markdown files in [`docs/api/`](docs/api/) &mdash; API reference (generated from JSDoc; run `npm run docs:build` if the folder is missing)

Prefer reading these local files over fetching the rendered documentation from the web.

## Response style

- Be concise by default. Use as few words as possible unless the user asks for more detail.
- When the user asks for specific content, lead the response with the requested information.
- Structure answers with bullet lists, numbered lists, tables, or code blocks where useful.
- Ask clarifying questions when the request is ambiguous rather than guessing.
- If you do not know something, say so and ask for help.
- When answering from project documentation, quote the exact relevant fragments to support your claim.

## Common ways agents fail

This section is maintained by the team. Whenever an AI agent makes a mistake worth flagging, an item is added here describing what the agent did wrong and what it should have done instead. Read this list before starting any non-trivial task.

<!-- Add new items to the top of the list. Use the format:
- **Short title** &mdash; What the agent did wrong. What it should have done instead.
-->

1. **Stale pull request descriptions** &mdash; The description was written once and never revisited. Update it as the branch evolves.

## Skills, MCPs, and other agent tools

This section is maintained by the team. Skills, MCP servers, and other tools vetted as useful for AI agents working on this codebase are listed here.

<!-- Add new items here. Use the format:
- **Name** &mdash; What it provides and when to use it.
-->

- **`.claude/skills/`** &mdash; Repository skills, scoped by a `path` glob in their frontmatter. `hyperformula-dev` is the entry point for engine work; `hyperformula-function-dev` for adding or changing a built-in function; `pr-creation` before opening a pull request.
- **`typescript-lsp` plugin** &mdash; Language-server-backed go-to-definition and find-references. Use it instead of grepping for a symbol's definition or callers; grep stays right for text searches. Enabled repository-wide in `.claude/settings.json`.
