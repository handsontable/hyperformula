# HyperFormula MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that exposes HyperFormula as a tool for any MCP-compatible AI client (Claude Desktop, Cursor, VS Code, and others) — giving LLMs deterministic spreadsheet and formula computation.

::: warning Not available yet — coming soon
This integration is on our roadmap and **cannot be installed or used today**. The API shown below is a preview and may still change before the first release.

If you'd like to try it, [join the early access list](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA) — we'll ping you the moment the first beta is ready, and your sign-up directly tells us how strongly to prioritize this integration.
:::

## What it does

- **Evaluate formulas deterministically** — your agent runs any Excel-compatible formula through HyperFormula instead of asking the LLM to do math. Results are exact, reproducible, and auditable.
- **Read and write cells and ranges** — the agent inspects, populates, or modifies sheet data through typed tool calls.
- **Trace dependencies** — precedents and dependents are surfaced so the agent can explain how every value was derived.
- **400+ built-in functions out of the box** — the agent has access to the full Excel-compatible function set (`SUM`, `VLOOKUP`, `IRR`, `INDEX/MATCH`, and the rest), no implementation work required.

## Example

Run the server (no install needed once published):

```bash
npx -y @hyperformula/mcp
```

Wire it into an MCP client by adding it to the client's config (for example, `claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "hyperformula": {
      "command": "npx",
      "args": ["-y", "@hyperformula/mcp"]
    }
  }
}
```

The client now sees tools like `evaluate`, `getCellValue`, and `setCellContents`, and the agent can call them as part of any conversation — without inventing numbers.

## Use cases

- **Spreadsheet Q&A** — ask the agent what a workbook does, which cells are inputs, and how each output is derived; get answers grounded in real formula evaluation.
- **What-if scenarios and forecasting** — the agent tweaks assumptions and reports how downstream results change, deterministically.
- **Validate and clean data** — the agent scans ranges for errors, missing values, or inconsistencies and fixes them in place.
- **Generate formulas from natural language** — the agent translates a plain-English calculation into a verified, working Excel formula.
- **Financial modeling and reporting** — NPV, IRR, amortization, KPI rollups, and other quantitative workflows where the answer must be exact and auditable.

## Get early access

::: tip Be the first to try it
We're actively building this integration. Drop your email and we'll notify you the moment the first beta lands — so you can try it before the public release.

[Join the early access list →](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA)
:::

## Links

- [Model Context Protocol specification](https://modelcontextprotocol.io/)
- [HyperFormula on GitHub](https://github.com/handsontable/hyperformula)
- [HyperFormula on npm](https://www.npmjs.com/package/hyperformula)
- [Built-in functions](built-in-functions.md)
- [Custom functions](custom-functions.md)
