---
title: "Set up your coding agent"
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

HyperFormula ships an official Claude skill and machine-readable docs so your AI coding agent can scaffold, configure, and debug HyperFormula correctly. Pick your tool below, or use the interactive wizard.

<hf-coding-agent-wizard></hf-coding-agent-wizard>

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
- **Per-page Markdown:** append `.md` to a docs page URL (e.g. `/docs/hyperformula/guide/basic-usage.md`), or use the **View as Markdown** link on any page.

### Add HyperFormula to your rules file

Many agents read a rules file in your project root, for example `AGENTS.md` (Codex, Cursor, GitHub Copilot) or `CLAUDE.md` (Claude Code). Paste this block into it, so the agent reads the HyperFormula docs before it writes HyperFormula code:

```md
## HyperFormula

This project uses HyperFormula, a headless spreadsheet calculation engine.
Before you write or change code that uses HyperFormula, read the docs:

- Full docs (one Markdown file): https://handsontable.com/docs/hyperformula/llms-full.txt
- One page as Markdown: add `.md` to the page URL, for example
  https://handsontable.com/docs/hyperformula/guide/basic-usage.md
- API reference: https://handsontable.com/docs/hyperformula/api/

Rules:
- Create instances with `HyperFormula.buildEmpty()`, `buildFromArray()`, or `buildFromSheets()`, not `new HyperFormula()`.
- Check that a function is supported in the built-in functions list before you use it in a formula.
```

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

## Check that the setup works

Start a new agent session in your project, so the agent loads the new skill, rules file, or MCP server. Then:

1. **Claude Code skill:** run `/plugin` and check that `handsontable-skills` is listed as installed. For a manual install, check that `~/.claude/skills/hyperformula/SKILL.md` exists.
2. **MCP server:** in Claude Code, run `/mcp` and check that the server (for example, `handsontable-docs`) shows as connected. Other agents list MCP servers in their settings.
3. **Any agent:** ask a question that needs the docs, for example:

   ```
   Which HyperFormula configuration option makes text comparison case-sensitive, and what is its default value?
   ```

   A correct answer names the `caseSensitive` option, says that its default is `false`, and cites a HyperFormula docs page. If the agent guesses or doesn't cite the docs, check the rules file or the MCP server again.

## Resources

- [Official skill repository](https://github.com/handsontable/handsontable-skills)
- [Docs MCP Server guide](https://handsontable.com/docs/javascript-data-grid/docs-mcp-server/)
- [`llms-full.txt`](../llms-full.txt)
- [API reference](/api/)
