# HyperFormula AI SDK for Vercel

A [Vercel AI SDK](https://sdk.vercel.ai/docs) tool that gives your agents deterministic spreadsheet and formula computation — backed by HyperFormula's Excel-compatible engine.

::: warning Prototype — not yet released
We have a working prototype. We'll make it available as soon as we open the beta. The API below is a preview and is likely to change before the first release.
:::

## What it does

- **Evaluate formulas on the fly** — your agent runs any Excel-compatible formula without placing it in a cell, so the model never has to do math itself.
- **Read and write cells and ranges** — the agent inspects, populates, or modifies sheet data through typed tool calls.
- **Trace dependencies** — precedents and dependents are surfaced so the agent can explain how a value is derived.

## Example

Using HyperFormula as a tool inside the Vercel AI SDK:

```js
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import HyperFormula from 'hyperformula';
import { createSpreadsheetTools } from 'hyperformula/ai';

// Build a workbook your agent can reason about.
const hf = HyperFormula.buildFromArray([
  ['Revenue', 100],
  ['Cost',     60],
  ['Profit', '=B1-B2'],
]);

// Pass the spreadsheet tools straight into generateText.
const result = await generateText({
  model: openai('gpt-4o'),
  tools: createSpreadsheetTools(hf),
  prompt: 'What drives the profit number, and what happens if revenue doubles?',
});
```

A single import, one extra line in `tools`, and the model can evaluate formulas, read ranges, and edit cells through the SDK — without inventing numbers.

## Use cases

- **Explain a sheet** — an agent summarizes what a spreadsheet does, which cells are inputs, and how outputs are derived.
- **Generate a what-if scenario** — the model tweaks assumptions and reports how downstream results change.
- **Validate and clean data** — the agent scans ranges for errors, missing values, or inconsistencies and fixes them in place.
- **Create formulas from natural language** — the model translates a plain-English calculation into a verified Excel formula.

## Safety and guardrails

HyperFormula runs locally in your Node.js or browser process — there's no remote service and no network or filesystem access through the tools. The agent's blast radius is limited to the in-memory workbook you hand it.

Planned for the beta:

- **Permissions per tool** — opt in to read-only, write, or formula-evaluation tools individually.
- **Range scoping** — restrict an agent to a named range, sheet, or address pattern.
- **Operation limits** — cap the number of cell writes or formula evaluations per turn.
- **Audit log** — every tool call returns a structured record of what changed.

## Join the waitlist

::: tip
**When we're ready to launch the beta, you'll be the first to know.** [Drop your email in the waitlist →](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA)
:::

## Links

- [Vercel AI SDK documentation](https://sdk.vercel.ai/docs)
- [HyperFormula on GitHub](https://github.com/handsontable/hyperformula)
- [HyperFormula on npm](https://www.npmjs.com/package/hyperformula)
- [Built-in functions](built-in-functions.md)
- [Custom functions](custom-functions.md)
