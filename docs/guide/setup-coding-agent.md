---
description: Install the official HyperFormula skill for Claude Code, or point any other AI coding agent at HyperFormula's machine-readable docs.
tags:
  - skills
  - plugin marketplace
  - AI agents
  - Codex
  - Windsurf
  - GitMCP
  - Context7
  - llms.txt
  - AGENTS.md
  - Markdown docs
---

# Set up your coding agent

HyperFormula ships an official Claude skill and machine-readable docs so your AI coding agent can scaffold, configure, and debug HyperFormula correctly. Pick your tool below, or use the interactive wizard.

<CodingAgentWizard />

## Claude Code

Install the official skill from the plugin marketplace:

```
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
```

Claude Code loads the `hyperformula` skill automatically based on what you ask.

## Cursor, Copilot & other agents

These tools don't yet support the Claude skill format. Point your agent at the machine-readable docs instead:

- **Full corpus:** [`llms-full.txt`](../llms-full.txt) — the entire documentation in one LLM-friendly file.
- **Per-page Markdown:** append `.md` to a docs page URL (e.g. `/docs/guide/basic-usage.md`), or use the **View as Markdown** link on any page.

For agents that read a rules file (e.g. Cursor's `AGENTS.md`), add a line pointing at the corpus URL so the agent fetches authoritative docs on demand.

## Live docs via MCP (any agent)

Zero-setup ways to let an agent pull authoritative HyperFormula docs on demand:

- **Docs MCP server** (first-party, recommended) — add `https://docs-assistant.handsontable.com/mcp` to your agent (e.g. `claude mcp add --transport http handsontable-docs https://docs-assistant.handsontable.com/mcp`). Semantic search over the full HyperFormula and Handsontable knowledge base: docs guides, API reference, code recipes, release notes, blog posts, and GitHub issues — always current with the latest release. No install, no auth. Full guide: [Docs MCP Server](https://handsontable.com/docs/javascript-data-grid/docs-mcp-server/).
- **GitMCP** — add the MCP server `https://gitmcp.io/handsontable/hyperformula` to your agent (e.g. `claude mcp add --transport http hyperformula https://gitmcp.io/handsontable/hyperformula`). It serves this GitHub repository's docs. No install, no auth.
- **Context7** — run `npx -y @upstash/context7-mcp` (or use the Context7 skill / `ctx7` CLI) and ask for the `hyperformula` library. Context7 indexes the repository's `docs` folder (see `context7.json` in the repo root).

## Manual install (any Claude Code setup)

```bash
git clone https://github.com/handsontable/handsontable-skills.git
cp -r handsontable-skills/skills/hyperformula ~/.claude/skills/
```

## Resources

- [Official skill repository](https://github.com/handsontable/handsontable-skills)
- [Docs MCP Server guide](https://handsontable.com/docs/javascript-data-grid/docs-mcp-server/)
- [`llms-full.txt`](../llms-full.txt)
- [API reference](/api/)
