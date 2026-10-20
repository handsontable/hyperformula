# packages/core — agent notes

Read [`../../dev-docs/ARCHITECTURE.md`](../../dev-docs/ARCHITECTURE.md) first: component map, data flow, the single-editor host-switch
model (inline ↔ formula bar), and the canonical statement of the four critical invariants
(comment policy: JSDoc on the public API only, no inline comments; commentsToN/nToComments;
IGridAdapter-first; errors-in-host). [`EDITOR-TASKS.md`](../../dev-docs/EDITOR-TASKS.md) maps common tasks —
keyboard handling, tokenization, highlights, popup — to the files that implement them.

Core-specific:
- Every `src/` subdirectory exposes its public surface through an `index.ts` barrel
  (`adapter/`, `engine/`, `events/`, `kernel/`, `lexer/`, `theme/`, `ui/`, `formulaBar/`, `formulaEditor/`).
  `src/index.ts` re-exports from these barrels; add a barrel for any new subdirectory.
  Shared types (2+ importing modules, on the package's public API, or referenced by such
  a type) live in the directory's `types.ts`; the owning barrel re-exports only the public
  subset of `types.ts`. Single-consumer types stay in their consumer module even when the
  directory has a `types.ts` — the barrel may still re-export them from there (e.g.
  `ErrorPopupOptions` from `ui/popup/errorPopup.ts`).
- Relative imports are extensionless — no `.js`, and a directory resolves to its barrel:
  `./formulaBar`, not `./formulaBar/index.js`; `./adapter/cell`, not `./adapter/cell.js`.
  Relies on `moduleResolution: "bundler"` (tsc) plus rspack/vite/vitest bundling — nothing
  runs core's un-bundled source as raw Node ESM. Two more import rules: intra-package
  imports target the defining module file rather than a directory barrel (barrels are for
  public-surface composition and cross-package consumers only), and each module is imported
  via a single statement — mix value and type specifiers inline rather than splitting them.
- `src/ui/text/richInput.ts` tracks the caret via `keyup` + `click` + `select` on the textarea.
  Do NOT collapse these into element-level `selectionchange`: `<textarea>` fires it only in
  Safari ≥ 18 / recent Chromium, below Handsontable's Safari 14.1 floor, so the caret index
  would silently freeze there (Playwright on Chromium stays green). Keep the IME guards too
  (`composing` flag from `compositionstart`/`compositionend`, `keyCode === 229` skip) — they
  keep composing text visible through the transparent textarea. See `dev-docs/SPEC.md` §4.
- `Kernel` (`src/kernel/`) stays DOM-free; anything touching `document`, `window`, or
  `requestAnimationFrame` belongs in `src/ui/`, `src/formulaEditor/`, or `src/formulaBar/`.
- `src/formulaBar/` hosts the optional formula bar: `FormulaBar` composes
  `FormulaBarAddressBox` (jump-to-cell input) and `FormulaBarCell` (fx icon + idle colored
  formula + editor mount) and drives one shared `FormulaEditor` (owned by `FormulaBuilder`,
  passed in via options) between bar and inline cell; `IGridAdapter` provides the bar
  lifecycle methods that broker the handoff (see `dev-docs/ARCHITECTURE.md`). The bar attaches via
  `FormulaBuilder.attachFormulaBar(container)` /
  `detachFormulaBar()`; the `formulaBarContainer` constructor option is sugar that delegates
  to `attachFormulaBar`, and detaching restores the barless inline-edit subscription
  (start opens the editor; close reattaches it to the builder's detached mount).
- `src/events/` provides `EventManager`/`EventScope` for DOM listener lifecycle and conflict
  policy. See the "EventManager" section in `dev-docs/ARCHITECTURE.md` for scope names, ownership
  rules (capture-flag symmetry, non-DOM teardown, exactOptionalPropertyTypes) and the
  reparent invariant.
- Styles auto-inject: `src/theme/injectStyles.ts` appends one `<style data-hfe-styles>` on
  first `FormulaBuilder`/`FormulaEditor` construction. `src/theme/cssText.ts` is GENERATED
  from `src/styles/index.scss` by `npm run build:styles --workspace=hyperformula-ui/packages/core` and committed —
  regenerate it in the same commit as any `.scss` change (`npm run build:ui` does this).
  There is no `hyperformula-ui/styles` export; consumers import no CSS. The generic primitive
  (`createStyleInjector(marker, cssText)`) is exported from `hyperformula-ui` — adapters use it
  to auto-inject their own generated stylesheet on adapter construction.
- `DOCS.md` is GENERATED from the public-API JSDoc by `npm run docs --workspace=hyperformula-ui/packages/core`
  (`scripts/generateApiDocs.mjs`) and committed — regenerate it in the same commit as any
  public-surface JSDoc change. The script fails on undocumented exports or unknown
  `@category` values.
- Tests live in `tests/`, mirroring the `src/` subdirectory layout, with kebab-case
  filenames. Shared fakes and DOM helpers live in `tests/helpers/` (barrel) — extend them
  instead of redefining per-file fakes. Tests are typechecked via `tsconfig.test.json`
  (part of the package's `typecheck` script). Run: `npm run test:ui` from the repository root;
  conventions in [`TESTING.md`](../../dev-docs/TESTING.md).
