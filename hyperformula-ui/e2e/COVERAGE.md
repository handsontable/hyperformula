# E2E coverage map

The e2e layer is a **basic integration smoke** tier: it proves the FormulaBuilder is wired up
and functional in each real host framework, not that every editor behavior is correct. Deep
behavioral coverage is owned by the unit suites (`packages/*/tests`); do not port behavior
cases here.

Use this for Tier 4 of the verification ladder: run the full suite (`pnpm test:e2e`, aliased as
`pnpm test:demos`) for broad UI or adapter-integration changes, or a single combo with
`pnpm --filter e2e exec playwright test tests/<framework>/<adapter>`. If your change is
pure editor/engine logic with no host-integration angle, skip e2e — the unit suites own it.

## What runs

One shared, framework-agnostic factory — `runBasicSuite(descriptor)` in
`tests/_shared/basicSuite.ts` — is invoked once per demo route from a one-line
`tests/<framework>/<adapter>/formula-builder.spec.ts`. Tests are **DOM-only**: they touch only
the shared adapter DOM (`.hfe-formula-bar`, `.hfe-formula-bar__address-input`,
`.hfe-editor__input`, each grid's cell selector, `#result` for the editor-only demo) — no
`window.*` demo hooks — so the same suite runs identically on every framework.

**Grid demos** — 4 checks:

1. **renders + formula bar** — first cell renders; `.hfe-formula-bar` is visible; clicking the
   first cell puts `A1` in the address box.
2. **selection syncs** — clicking a different cell changes the address box away from `A1`.
3. **edit + recompute** — double-click a cell, replace with `=1+1`, Enter; that cell then shows
   `2` (dataset-agnostic proof the editor→engine→grid path works).
4. **type-to-edit smoke** — click a cell, type `9`; the editor opens seeded with exactly `9`
   (replace, not append) across all adapter routes — the regression lock for type-to-edit
   replace semantics; per-adapter type-to-edit behavior stays unit-owned.

**Editor-only demo** (`js/basic`) — 1 check:

1. **computes** — type `=1+2` in the editor; `#result` shows `3`.

## Matrix

The suite boots four demo dev servers (`e2e/playwright.config.ts` `webServer`): demo-js (5173),
demo-react (5174), demo-vue (5175), demo-angular (5176, 180s boot timeout). Each combo below has
its own `formula-builder.spec.ts` calling `runBasicSuite(findDemo(...))`.

| framework | port | adapters (each = one basic spec) |
| --- | --- | --- |
| js | 5173 | basic (editor-only), plain-table, ag-grid |
| react | 5174 | ag-grid, tanstack, mui |
| vue | 5175 | ag-grid |
| angular | 5176 | ag-grid |

Per-adapter cell selectors live in `tests/_shared/demos.ts`: ag-grid `.ag-cell`, tanstack
`[data-row][data-col]`, mui `.MuiDataGrid-cell`, plain-table
`.plain-table td`. The `basic` demo is editor-only (`#editor-host`, result `#result`).

When adding a demo route, add its descriptor to `DEMOS` in `tests/_shared/demos.ts` and drop a
one-line spec at `tests/<framework>/<adapter>/formula-builder.spec.ts`. No per-behavior rows to
maintain here — the assertions are identical across every combo.
