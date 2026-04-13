# HyperFormula MCP Server

An MCP (Model Context Protocol) server that exposes HyperFormula as a tool for any MCP-compatible AI client, giving LLMs deterministic spreadsheet computation.

## What it does

- **Evaluate formulas** —any MCP client can call HyperFormula to evaluate Excel-compatible formulas and get exact results.
- **Read and write cells** —get or set individual cell values and ranges through standard MCP tool calls.
- **Inspect dependencies** —trace which cells a formula depends on and understand the calculation graph.

**Without HyperFormula:**

```
User: What's the NPV at 8% for these cash flows?
Agent: "Approximately $142.50" ← non-deterministic, unverifiable
```

**With HyperFormula MCP server:**

```
User: What's the NPV at 8% for these cash flows?
Agent → tool call: evaluate("=NPV(0.08, B1:B5)")
Agent: "$138.43" ← deterministic, auditable
```

## How it works

1. **Start the MCP server** —runs HyperFormula as a local MCP server that any compatible client (Claude Desktop, Cursor, VS Code, etc.) can connect to.
2. **Client sends tool calls** —the AI client calls tools like `evaluate`, `getCellValue`, and `setCellContents` via the MCP protocol.
3. **HyperFormula evaluates deterministically** —resolves formulas using 400+ built-in functions with full dependency tracking. No LLM in the loop for math.
4. **Results flow back to the client** —computed values return through MCP, grounding the AI's response in verified numbers.

## Use cases

- Spreadsheet Q&A in Claude Desktop or other MCP clients
- Formula evaluation in IDE-based AI assistants
- Financial calculations in chat-based agent workflows
- Data validation and transformation via natural language

## Beta access

::: tip
[Sign up for beta access](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA)
:::
