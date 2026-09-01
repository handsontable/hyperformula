# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Codex, Aider, and any other AI tool) working in this repository.

HyperFormula is a headless spreadsheet calculation engine in TypeScript. No UI, no DOM, no server: it parses formulas, tracks cell dependencies, and recalculates incrementally, in the browser and in Node.

## Start at `dev-docs/`

**[`dev-docs/`](dev-docs/) is the single source of truth for everything internal to this project.** Architecture, conventions, build, testing, standards, and the monorepo plan all live there and nowhere else. This file routes; it does not explain. Neither does any other `AGENTS.md` or `README.md`: each carries only what is so specific to its own directory that it would be useless anywhere else, and links for the rest. If one of them looks like it is explaining something general, the explanation belongs in `dev-docs/`.

Read [`dev-docs/README.md`](dev-docs/README.md) first. It says which page covers what, and every directory's own `AGENTS.md` points at the page that covers that directory.

## Never publish sensitive information

Never write any of the following into a commit message, branch name, pull request title or description, GitHub issue or comment, code comment, changelog entry, or documentation page:

- client, customer, and partner names, or details that identify them indirectly (their domains, deployments, or the wording of their reports)
- personal data of any kind &mdash; names, e-mail addresses, phone numbers, user accounts, IP addresses
- credentials and secrets &mdash; API keys, tokens, passwords, license keys, private URLs
- internal-only material &mdash; contents of private repositories and internal tickets, unreleased plans, contract and pricing details

Describe the change on its own technical terms instead: write "fix an off-by-one error in `SUMIFS` when the criteria range is empty", not "fix the bug reported by \<company\>". An internal ticket identifier such as `HF-123` is fine on its own; the contents of that ticket are not.

If a change cannot be described without such information, stop and ask the user how to proceed.

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

1. **Duplicating `dev-docs/`** &mdash; The agent explained a rule inside an `AGENTS.md`, a `README.md`, or a skill instead of linking to the `dev-docs/` page that owns it. Two copies of a rule means one of them is wrong within a release, and the reader cannot tell which.
2. **Stale pull request descriptions** &mdash; The description was written once and never revisited. Update it as the branch evolves.
