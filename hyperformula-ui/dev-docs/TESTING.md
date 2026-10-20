# Testing

What a change must prove applies here as everywhere: [`dev-docs/TESTING.md`](../../dev-docs/TESTING.md). This page covers the UI's own suites.

| Suite | Where | Runs with | Command |
|---|---|---|---|
| Unit | `packages/core/tests/` | vitest, happy-dom | `npm run test:ui` |
| End-to-end | `e2e/tests/` | Playwright, Chromium | `npm run test:e2e` |

Both commands run from the repository root.

## Unit tests

### Layout

`tests/` mirrors `src/`: a test for `src/formulaEditor/keyboardController.ts` lives at `tests/formulaEditor/keyboard-controller.test.ts`. Only `formula-builder.test.ts`, for the root `src/formulaBuilder.ts`, sits at the top of `tests/`. Test files are kebab-case and named after the module under test.

### Shared helpers

`tests/helpers/` is a barrel; import it as `"../helpers"` or `"../../helpers"`, depending on depth. Extend it rather than defining fakes per file.

- `createEditorHarness(options?)` returns `{ host, popupCtx, adapter, editor, destroy }`: a `FormulaEditor` with a default `TestGridAdapter`. Always call `destroy()`.
- `TestGridAdapter` is a full `IGridAdapter` fake. It records `.highlights` and fires picks through `.pickCell()` and `.pickRange()`.
- `makeBarAdapter(overrides?)` fakes the formula-bar lifecycle, with `fire*` handles.
- DOM helpers: `typeInto`, `press`, `keyUp`, `blurEditor`, `focusEditor`, `requireTextarea`, `nextFrame`, `sel`.

### Conventions

- One `describe` per public surface, one `it` per behaviour.
- Test names read as sentences: `it("converts simple '// note' to '+ N(\"note\")'")`.
- No `!` non-null assertions; guard and throw instead.
- Tests are typechecked: the core's `typecheck` script also runs `tsc -p tsconfig.test.json` over `src/` and `tests/`.
- happy-dom geometry is all zeros. Stub `getBoundingClientRect` and `getClientRects` where positioning matters, as `popup-controller.test.ts` and `scroll-anchor.test.ts` do.

### Running one test

```bash
npm run test:ui -- <file or name pattern>
```

### New behaviour

1. Write the failing test, naming the input and the expected output.
2. Run it and confirm it fails for the right reason.
3. Implement the minimal code.
4. Run it and confirm it passes.

When adding tests for existing code, break the code under test on purpose, confirm the new test fails, then restore it.

## End-to-end tests

A basic integration smoke tier: it proves the editor works in a real page. Behaviour (keyboard matrices, popup state, tokenization, highlight geometry) is owned by the unit suite; do not assert it here. What runs, and how to add a demo route, is in [`e2e/COVERAGE.md`](../e2e/COVERAGE.md); update it in the same commit as any spec change.

The Playwright config starts the demo server itself. The demo resolves `hyperformula` from this workspace, so build the engine first:

```bash
npm run bundle-all
npm run test:e2e
```

Playwright needs Chromium installed once: `npm exec --workspace=e2e -- playwright install chromium`.

Conventions:

- Tests touch only the shared `.hfe-*` DOM and the demo's `#result`. No `window.*` hooks.
- Prefer role-based selectors, then `data-testid`, then classes. Avoid CSS chains.
- `await expect(...)` for every assertion.
