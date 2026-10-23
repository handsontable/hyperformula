# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Codex, Aider, and any other AI tool) working in this repository.

HyperFormula is a headless spreadsheet calculation engine in TypeScript. No UI, no DOM, no server: it parses formulas, tracks cell dependencies, and recalculates incrementally, in the browser and in Node.

## Start at `dev-docs/`

**[`dev-docs/`](dev-docs/) is the single source of truth for everything internal to this project.** Architecture, conventions, build, testing, standards, and the monorepo plan all live there and nowhere else. This file routes; it does not explain. Neither does any other `AGENTS.md` or `README.md`: each carries only what is so specific to its own directory that it would be useless anywhere else, and links for the rest. If one of them looks like it is explaining something general, the explanation belongs in `dev-docs/`.

Read [`dev-docs/README.md`](dev-docs/README.md) first. It says which page covers what, and every directory's own `AGENTS.md` points at the page that covers that directory. To review a pull request, start at [`dev-docs/CODE-REVIEW.md`](dev-docs/CODE-REVIEW.md).

Read the repository, not the web. The guides in `docs/guide/` and the generated API reference in `docs/api/` are the content the documentation portal serves: read the local files rather than fetching the rendered pages, and read `hyperformula/src/` rather than either when the question is what the code actually does.

## Never publish sensitive information

[`dev-docs/SENSITIVE-INFORMATION.md`](dev-docs/SENSITIVE-INFORMATION.md) says what must never appear in code, commits, pull requests, issues, or docs, and how to describe a change without it.

If a change cannot be described without sensitive information, stop and ask the user how to proceed.

## Keep the documentation single-sourced

When a change introduces a convention, constraint, file location, or gotcha that future agents should know, record it in `dev-docs/`, on the page that owns the topic — not in an `AGENTS.md`, not in a `README.md`, and not in a skill. Those three link to it.

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

1. **Leftover files** &mdash; The agent committed plans, ADRs about a single function, scratch scripts, generated files, or debug logs. It should have deleted them before committing.
2. **Unrequested work** &mdash; The agent added features, docs sections, or files nobody asked for, or made unrelated configuration, CI, or ESLint changes to get something passing. It should have done only what was asked and raised anything else with the user; see [One pull request, one change](dev-docs/DEFINITION-OF-DONE.md#one-pull-request-one-change).
3. **Agent chatter in comments and commits** &mdash; Comments and commit messages narrated the session or the ticket history. They should describe behaviour and rationale; see [Style](dev-docs/CODE-STYLE.md#style).
4. **Duplicating `dev-docs/`** &mdash; The agent explained a rule inside an `AGENTS.md`, a `README.md`, or a skill instead of linking to the `dev-docs/` page that owns it. Two copies of a rule means one of them is wrong within a release, and the reader cannot tell which.
5. **Stale pull request descriptions** &mdash; The description was written once and never revisited. Update it as the branch evolves.
