# Reviewing a hyperformula-ui change

What to look for in each category of the [review order](../../dev-docs/CODE-REVIEW.md#review-order) when a diff touches `hyperformula-ui/`. Label and report findings as [Reporting findings](../../dev-docs/CODE-REVIEW.md#reporting-findings) says.

## Correctness

A broken invariant is `blocking:`. The canonical statement of each is in [`ARCHITECTURE.md`](ARCHITECTURE.md#key-invariants).

- **Comment policy.** No inline `//` or explanatory `/* */` in a changed `.ts` file, apart from `biome-ignore` directives and the generated `cssText.ts`. No JSDoc on a symbol that `packages/core/src/index.ts` does not re-export. A new or changed public export without JSDoc is not blocking; `npm run docs --workspace=hyperformula-ui/packages/core` fails on it anyway.
- **The `commentsToN`/`nToComments` boundary.** `FormulaEditor.setValue` still calls `nToComments`, and `FormulaEditor.getValue` still calls `commentsToN`. Nothing else reads the kernel's text and hands it to the host as a cell value without going through `commentsToN`. See [The commentsToN / nToComments boundary](ARCHITECTURE.md#the-commentston--ntocomments-boundary).
- **`IGridAdapter` first.** A method an adapter needs is added to `packages/core/src/adapter/types.ts`, then to `NullAdapter`, and only then used. See [Adding a new public API](ARCHITECTURE.md#adding-a-new-public-api).
- **Errors stay in the host.** The core renders no formula errors itself: no error text set through `innerHTML`, no new error classes, no `console.error` in `formulaEditor/` or `ui/` triggered by a parse error. See [Error display policy](ARCHITECTURE.md#error-display-policy).
- **`Kernel` stays DOM-free**, and raw `HyperFormulaLike` is touched only inside `src/engine/`.
- **No HTML sinks.** No `innerHTML`, `outerHTML` or `insertAdjacentHTML` in `src/`: under a host's Trusted Types policy (`require-trusted-types-for 'script'`) the assignment throws and the grid does not render. See [`CODE-STYLE.md`](CODE-STYLE.md#strings-and-numbers).
- **A URL from engine metadata is checked before it becomes a link.** A custom function's `docUrl` can carry any scheme; only `http:` and `https:` are rendered.
- **Every regex run on editor text is linear.** The lexer runs on every keystroke, over text a user can paste. A pattern with overlapping quantifiers (`\d+\.?\d*`, a lazy group followed by `\s*`), or a scan that restarts from many positions, is quadratic on long input.

## Completeness

- **Tests.** A behaviour change in `packages/core/src/` has a test in the matching file under `packages/core/tests/` — see [`TESTING.md`](TESTING.md). A changed demo page that the e2e suite covers has its spec and [`e2e/COVERAGE.md`](../e2e/COVERAGE.md) updated in the same change.
- **Generated files.** A change to `src/styles/` regenerates `src/theme/cssText.ts`; CI fails if it is stale. A change to public JSDoc regenerates `packages/core/DOCS.md`.
- **The pages that name things.** A diff that renames, moves, adds or removes a file, export, `IGridAdapter` method or key binding updates the page that names it: [`ARCHITECTURE.md`](ARCHITECTURE.md), [`SPEC.md`](SPEC.md) (§2 lists the file tree, §3 the public API, §8 the adapter contract), [`KEYBOARD-SHORTCUTS.md`](KEYBOARD-SHORTCUTS.md), [`EDITOR-TASKS.md`](EDITOR-TASKS.md), or an `AGENTS.md`.
- **The changelog entry** goes in [`hyperformula-ui/CHANGELOG.md`](../CHANGELOG.md), not the engine's.

## Performance

The keystroke path: `FormulaEditor` input, `Kernel.applyEdit`, the lexer, `renderOverlay()` and `pushHighlights()`. Watch for work done on every keystroke that could run once, and for DOM reads that force a layout inside a loop.

## Public API

The contract is what `packages/core/src/index.ts` re-exports, plus three things outside the TypeScript surface:

- **The `.hfe-*` CSS classes and `--hfe-*` variables.** Integrations select on and set them; the Handsontable plugin's tests rely on `.hfe-formula-bar` and `.hfe-editor__input`. Renaming one is a breaking change. See [CSS names](CODE-STYLE.md#css-names).
- **The `peerDependencies` range on `hyperformula`.** Calling an engine method newer than its lower bound needs the range raised.
- **The `exports` map.** The source stays under the private `hyperformula-ui-source` condition. Never export it under `development`, which other projects' bundlers enable in dev mode — see [`SPEC.md`](SPEC.md#1-repo-layout).

The package versions on its own `0.x` line, where a minor release may break; a breaking change still needs its changelog entry. See [`RELEASE.md`](RELEASE.md).

## Style

Biome owns formatting and its rules. What it cannot check is in [`CODE-STYLE.md`](CODE-STYLE.md): naming, blank lines, member order, arrow-function fields, non-null assertions.
