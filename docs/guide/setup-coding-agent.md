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
- **Per-page Markdown:** append `.md` to any docs URL, or use the **Copy Markdown** button on any page.

For agents that read a rules file (e.g. Cursor's `AGENTS.md`), add a line pointing at the corpus URL so the agent fetches authoritative docs on demand.

## Manual install (any Claude Code setup)

```bash
git clone https://github.com/handsontable/handsontable-skills.git
cp -r handsontable-skills/skills/hyperformula ~/.claude/skills/
```

## Resources

- [Official skill repository](https://github.com/handsontable/handsontable-skills)
- [`llms-full.txt`](../llms-full.txt)
- [API reference](/api/)
