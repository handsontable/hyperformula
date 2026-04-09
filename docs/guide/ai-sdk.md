# HyperFormula AI SDK

Let LLMs safely read/write spreadsheets and compute formulas via a deterministic engine.

## What it does

- **Evaluate formulas on the fly** —call `calculateFormula()` to evaluate any Excel-compatible formula without placing it in a cell.
- **Read and write cells and ranges** —get or set individual cells and multi-cell ranges so an LLM can inspect, populate, or modify sheet data programmatically.
- **Trace dependencies** —call `getCellDependents()` and `getCellPrecedents()` to understand which cells feed into a formula and what downstream values would change.

## Quickstart

```js
import HyperFormula from 'hyperformula';
import { createSpreadsheetTools } from 'hyperformula/ai';

// 1. Create a HyperFormula instance with initial data
const hf = HyperFormula.buildFromArray([
  ['Revenue', 100],
  ['Cost',     60],
  ['Profit', '=B1-B2'],
]);

// 2. Create tools your LLM agent can call
const tools = createSpreadsheetTools(hf);

// 3. Agent interaction examples
tools.evaluate({ formula: '=IRR({-1000,300,400,500,200})' });
// → 0.1189 — deterministic, no LLM math

tools.setCellContents({ sheet: 0, col: 1, row: 0, value: 200 });
tools.getRange({ sheet: 0, startCol: 0, startRow: 0, endCol: 1, endRow: 2 });
// → [['Revenue', 200], ['Cost', 60], ['Profit', 140]]

// Agent: "What drives the profit number?"
tools.getDependents({ sheet: 0, col: 1, row: 0 });
// → [{ sheet: 0, col: 1, row: 2 }] — Revenue flows into Profit
```

## Use cases

- **Explain a sheet** —ask an agent to summarize what a spreadsheet does, which cells are inputs, and how outputs are derived.
- **Generate a what-if scenario** —let the model tweak assumptions (price, volume, rate) and observe how results change in real time.
- **Validate and clean data** —have the agent scan ranges for errors, missing values, or inconsistencies and fix them with formulas or direct edits.
- **Create formulas from natural language** —describe a calculation in plain English and let the model write and verify the correct Excel formula.

## Beta access

::: tip
[Sign up for beta access](https://2fmjvg.share-eu1.hsforms.com/2e6drCkuLTn-1RuiYB91eJA)
:::
