# AGENTS.md

Instructions for AI coding agents (Cursor, Claude Code, Codex, Aider, and any other AI tool) working in this repository.

## Start here

All project knowledge a developer needs &mdash; project overview, architecture, build and test commands, code style, definition of done, how to add a function, and more &mdash; lives in **[DEV_DOCS.md](DEV_DOCS.md)**. Read it first. Everything in `DEV_DOCS.md` applies to AI agents as well.

## Agent-only rules

The rules below are intended for AI agents specifically and are not part of the standard developer documentation.

### Communication and attribution

- Do **not** mention Claude, Claude Code, Cursor, GPT, Codex, Copilot, or any other LLM/AI tool in:
  - commit messages
  - pull request titles or descriptions
  - source code or code comments
  - documentation (including the changelog)

### Response style

- Be concise by default. Use as few words as possible unless the user asks for more detail.
- When the user asks for specific content, lead the response with the requested information.
- Structure answers with bullet lists, numbered lists, tables, or code blocks where useful.
- Ask clarifying questions when the request is ambiguous rather than guessing.
- If you do not know something, say so and ask for help.
- When answering from project documentation, quote the exact relevant fragments to support your claim.
