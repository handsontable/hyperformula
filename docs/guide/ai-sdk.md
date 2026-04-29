# HyperFormula AI SDK

Let LLMs safely read/write spreadsheets and compute formulas via a deterministic engine.

::: tip Beta — coming soon
The HyperFormula AI SDK is in early development. The API shown below is a preview and may change before the first release. [Sign up for beta access](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA) to get notified and shape the design.
:::

## What it does

- **Evaluate formulas on the fly** — run any Excel-compatible formula without placing it in a cell.
- **Read and write cells and ranges** — let an agent inspect, populate, or modify sheet data programmatically.
- **Trace dependencies** — surface precedents and dependents so the model can explain how a value is derived.

## Install

```bash
npm install hyperformula
```

The SDK is framework-agnostic — the tool definitions are plain functions you can wire into any agent runtime (Vercel AI SDK, LangChain, OpenAI Agents SDK, MCP servers, or your own tool loop).

## Setup

No API key. HyperFormula runs locally — in the browser or in Node.js — and never sends data to a remote service. Calculations are deterministic: the same inputs always produce the same outputs.

## Quickstart

```js
import HyperFormula from 'hyperformula';
import { createSpreadsheetTools } from 'hyperformula/ai';

const hf = HyperFormula.buildFromArray([
  ['Revenue', 100],
  ['Cost',     60],
  ['Profit', '=B1-B2'],
]);

// Returns a map of tool definitions ready to pass to your agent runtime.
const tools = createSpreadsheetTools(hf);

tools.evaluate({ formula: '=IRR({-1000,300,400,500,200})' });
// → 0.1189 — deterministic, no LLM math
```

## Example: Vercel AI SDK

Wire the tools into [`generateText`](https://sdk.vercel.ai/docs) so the model can call them during a turn:

```js
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import HyperFormula from 'hyperformula';
import { createSpreadsheetTools } from 'hyperformula/ai';

const hf = HyperFormula.buildFromArray([
  ['Revenue', 100],
  ['Cost',     60],
  ['Profit', '=B1-B2'],
]);

const result = await generateText({
  model: openai('gpt-4o'),
  tools: createSpreadsheetTools(hf),
  prompt: 'What drives the profit number, and what happens if revenue doubles?',
});
```

The same `tools` object can be adapted to LangChain, OpenAI Agents SDK, or MCP — the underlying functions accept and return plain JSON.

## Use cases

- **Explain a sheet** — summarize what a spreadsheet does, which cells are inputs, and how outputs are derived.
- **Generate a what-if scenario** — let the model tweak assumptions and observe how results change in real time.
- **Validate and clean data** — scan ranges for errors, missing values, or inconsistencies and fix them with formulas or direct edits.
- **Create formulas from natural language** — describe a calculation in plain English and let the model write and verify the correct Excel formula.

## Safety and guardrails

Because HyperFormula is a pure calculation engine, the agent's blast radius is limited to the in-memory workbook you hand it. There is no filesystem, network, or shell access through the tools.

Planned controls for the first beta:

- **Permissions per tool** — opt in to read-only, write, or formula-evaluation tools individually.
- **Range scoping** — restrict an agent to a named range, sheet, or address pattern.
- **Operation limits** — cap the number of cell writes or formula evaluations per turn.
- **Audit log** — every tool call returns a structured record of what changed.

Persistence (saving the modified workbook back to your data store) stays in your application code — the SDK never writes outside the `HyperFormula` instance you pass in.

## All options

`createSpreadsheetTools(hf, options?)` returns a tool map. Planned options:

| Option | Type | Description |
| --- | --- | --- |
| `include` | `string[]` | Whitelist of tool names to expose (e.g. `['evaluate', 'getRange']`). |
| `exclude` | `string[]` | Tools to hide from the agent. |
| `readOnly` | `boolean` | Disable all mutating tools. |
| `scope` | `{ sheet?: number; range?: SimpleCellRange }` | Restrict reads/writes to a sheet or range. |
| `maxWritesPerCall` | `number` | Hard cap on cell writes per tool invocation. |

The default tool set covers formula evaluation, single-cell and range reads, single-cell and range writes, and dependency tracing. The full surface will be documented alongside the first beta release.

## TypeScript support

Tool argument and return types are fully typed and re-exported from `hyperformula/ai`, so your agent runtime gets end-to-end type inference without extra `as` casts.

## Links

- [Sign up for beta access](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA)
- [HyperFormula on GitHub](https://github.com/handsontable/hyperformula)
- [HyperFormula on npm](https://www.npmjs.com/package/hyperformula)
- [Built-in functions](built-in-functions.md)
- [Custom functions](custom-functions.md)
