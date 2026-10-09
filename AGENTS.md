# AGENTS.md

Instructions for AI coding agents (Cursor, Claude Code, Codex, Aider, and any other AI tool) working in this repository.

## Start here

Whatever you do, start by reading entire [DEV_DOCS.md](DEV_DOCS.md). Only then proceed to your task.

## Never publish sensitive information

Never write any of the following into a commit message, branch name, pull request title or description, GitHub issue or comment, code comment, changelog entry, or documentation page:

- client, customer, and partner names, or details that identify them indirectly (their domains, deployments, or the wording of their reports)
- personal data of any kind &mdash; names, e-mail addresses, phone numbers, user accounts, IP addresses
- credentials and secrets &mdash; API keys, tokens, passwords, license keys, private URLs
- internal-only material &mdash; contents of private repositories and internal tickets, unreleased plans, contract and pricing details

Describe the change on its own technical terms instead: write "fix an off-by-one error in `SUMIFS` when the criteria range is empty", not "fix the bug reported by \<company\>". An internal ticket identifier such as `HF-123` is fine on its own; the contents of that ticket are not.

If a change cannot be described without such information, stop and ask the user how to proceed.

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

1. Often pull request descriptions becomes obsolete. Remember to update it as you work.

## Skills, MCPs, and other agent tools

This section is maintained by the team. Skills, MCP servers, and other tools vetted as useful for AI agents working on this codebase are listed here.

<!-- Add new items here. Use the format:
- **Name** &mdash; What it provides and when to use it.
-->

_No items yet._
