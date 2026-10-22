# FormulaBuilder — Implementation Spec

## Context

Headless-first formula editor that plugs HyperFormula (or any compatible engine) into any grid through a small adapter interface. Delivers rich in-cell editing: token highlighting, colored ref marks, suggestions popup, function-signature help, bracket-depth decorations, named-expression highlighting, range highlights synced to the host grid, keyboard point mode (arrows select cells/ranges), F4 absolute-ref cycling, and an optional formula bar that shares one editor instance with the inline cell editor.

**Why the design**: zero UI-framework dependency keeps the editor embeddable in any host (vanilla, React, Vue, Angular). Layered text editing (transparent `<textarea>` + visual overlay) preserves native caret/selection/IME while allowing rich token rendering. BEM + CSS variables + `light-dark()` give consumers full theming control without specificity wars.

**Constraints (in effect)**:
- npm workspaces, as part of the HyperFormula monorepo; Node from the root `.nvmrc`
- Rspack builds ESM only; `.d.ts` via `tsc --emitDeclarationOnly`, then `scripts/addDeclarationExtensions.mjs` adds `.js` to their relative imports so `node16`/`nodenext` consumers resolve them; styles compiled with `sass` via `hyperformula-ui/scripts/generateCssText.mjs`
- One demo workspace package, `demo/js` (Vite, port 5173), with the editor-only `basic` page
- Vitest (unit) + Playwright (e2e)
- TypeScript strict; zero UI deps in core; CSS `hfe-` prefix; `light-dark()` theming
- Biome single formatter + linter (no Prettier/ESLint); filenames start lowercase (camelCase source, kebab-case tests)
- HyperFormula is an **optional** peer dep; engine duck-typed via `HyperFormulaLike`

---

## 1. Repo Layout

```
hyperformula-ui/
├── packages/
│   └── core/                        # hyperformula-ui (rspack + sass + tsc)
├── scripts/                         # shared build scripts (generateCssText.mjs, generateApiDocs.mjs)
├── demo/
│   ├── shared/                      # @hfe-demo/shared: datasets + shared.css only, no hyperformula-ui or framework imports
│   └── js/                          # demo-js, port 5173: basic (editor only)
├── e2e/                             # Playwright specs against the demo server (map: e2e/COVERAGE.md)
├── dev-docs/                        # this spec, ARCHITECTURE.md, and the other internals pages
├── tsconfig.base.json               # strict, ES2022, moduleResolution:bundler
├── tsconfig.package.json  tsconfig.test.json  rspack.base.mjs  vitest.base.ts
└── biome.json                       # single fmt+lint source of truth
```

`hyperformula-ui` publishes ESM with `exports.default → dist/index.js`. A private export condition, `hyperformula-ui-source → src/index.ts`, lets this repository's demo (running under Vite) and TypeScript consume the source directly, without a build. It is listed before `types` because TypeScript takes the first matching condition. The condition is deliberately not `development`: webpack and Vite enable `development` by default in dev mode, so a package exporting its TypeScript source under it breaks other projects' dev builds.

Grid integrations are not in this repository. Handsontable ships its own, as the built-in `formulaBuilder` plugin (`handsontable/src/plugins/formulaBuilder/`), consuming `hyperformula-ui` as an external dependency. Adapters for other grids are maintained outside this repository as examples.

---

## 2. Core Package (`hyperformula-ui`)

Filenames are lowercase (camelCase for source, per Biome `useFilenamingConvention`).
Every `src/` subdirectory exposes its surface through an `index.ts` barrel.

```
packages/core/src/
├── index.ts                         # public barrel — see §3
├── formulaBuilder.ts                # FormulaBuilder — the consumer-facing master class (§3)
├── formulaEditor/                   # editor facade + controllers
│   ├── formulaEditor.ts             # FormulaEditor facade: constructs controllers, wires DOM
│   ├── editorContext.ts             # isFormula(kernel) — the only runtime export
│   ├── editorEdit.ts                # applyEditorEdit — the single programmatic edit primitive (kernel + input + highlights sync)
│   ├── types.ts                     # EditorContext, FormulaEditorOptions, FormulaEditorEvents; CommandId, ContextFlag, KeyContext, Combo, Binding, EditorHost, HostToggleDelegate
│   ├── highlightController.ts       # overlay rendering + adapter highlights
│   ├── refController.ts             # ref-insertion state machine (tryInsertRef, canInsertRef)
│   ├── popupController.ts           # suggestions + fn-help lifecycle
│   ├── keyboardController.ts        # keydown command implementations
│   ├── shortcutManager.ts           # declarative keybinding dispatch (pure, DOM-free)
│   ├── keymap.ts                    # BINDINGS: key-combo → command table (data only)
│   ├── pointModeController.ts       # arrow-key reference point-mode state machine
│   ├── editorSizeController.ts      # rAF-scheduled width/height caps at nearest clipping ancestor, viewport fallback (hfe-editor--height-capped)
│   └── scrollAnchor.ts              # textarea scroll sync + ancestor-scroll reanchor
├── formulaBar/
│   ├── formulaBar.ts             # FormulaBar — bar mount, composes address box + formula cell
│   ├── formulaBarAddressBox.ts   # FormulaBarAddressBox — jump-to-cell input (own root)
│   └── formulaBarCell.ts         # FormulaBarCell — fx icon + idle colored formula + editor overlay mount (own root)
├── kernel/
│   ├── kernel.ts                    # wires StateManager + Lexer + EventBus
│   ├── stateManager.ts              # immutable snapshots of {text, cursor, tokens}
│   ├── eventBus.ts                  # typed pub/sub
│   ├── commentTransform.ts          # commentsToN / nToComments — see §13
│   └── types.ts                     # CursorPosition, FormulaState, KernelEventMap, KernelEventName
├── lexer/
│   ├── lexer.ts                     # tokenize(text): Token[] — stateless, locale-configurable
│   ├── tokens.ts                    # TokenType + colLettersToIndex/indexToColLetters
│   ├── types.ts                     # Token + ref/comment/named-expr meta interfaces, LexerOptions
│   ├── matchers.ts                  # per-token-kind match helpers
│   ├── patterns.ts                  # regex helpers
│   └── additiveContext.ts           # detect whether a comment sits in a + N(...) slot
├── engine/
│   ├── engineBridge.ts              # EngineBridge — thin facade over functionCatalog + namedExpressions; the ONLY HF access point
│   ├── functionCatalog.ts           # FunctionCatalog — HF function catalog, signature/param derivation, prefix filtering (internal, not on barrel)
│   ├── namedExpressions.ts          # NamedExpressions — named-expr scope resolution + whole-span expansion (internal, not on barrel)
│   ├── namedExpr.ts                 # annotateNamedExprs — IDENT → NAMED_EXPR via engine lookup
│   ├── namedExprName.ts             # validateNamedExprName — name legality
│   ├── readCellText.ts              # readCellText(engine, addr) — shared by adapters + demos
│   └── types.ts                     # FunctionParam/FunctionSignature/FunctionCatalogEntry, HyperFormulaLike, NamedExprResolution, CellTextSource/EngineCellAddress
├── adapter/
│   ├── types.ts                     # adapter interface + GridGeometry, RangeRect — see §8
│   ├── cell.ts  range.ts            # CellAddress/CellRange helpers, stepCell, findDataEdge, normalizeRange, expandHeaderSpan
│   ├── geometry.ts                  # splitRangeByFrozen, unionRectRelativeTo
│   ├── refFormat.ts                 # formatRef, formatWholeRef, formatCellValue, parseCellInput
│   ├── refAbsolute.ts               # cycleRefAbsolute — F4 $-anchoring cycle
│   ├── keyboard.ts                  # resolveEditStartKey — edit-start key classification: Enter/F2 = open with value, printable = seed
│   ├── domRangePicker.ts            # generic pointer-driven range picker for DOM-backed grids
│   ├── rangeDragTracker.ts          # shared drag-pick state machine (DomRangePicker + adapter-level pickers, e.g. AG Grid's in-edit picks)
│   ├── headerDragTracker.ts         # shared header-drag state machine (RangeDragTracker pattern for whole-row/column picking; DomRangePicker + AG Grid header interceptor)
│   ├── trailingClickSwallow.ts      # armTrailingClickSwallow: one-shot capture click swallow after a routed header pick (disarms on next mousedown/click; DomRangePicker + MUI)
│   ├── edgeAutoScroller.ts          # drag-past-edge autoscroll primitive (driven by RangeDragTracker)
│   ├── pickEmitter.ts               # adapter-side onCellPick/onRangePick/onHeaderPick wiring
│   └── nullAdapter.ts               # no-op fallback + base class for basic adapters
├── ui/                              # split by concern
│   ├── dom.ts                       # createEl / clear / ensureRelativePosition / createIcon / createSvgIcon
│   ├── focusTrap.ts                 # FocusTrap: reusable focus scope (focusable discovery, Tab wrap, exit keys)
│   ├── icons.ts                     # SVG icon data shared by popups + formula bar (BUILT_IN_ICONS, keyed by IconName)
│   ├── liveRegion.ts                # LiveRegion — shared aria-live announcer
│   ├── popup/                       # BasePopup + SuggestionsPopup / FunctionHelpPopup / ErrorPopup,
│   │                                # PopupContext (shared portal), positionStrategy, popupsOptions,
│   │                                # cellError (cellErrorMessage/setCellError)
│   ├── text/                        # richInput (textarea), visualOverlay, decorations
│   ├── caret/                       # tokenContext — currentFunctionPrefix / activeCallContext
│   ├── highlight/                   # highlightLayer — range rectangles drawn over the grid;
│   │                                # cellRuns — groupCellsIntoRuns merges per-cell rects into
│   │                                # visual runs (sorting-safe highlight geometry)
│   └── types.ts                     # IconName, IconsOptions
├── events/
│   ├── eventManager.ts              # EventManager + EventScope — DOM listener lifecycle
│   ├── listenerSet.ts               # ListenerSet<Args> — generic listener registry
│   └── types.ts                     # Disposable, ScopePolicy, DomEventOptions
├── theme/
│   ├── classNames.ts                # CN + TOKEN_CN — every BEM class name lives here
│   ├── cssText.ts                   # GENERATED from styles/ (scripts/generateCssText.mjs); committed
│   ├── injectStyles.ts              # createStyleInjector — ref-counted <style> head injection
│   └── refPalette.ts                # REF_PALETTE + assignRefIndex/paletteColorForIndex
└── styles/                          # SCSS sources; compiled into theme/cssText.ts by build:styles
    ├── index.scss   tokens.scss     editor.scss     overlay.scss   ref-mark.scss
    ├── highlight.scss  popup.scss   suggestions.scss  fn-help.scss  error.scss  formula-bar.scss  live-region.scss
```

Architecture detail (controller dependency order, popup hierarchy, EventManager scopes,
single-editor host-switch model): [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 3. Public API (`packages/core/src/index.ts`)

Types: `CellAddress`, `CellRange`, `GridSelection`, `CellPick`, `RangePick`, `CellPickListener`, `RangePickListener`, `OutsideCellClickListener`, `HeaderAxis`, `HeaderPick`, `HeaderPickListener`, `GridHeaderPickSurface`, `Direction`, `DomRangePickerOptions`, `EditStartIntent`, `EditStartKeyEvent`, `RangeDragTrackerOptions`, `HeaderDragTrackerOptions`, `EdgeAutoScrollerOptions`, `EditorGridAdapter`, `EphemeralHighlightSurface`, `GridEditLifecycle`, `GridGeometry`, `GridNavigation`, `GridPickSurface`, `GridSize`, `IGridAdapter`, `OutsideClickCommitMode`, `RangeHighlight`, `RangeRect`, `RefSelectionColorResolver`, `Unsubscribe`, `CellTextSource`, `EngineCellAddress`, `EngineValueChange`, `FunctionCatalogEntry`, `FunctionParam`, `FunctionSignature`, `HyperFormulaLike`, `AddressBoxTarget`, `AddressBoxRange`, `FormulaBarAddressBoxOptions`, `FormulaBarCellOptions`, `FormulaBarOptions`, `FormulaBuilderOptions`, `FormulaEditor` (type only), `FormulaEditorEvents`, `FormulaEditorOptions`, `EditorHost`, `HostToggleDelegate`, `LayoutDirection`, `StyleInjector`, `ErrorOptions`, `FunctionHelpOptions`, `HighlightLayerOptions`, `CellRect`, `CellRun`, `FrozenPredicate`, `HighlightLayerKind`, `IconName`, `IconsOptions`, `PopupsOptions`, `PopupHostOption`, `SuggestionItem`, `SuggestionsAriaState`, `SuggestionsOptions`, `SuggestionsHandlers`, plus the `events/` types (`Disposable`, `DomEventOptions`, `ScopePolicy`).

Values: `FormulaBuilder`, `FormulaBar`, `FormulaBarAddressBox`, `FormulaBarCell`, `DomRangePicker`, `RangeDragTracker`, `HeaderDragTracker`, `EdgeAutoScroller`, `PickEmitter`, `NullAdapter`, `formatRef`, `formatWholeRef`, `formatCellValue`, `parseCellInput`, `normalizeRange`, `expandHeaderSpan`, `armTrailingClickSwallow`, `resolveEditStartKey`, `splitRangeByFrozen`, `stepCell`, `findDataEdge`, `unionRectRelativeTo`, `readCellText`, `indexToColLetters`, `CN`, `createStyleInjector`, `HighlightLayer`, `LiveRegion`, `EPHEMERAL_COLOR`, `ensureRelativePosition`, `cellErrorMessage`, `classifyCellLayer`, `fillColor`, `groupCellsIntoRuns`, `setCellError`, plus the `events/` classes (`EventManager`, `EventScope`, `ListenerSet`).

Internal classes (`Kernel`, `Lexer`, `EngineBridge`, `RichInput`, `VisualOverlay`, popup classes, `PopupContext`) are exported from their subdirectory barrels for in-repo use but are **not** part of the top-level public surface.

### `FormulaBuilder` — the consumer entry point

One `FormulaBuilder` per grid instance. It owns the `PopupContext` (shared popup portal), the `ErrorPopup`, the single `FormulaEditor`, and — when `formulaBarContainer` is given — a `FormulaBar`.

Constructed as `new FormulaBuilder(options: FormulaBuilderOptions)`; the options interface lives in `packages/core/src/formulaBuilder.ts`. Fields: `rootEl` (required — grid root, error-popup hover/focus host), `adapter` (defaults to `NullAdapter`), `hyperformula` (instance — functions, validation, named exprs), `className` (single theming entry point: portal, bar, editor, overlay), `formulaBarContainer` (wires the formula bar — element or CSS selector), `popups` (`PopupsOptions` — shared `showClose` default + per-popup overrides), `icons` (`IconsOptions` — host factories that replace the built-in glyphs: `close`, `externalLink`, `namedExpression`, `function`; forwarded to the editor's popups, the error popup and the bar's fx icon), `initialValue` / `language` / `sheetId` (forwarded to the editor), `direction` (`LayoutDirection` — `"ltr" | "rtl"`, default `"ltr"`; construction-only — layout mirrors, formula text stays LTR), `onCommit(value, direction?)` (default: `adapter.commit`), `onCommitFill(value)` (default: `adapter.commitFill` when present), `onCancel()` (default: `adapter.cancel`), `rootDocument` (the grid's document, e.g. an iframe's — elements, selector lookup and styles; default `document`), `portalParent` (`HTMLElement | ShadowRoot` — parent of the popup portal and the live region, and a shadow root that receives the styles; default `rootDocument.body`).

Methods: `openEditor(mount, seed)`, `closeEditor()`, `markCell(cellEl, value)`, `attachFormulaBar(container)`, `detachFormulaBar()`, `attachSuggestionsHost(container: HTMLElement | string)`, `detachSuggestionsHost()`, `attachFnHelpHost(container: HTMLElement | string)`, `detachFnHelpHost()`, `destroy()`. Getters: `editor` (the `FormulaEditor`), `hasFormulaBar`. The `formulaBarContainer` option is sugar for `attachFormulaBar`; detaching restores the barless inline-edit subscription. `popups.suggestions.container` / `popups.fnHelp.container` (`PopupHostOption`, `HTMLElement | string`) are constructor sugar mirroring `formulaBarContainer`: stripped from the popup options and delegated to `attachSuggestionsHost`/`attachFnHelpHost` after editor construction. A selector that resolves to nothing makes the `attach*` methods throw `FormulaBuilder: <name> host "…" not found`; in the constructor options it logs that message once as a warning and falls back to the default placement; all four attach/detach methods are no-ops after `destroy()`.

`PopupsOptions`: shared `showClose` default plus per-popup overrides — `suggestions` (`showClose`, `showKeyboardHelp`, `showNamedExpressions` — all default `true`, plus `container?: HTMLElement | string` to dock it into a host element instead of floating), `fnHelp` (`showClose`, plus `container?: HTMLElement | string`), `error` (`showClose`, default `false`).

Without `formulaBarContainer`, the builder subscribes to `adapter.onInlineEditStart` itself (bar-less fallback); with it, `FormulaBar` brokers the inline ↔ bar handoff.

### `FormulaEditor` (owned by `FormulaBuilder`)

Constructed as `new FormulaEditor(container: HTMLElement, opts: FormulaEditorOptions)` — opts required; the options interface lives in `packages/core/src/formulaEditor/types.ts`. Fields: `adapter` (REQUIRED — the `NullAdapter` fallback lives in `FormulaBuilder`), `popupCtx` (REQUIRED — shared popup portal), `hyperformula`, `className`, `initialValue` (accepts `N("...")` form; converted to `//` comment for display), `language` (HF locale code), `sheetId` (sheet context for ref formatting), `direction` (`LayoutDirection` — `"ltr" | "rtl"`, default `"ltr"`; construction-only — layout mirrors, formula text stays LTR), `onCommit(value, direction?)`, `onCancel()`, `suggestionsOptions`, `fnHelpOptions`, `icons` (`IconsOptions` — the suggestions and function-help glyphs).

Methods: `setValue(text, options?)`, `getValue(): string`, `normalizeFormula(text: string): string` (round-trips `text` through the same `nToComments`/`commentsToN` pipeline `setValue`/`getValue` use, without mutating editor state — lets a caller compare a raw stored formula against `getValue()` for dirty-checking without duplicating the transform calls or separators), `closeUnbalancedParens()` (appends missing right-parens to the current buffer — the same pre-commit normalization keyboard commit runs, so outside-click commit matches it), `focus()`, `scrollToStart()` (scrolls back to the first line without moving the caret — `FormulaBar` calls it on a bar-initiated open), `refreshHighlights()`, `on(event, cb)`, `attachTo(container)`, `setRefActive(active)`, `canInsertRef()`, `isFocused()`, `isRefSelectionActive()`, `enterRefSelectionMode()` (puts the adapter into ref-selection mode wired to this editor's color resolver + pick-eligibility predicate), `suppressHighlights()` (clears grid highlights and holds them cleared until the next resume — the same pre-commit suppress keyboard commit runs; outside-click commit calls it), `getRefPreviewColor(target, append?, wholeAxis?)`, `getCaretOffset()`, `setCaretOffset(offset)`, `setHostToggleDelegate(delegate: HostToggleDelegate | null)` (wires the F6/Shift+F6 host-toggle target; `FormulaBar` registers/clears its own delegate — see §7 Function help), `attachSuggestionsHost(container: HTMLElement)`, `detachSuggestionsHost()`, `attachFnHelpHost(container: HTMLElement)`, `detachFnHelpHost()` (popup-host pass-throughs consumed by `FormulaBuilder`), `destroy()`.
Public fields: `kernel`, `engine`, `adapter`. Getter: `knownFunctionNames` (`ReadonlySet<string>` of HF's uppercased function names — feeds `FormulaBarCell`'s idle-formula coloring).

`getValue` always returns engine-form (`+ N("...")`); `setValue` accepts either form and normalizes on input. See §13.

There is exactly **one** `FormulaEditor` per grid; it reparents between the inline cell mount and the formula bar via `attachTo` (single-editor host-switch model — ARCHITECTURE.md).

---

## 4. Layered Text Editing — DOM & CSS

DOM structure (built by `packages/core/src/ui/text/richInput.ts` + `ui/text/visualOverlay.ts`; class names from `theme/classNames.ts`): a root `div.hfe-editor` wraps `div.hfe-editor__layers`, which stacks `div.hfe-overlay` (`aria-hidden` — token spans + ref marks) beneath a `textarea.hfe-editor__input` (`spellcheck=false`). Popups render into the shared `PopupContext` portal appended to `FormulaBuilder`'s `portalParent` (default `document.body`).

**Pixel-alignment-critical props** (must match on both layers): `font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height` (unitless), `padding`, `tab-size`, `white-space: pre-wrap`, `word-break`, `box-sizing: border-box`. Textarea: `position:absolute; inset:0; background:transparent; color:transparent; caret-color: var(--hfe-color-caret); resize:none; border:0`. Overlay: `position:absolute; inset:0; pointer-events:none`. Default font: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`; `font-variant-ligatures: none`.

Textarea is the source of truth. On `input` the editor re-reads the text; on `keyup` / `click` / `select` it captures `selectionStart` (`RichInput.emitCaret`). Each change runs the lexer, re-renders the overlay, and pushes ref-token rectangles to the adapter via `setHighlights`. Caret tracking deliberately uses those three events and NOT element-level `selectionchange`: `<textarea>` only fires `selectionchange` in Safari ≥ 18 / recent Chromium, below Handsontable's Safari 14.1 floor, so a single-listener "simplification" would freeze the caret index on supported Safari and every point-and-click ref insert would land at the wrong offset. IME input is handled in `RichInput` as well: `compositionstart` / `compositionend` toggle a `composing` flag, `input` events are skipped while composing, and `keydown` is ignored when `composing || event.isComposing || event.keyCode === 229` — this is what keeps composing text visible through the transparent textarea + overlay stack. Overlay scroll is slaved to textarea scroll (`ScrollAnchor`). Popup anchor rects are computed by `PopupController.anchorAt()` from viewport-absolute `getBoundingClientRect()` coords; caret token context comes from the pure walkers in `ui/caret/tokenContext.ts`.

---

## 5. Lexer

Hand-written scanner. Stateless, tokenizes partial/invalid input live with stable offsets — HyperFormula's parser is not reused because it rejects in-progress text. Locale-configurable: options `decimalSeparator` (`.`), `argSeparator` (`,`), `arrayColumnSeparator` (`,`), `arrayRowSeparator` (`;`) align the lexer with HyperFormula's grammar/locale.

Definitions: `TokenType` in `packages/core/src/lexer/tokens.ts`; `Token` + the meta interfaces in `packages/core/src/lexer/types.ts`. Token types: `FUNCTION`, `CELL_REF`, `RANGE_REF`, `NUMBER`, `STRING`, `OPERATOR`, `LPAREN`, `RPAREN`, `LBRACE`, `RBRACE`, `COMMA`, `SEMICOLON`, `WHITESPACE`, `IDENT`, `COMMENT`, `NAMED_EXPR`, `ERROR_LITERAL`, `ERROR`. A `Token` carries `type`, `value`, `start` (inclusive), `end` (exclusive), and optional `meta`: `CellRefMeta` (optional sheet; col/row; per-axis `abs` flags), `RangeRefMeta` (optional sheet; start/end each with col/row/abs; `whole?: "column" | "row"`), `CommentMeta` (`text`, `contextOk`), or `NamedExprMeta` (`kind: "scalar" | "cell" | "range"` — cell/range kinds also carry sheet + concrete coordinates).

Patterns: cell `(?:\$?[A-Za-z]+\$?\d+)` (column letters are case-insensitive — `a1` lexes the same as `A1`; a cell-shaped token immediately followed by `(`, e.g. `LOG10(`, is lexed as a function, not a ref); range `<cell>:<cell>`; whole-column `A:B` / whole-row `1:2` (marked `RANGE_REF` with `meta.whole`); function `[A-Z_][A-Z0-9_.]*` followed by `(`; number (decimal-separator aware) with optional scientific exponent; string `"(?:[^"\\]|\\.)*"`; ops `[+\-*/^%&=<>]=?|<>`; sheet-qualified `'…'!` or `[A-Za-z_][\w]*!`; error literal (`#REF!`, `#DIV/0!`, …); `{ }` array braces and `;` array-row separator; line comment `//…\n`. `additiveContext.ts` marks each `COMMENT` token with `contextOk` indicating whether it sits in a `+ N(...)`-compatible slot, which gates the comment ↔ N transform (§13).

`EngineBridge` is used for **semantic** post-processing after lex: function existence, address legality, signature lookup, and named-expression resolution (§5a). Function metadata — parameter names, description, doc link, examples — is sourced entirely from HyperFormula: `getFunctionSignature` reads `getFunctionDetails` (HF instance-metadata API, 3.4.0+) and falls back (`getFunctionPlugin(id)` for signature lookup, `getRegisteredFunctionNames()` names-only) — all called on the caller-supplied HF instance, feature-detected and `try/catch`-guarded. The suggestions catalog (`getFunctionCatalog` / `filterFunctionEntries`) is built from `getAvailableFunctions` — documented and custom built-ins, name-sorted, each with category + short description. Because HF returns translated function names but `getFunctionDetails` / `getFunctionPlugin` key on the language-independent canonical id, the catalog carries `canonicalName` and `getFunctionSignature` resolves the typed (translated) name to its canonical id before lookup — the displayed signature name stays as typed. No metadata is hardcoded; both primary and fallback methods are feature-detected and `try/catch`-guarded, degrading to a safe default when absent or throwing.

### 5a. Named expressions

`engine/namedExpr.ts` exports `annotateNamedExprs(tokens, resolve)` (`resolve: (name) => NamedExprResolution | null` — the editor passes `engineBridge.resolveNamedExpression`): walks the token stream and promotes a bare `IDENT` to `NAMED_EXPR` when the engine recognizes it as a named expression, attaching `NamedExprMeta`. `engine/namedExprName.ts` exports `validateNamedExprName(name)` — accepts Unicode identifier-shaped names, rejects A1-like names. Resolution lives in `engineBridge.resolveNamedExpression`, which fetches the named-expression formula from HF and parses it; whole-column/whole-row named ranges are expanded to concrete bounds via `getSheetDimensions(sheetId)`. Named expressions are colored with the same palette scheme as typed refs (§6); scalar named expressions color only the editor mark, while cell/range ones also mirror to grid highlights.

---

## 6. Ref Marks & Highlights

A `CELL_REF` / `RANGE_REF` / `NAMED_EXPR` token renders in the overlay as a colored ref mark (`hfe-ref-mark`; `NAMED_EXPR` additionally gets the `--named` modifier). Colors come from `theme/refPalette.ts`: a fixed `REF_PALETTE` cycled by first-appearance order (`assignRefIndex(map, refText)` + `paletteColorForIndex(index)`), so the same ref keeps the same color within a formula. The slot key is the uppercased ref text: `a1`, `A1` and `sheet2!a1`/`Sheet2!A1` share a slot (HyperFormula treats them as one cell), while `$A$1` and `A1` deliberately do not — cycling anchoring with F4 changes the mark so the user sees it happened. Known limitation: a redundant own-sheet prefix is not folded — `=A1+Sheet1!A1` on `Sheet1` takes two slots, because `VisualOverlay` has no engine handle to know which sheet is "own" and the grid must stay in sync with it; fixing it means injecting the own-sheet name into the overlay the way `knownFunctions` is. The textarea retains the raw ref string (`A1:B5`, `MyName`); the mark is overlay-only.

Hover/active refs mirror to the grid: `HighlightController.pushHighlights` walks tokens (including resolved named expressions), builds `RangeHighlight[]`, and calls `adapter.setHighlights(items)`. The caret being inside a ref token sets `fill: true` so the host can render that range with a fill (rather than only an outline).

**Cross-sheet refs are overlay-only by design.** `pushHighlights` drops any ref whose sheet prefix is not the adapter's own sheet (`EngineBridge.isOwnSheet` → `engine.getSheetId(name) === sheetId`), while the overlay still colors the token (`=Sheet2!A1` gets a ref mark but no grid rectangle). `IGridAdapter` models exactly one grid, so there is no surface to paint a sibling sheet's cells on; the editor color stays because it aids reading the formula regardless of where the target lives. Painting cross-sheet highlights on another grid instance is a future optional adapter capability (sibling-grid registry on a shared engine), not a bug in the current filter.

Editing goes through textarea + relex; there is no in-place ref-mark editing.

### 6a. Decorations (multi-function / bracket-depth)

`ui/text/decorations.ts` exports `computeDecorations(tokens, offset): Decorations` (caret offset) — a pure function feeding extra overlay styling without lexer changes: bracket-depth coloring by nesting level (emitted as a `data-parenDepth` attribute cycled through the depth palette, not a class), matching-paren highlight when the caret is adjacent (`hfe-token--paren-match`), unmatched-paren marking (`hfe-token--paren-err`), dimming of non-innermost calls (`hfe-token--dim`), and active-argument emphasis (`hfe-token--arg-active`).

---

## 7. Editor Behaviors

Keybindings are declarative: `formulaEditor/keymap.ts` (`BINDINGS`, first match wins) dispatched by `ShortcutManager`, implemented in `KeyboardController.registerCommands()`. The canonical shortcut matrix — including Home/End and the full `rangeMode` (`auto`/`on`/`off`) case table — lives in [`KEYBOARD-SHORTCUTS.md`](KEYBOARD-SHORTCUTS.md).

- **Auto-close parens**: typing `(` while editing a formula inserts `()` and places the caret between. If a selection exists, it wraps the selection.
- **Smart `)`**: typing `)` when one already sits at the caret moves the caret past it instead of inserting.
- **Newline**: `Alt+Enter` inserts `\n`; so does `Cmd/Ctrl+Enter` when the host has no fill commit.
- **Fill commit**: `Cmd/Ctrl+Enter` commits the value to every selected cell through `onCommitFill` or `IGridAdapter.commitFill`, when either is provided.
- **Directional commit**: plain `Enter` commits down, `Shift+Enter` up, `Tab` right, `Shift+Tab` left — after `closeUnbalancedParens` tops off missing `)`. The direction reaches the host via `onCommit(value, direction?)` → `adapter.commit(value, direction?)`; the host owns the selection move.
- **Escape**: a ladder — first closes the suggestions popup if open (`closeSuggestions`), else closes the function-help popup if open (`closeFnHelp`, suppressing it for the rest of the edit session), else falls to `cancel`: while pointing, a first `cancel` press cancels the pending point ref; a second (or plain) Escape cancels the edit via `onCancel`. Each press eats one layer (`keymap.ts` `BINDINGS`, first match wins).
- **Point mode (keyboard range selection)**: at a value position, arrows move a grid marquee one visible cell (`adapter.stepCell`) and insert/replace the ref at the caret; `Shift+Arrow` extends the range; `Ctrl/Cmd+Arrow` jumps to the data-block edge (`adapter.getDataEdge`); `Ctrl/Cmd+Shift+Arrow` extends the range to the data-block edge (anchor kept). Both map visual↔engine indices in the adapter, so a step lands on the visually-adjacent cell even when rows/cols are trimmed or reordered. Each step draws an ephemeral preview highlight (`adapter.highlightRange`, cleared on exit/cancel) and scrolls the cursor cell into view. `F2` / `Ctrl/Cmd+E` toggles pointing on/off — toggling arms point state without inserting (the first arrow inserts); at a non-value position it force-inserts a ref. State machine: `pointModeController.ts`.
- **F4**: cycles the ref under the caret `A1` → `$A$1` → `A$1` → `$A1` → `A1` (`adapter/refAbsolute.ts`).
- **Popup**: function name suggestions for documented built-in functions (with short descriptions) plus matching named expressions; `↑/↓` moves, `Enter`/`Tab` selects (a function inserts `NAME()` with the caret inside; a named expression inserts the bare name), `Esc` closes. Items order prefix-matches before substring-matches and highlight the matched prefix; an optional keyboard-help footer is gated by `SuggestionsOptions.showKeyboardHelp`. Popups position via viewport-anchored strategies (flip/clamp + max-height) and hide when the anchor scrolls out of the clip rect; `PopupController` owns the ARIA wiring (`role="listbox"`/`option` + `aria-activedescendant` from `SuggestionsAriaState`; fn-help is a non-modal `role="dialog"` labeled `"<NAME> function help"` + `aria-describedby`; error stays `role="tooltip"` + `aria-describedby`).
- **Function help**: when the caret sits inside a known call's argument list, `FunctionHelpPopup` shows the signature with the active argument highlighted. `F6`/`Shift+F6` move focus into the popup via the reusable `FocusTrap` primitive (`ui/focusTrap.ts`; first focusable element in DOM order via a generic `button, a[href], input, …` selector — normally the scrollable body, which carries `tabindex="0"` whenever it has content; falls through to the editor-host toggle below only when a content-free body leaves nothing focusable); the popup root advertises the exit via `aria-keyshortcuts="F6"`, and its keydown listener stops propagation of every key while the popup holds focus (host JS shortcuts stay quiet; a popup docked via `attachToHost` does not trap Tab — native tab order moves focus out); inside it, `Tab`/`Shift+Tab` wrap through the focusables (trap `exitKeys` is `["F6"]` only — key-name matching ignores shift, so Shift+F6 exits too), and `F6`/`Shift+F6` return focus to the editor without closing the popup, while `Escape` inside the popup closes it (same effect as the close button) and returns focus to the editor. From the editor, plain `Escape` closes fn-help via the ladder above instead of returning focus. Shift+F6 binds to dedicated `focusFnHelpBack`/`toggleEditorHostBack` commands that delegate to the forward `focusFnHelp`/`toggleEditorHost` logic (`ShortcutManager` itself stays no-arg; the reverse commands carry the direction). Closing the popup while it holds focus (e.g. `Enter` on the close button, or Escape) also returns focus to the editor. When the popup is closed, `F6`/`Shift+F6` instead toggle the editor host inline cell ↔ formula bar (active bar edit session only) via `FormulaEditor.setHostToggleDelegate` — popup mode always wins, so the host never switches while the popup is open. See [`KEYBOARD-SHORTCUTS.md`](KEYBOARD-SHORTCUTS.md) for the full matrix.
- **Error tooltip**: shown on hover/focus of an error cell while the grid (not the editor) owns focus. `Escape`, captured by a window-level keydown listener owned by `ErrorPopup`, dismisses it and suppresses that cell's tooltip until both pointer and focus leave the cell — required for WCAG 1.4.13 (content shown on hover/focus must be dismissible via Escape without moving pointer or focus). The listener stands down while focus is inside an editor, fn-help, or formula-bar root, so the focused surface's own Escape handling (including the address box's Escape-revert) always wins over a hover-raised tooltip; suppression survives unrelated focus movement while the pointer stays on the cell, and re-entering the suppressed cell while the tooltip shows another cell's error closes the stale tooltip. No adapter or `IGridAdapter` involvement; self-contained in `ErrorPopup`.
- **Ref insertion**: a single grid pick replaces the previously inserted ref if the caret hasn't moved past it (`lastRef` tracking) — picking again "edits" the ref instead of appending another.
- **Mod+click multi-select**: holding Cmd/Ctrl while picking (click or drag) appends the new range as a comma-joined ref after the previously-picked one instead of replacing it, as long as that previous ref hasn't been edited away and the caret still sits at its end (the same pending-ref condition that gates a plain replace). A mod+click with no prior ref, or after the prior ref was edited away or the caret moved off it, falls back to a plain fresh insert (same `canInsertRef` gating as a normal click). `setValue` resets the tracked ref, so a re-seeded editor never appends after a ref from a previous edit session. Picks travel as `CellPick`/`RangePick` (`{ ref, append }`) through `CellPickListener`/`RangePickListener`.
- **canInsertRef gate**: refs only insert if the text starts with `=` and the caret follows whitespace + an opener. Openers are `= + - * / ^ & < > ( :` plus the active locale's `argSeparator` and `arrayRowSeparator` (`refOpeners`), so no orphan refs glue to identifiers.
- **Header click/drag whole-ref insertion**: clicking or dragging a grid row/column header while ref-eligible inserts a whole-row/whole-column ref (`A:A`, `3:3`) via the optional `GridHeaderPickSurface.onHeaderPick` (§8); implemented by the Handsontable plugin and the four example adapters maintained outside this repository — plain-table and TanStack cover both row and column axes, AG Grid and MUI are column-axis only (their hosts don't expose row headers as a pickable surface).

### 7a. Formula bar

`formulaBar/formulaBar.ts` — optional, wired by passing `formulaBarContainer` to `FormulaBuilder`. `FormulaBar` composes two own-root sub-components: `FormulaBarAddressBox` (jump-to-cell/range input; displays `A1` for a single cell or `A1:B5` for a multi-cell `GridSelection`; a typed `A1:B5` calls `adapter.setSelection`, a single `A1` calls `adapter.setActiveCell` + `scrollCellIntoView`) and `FormulaBarCell` (fx icon + idle read-only colored-formula view, own `VisualOverlay` seeded with `FormulaEditor.knownFunctionNames`, plus the overlay mount the shared editor attaches into while bar-hosted). While the editor is inline, the bar's formula cell shows the live idle colored mirror (rendered through `nToComments`, so the display form — not engine form — is colored); clicking it reparents the single shared `FormulaEditor` into the bar mount (inline overlay hidden via `setInlineEditorVisible(false)`). Focusing the bar editor or clicking the idle cell with no active cell selects the first cell (`adapter.selectFirstCell`). The handoff is brokered entirely through the `IGridAdapter` bar-lifecycle methods (§8) — `FormulaBar` never touches the host grid directly. The idle formula cell is a focusable `role="textbox"` (`aria-label="Formula input"`, AT-visible value) that activates the shared editor on focus (Tab, Shift+Tab, or click) — the clean-editor tab slide (ARCHITECTURE.md) lets Tab/Shift+Tab traverse past a bar-hosted, not-yet-dirty edit instead of re-committing into a loop. Full model incl. the bar-less fallback: ARCHITECTURE.md.

---

## 8. IGridAdapter Interface

All contracts live in `packages/core/src/adapter/types.ts`.

Supporting types: `Direction` (`"up" | "down" | "left" | "right"`), `GridSize` (rows/cols), `CellAddress` (sheet/col/row), `CellRange` (start/end), `GridSelection` (active + range), `Unsubscribe`, `RefSelectionColorResolver` (`(range, append, wholeAxis?) => string`), `RangeHighlight` (range, color, `fill?`, `whole?: "column" | "row"`), `CellPick` / `RangePick` (`{ ref, append }`) with `CellPickListener` / `RangePickListener` / `OutsideCellClickListener`, `HeaderAxis` (`"column" | "row"`), `HeaderPick` (`{ axis, sheet, start, end, append }`, `start`/`end` in HF/engine-space indices) with `HeaderPickListener`, `OutsideClickCommitMode` (`"emitted" | "native"`), `RangeRect` (left/top/width/height, `zIndex?`).

Role interfaces and their members:

| Interface | Members |
|---|---|
| `GridPickSurface` | `outsideClickCommitMode` (readonly), `getCellAddressAt(x, y)`, `formatRef(ref)`, `setHighlights(items)`, `highlightRange(range, color)`, `clearEphemeralHighlight()`, `clearHighlights()`, `setOverlayClassName(className)`, `onCellPick(callback)`, `onRangePick(callback)`, `onOutsideCellClick(callback)`, `enterRefSelectionMode(resolveColor?, isPickEligible?)`, `exitRefSelectionMode()` |
| `GridNavigation` | `getGridSize()`, `getDataEdge(from, direction)`, `stepCell(from, direction)`, `scrollCellIntoView(address)` |
| `GridEditLifecycle` | `getActiveCell()`, `onSelectionChange(callback)`, `getCellFormula(address)`, `beginEdit(address, seed?)`, `selectFirstCell()`, `setActiveCell(address)` and `setSelection(range)` (return `false` when the host cannot select the target, so the address box rejects it; `void` counts as success), `onInlineEditStart(callback)`, `onInlineEditClose(callback)`, `onSwitchToInline(callback)`, `commit(value, direction?)` (must write to the engine synchronously before returning — commit-error announcements read the engine and capture `valuesUpdated` inside the commit call; a deferred write degrades announcements to silence, never a crash), optional `commitFill(value)` (Ctrl/Cmd+Enter: write `value` into every selected cell, synchronously like `commit`; when absent Ctrl/Cmd+Enter inserts a newline, and Alt+Enter always does), `cancel()`, `setInlineEditorVisible(visible)` |
| `GridHeaderPickSurface` (optional) | `onHeaderPick(callback)` — emits `HeaderPick` on row/column header click/drag; mixed into `IGridAdapter`/`EditorGridAdapter` as `Partial<GridHeaderPickSurface>`, so adapters without headers implement nothing (no `NullAdapter` no-op) |
| `IGridAdapter` | extends the three required role interfaces plus `Partial<GridHeaderPickSurface>`; adds `destroy()` |
| `GridGeometry` | adapter-side geometry contract consumed by `HighlightLayer`: `getOverlayHost()`, `getRangeRects(range)`, `getViewportClip?()`, `onViewportChange(callback)`, `getColHeaderEl?(col)`, `getRowHeaderEl?(row)` |

`NullAdapter` implements all required methods as no-ops and doubles as the base class for basic adapters (the plain-table example's `PlainTableAdapter extends NullAdapter`); it implements nothing for the optional `GridHeaderPickSurface`.

The three required role interfaces mirror the three core consumers: `GridPickSurface` is driven by `FormulaEditor` and its controllers (highlights, picks, ref-selection mode), `GridNavigation` by `PointModeController` plus the outside-click select, and `GridEditLifecycle` by `FormulaBar` (and `FormulaBuilder`'s barless inline-edit subscription). The optional `GridHeaderPickSurface` is also driven by `FormulaEditor`, which subscribes defensively via `adapter.onHeaderPick?.(...)` (`wireAdapter`) and formats each pick with `formatWholeRef(pick)` (`adapter/refFormat.ts`, `A:C` / `4:4` shape) before inserting; `expandHeaderSpan(pick, size)` (`adapter/range.ts`) converts a `HeaderPick` to the equivalent `CellRange` for highlighting. Adapters implementing it must never intercept an ineligible header interaction (outside ref-selection mode, or not aimed at a real header) — no `preventDefault`, no synthetic emit; host-native behavior runs unmodified. `destroy()` sits on `IGridAdapter` directly because the host — not core — owns the adapter lifecycle. `EditorGridAdapter` (`GridPickSurface & GridNavigation & Pick<GridEditLifecycle, "getActiveCell"> & Partial<GridHeaderPickSurface>`) is the slice `FormulaEditorOptions.adapter` and `EditorContext.adapter` are typed against — the editor never sees the edit-lifecycle surface beyond `getActiveCell` (the point-mode anchor); `FormulaBar` and `FormulaBuilder` take the full `IGridAdapter`.

`outsideClickCommitMode` declares who commits when a mousedown lands on another cell while the caret is pick-ineligible: `"emitted"` adapters (the `NullAdapter` default and the plain-table, TanStack, AG Grid and MUI examples) emit `onOutsideCellClick` and core commits; `"native"` adapters (none in-repo — exercised by the external Handsontable `formulaBuilder` plugin) let the host's own editor manager commit and select, and `FormulaBuilder` skips the `onOutsideCellClick` subscription entirely.

`setHighlights` is the canonical, idempotent push from editor to grid (replaces the full set every keystroke). `highlightRange` / `clearEphemeralHighlight` are used for transient drag-pick visuals driven by `DomRangePicker`.

**Important**: never add adapter-shaped methods directly to a concrete adapter — extend `IGridAdapter` first so every host stays in sync (then `NullAdapter`, then every concrete adapter; `npm run typecheck` flags stragglers).

---

## 9. Adapters

No adapter ships in this repository; see §1. An adapter implements `IGridAdapter` (§8), using `HighlightLayer` from core with `DomRangePicker` or `RangeDragTracker` as the picker machinery, and core's `PickEmitter` for pick emission. Error display always lives in the host (see the error display policy in [`ARCHITECTURE.md`](ARCHITECTURE.md#error-display-policy)).

---

## 10. HyperFormula Integration

- **Optional** peer dep. `EngineBridge` accepts the HF instance via `hyperformula`. Degrades to a no-op when no instance is supplied.
- Calls used (all optional, duck-typed, feature-detected): instance `getAvailableFunctions()` / `getFunctionDetails(canonicalName)` (HF instance-metadata API, 3.4.0+) with `getRegisteredFunctionNames()` / `getFunctionPlugin(functionId)` fallbacks (public instance methods, available in HF 3.3.0+) — no language argument; HF translates names via the instance's configured language (§5); `getConfig()` for language + separators; `simpleCellAddressFromString` / `simpleCellRangeFromString`; `getSheetId(name)` / `getSheetName(id)`; `getCellValue(address)`; `listNamedExpressions(scope?)`, `getNamedExpressionFormula(name, scope?)`, and `getSheetDimensions(sheetId)` for named-expression resolution (§5a); `on` / `off` for `valuesUpdated` and named-expression add/remove events (cache invalidation + commit-error capture).
- Against HyperFormula 3.0.0–3.3.0 (no instance-metadata API): the editor degrades to a names-only catalog (`getRegisteredFunctionNames()` fallback) and plugin-shaped signatures (`getFunctionPlugin(functionId)` fallback).
- The caller owns the HF instance; the editor never destroys it. The caller may destroy it before the builder: unsubscribing from a destroyed instance throws, so the engine bridge swallows that error, and `FormulaBuilder.destroy()` and `FormulaEditor.destroy()` run every teardown step even when one throws (an adapter whose grid is already gone, for example), rethrowing the first error at the end (`events/runAll.ts`), so no popup portal, live region or injected stylesheet is left behind.
- The engine type in the public surface is duck-typed (`HyperFormulaLike` in `engine/types.ts`), not imported from `hyperformula` — keeps the editor decoupled from the engine version.
- `EngineBridge` is the only HF access point: raw `HyperFormulaLike` is never touched outside `src/engine/`.

---

## 11. CSS Architecture

- Sources in SCSS (`packages/core/src/styles/*.scss`); compiled with `sass` into the committed,
  generated `src/theme/cssText.ts` string module (`hyperformula-ui/scripts/generateCssText.mjs`, run by `build:styles`).
- Styles auto-inject: `injectStyles()` appends one `<style data-hfe-styles>` tag on first
  `FormulaBuilder`/`FormulaEditor` construction (ref-counted, idempotent, SSR-guarded). There is no
  `hyperformula-ui/styles` export; consumers import no CSS. Adapters reuse the exported
  `createStyleInjector(marker, cssText)` for their own generated stylesheets.
- BEM blocks: `hfe-editor`, `hfe-overlay`, `hfe-ref-mark`, `hfe-popup`, `hfe-popup-portal`, `hfe-suggestions`, `hfe-fn-help`, `hfe-highlight`, `hfe-token`, `hfe-error`, `hfe-cell--error`, `hfe-formula-bar` (`__cell`, `__cell--address`, `__cell--formula`, `__address-input`, `__fx-icon`, `__body`, `__idle`, `__overlay`). Decoration modifiers: `hfe-token--paren-match`, `hfe-token--paren-err`, `hfe-token--dim`, `hfe-token--arg-active`; error/status modifiers `hfe-token--{comment-err,fn-unknown,ref-invalid}`; per-token-type classes via `TOKEN_CN`. Full element/modifier inventory: `theme/classNames.ts`.
- Every class name string lives in `theme/classNames.ts` (`CN`, `TOKEN_CN`) — no string literals scattered in components.
- `color-scheme: light dark` is set in `tokens.scss` on the package roots only (`hfe-editor`, `hfe-formula-bar`, `hfe-popup-portal`, `hfe-popup--hosted`), inside `:where()` so it has no specificity: a host theme class on a root (the `className` option lands on every root) overrides it with a single class selector, and the elements inside a root inherit it. Never set it through a class-attribute substring selector such as `[class*="hfe-"]`: that overrides the inherited scheme on every package element, and the browser tests it against every element of the page. All themed colors via `light-dark(lightVal, darkVal)`, which follows the operating system unless the host sets the scheme.
- Variable namespace `--hfe-*`. Ref colors from the fixed `REF_PALETTE` (`theme/refPalette.ts`), which points at `--hfe-ref-1..8`. Those eight properties are a public override surface, documented in the package README; every default clears 4.5:1 against `--hfe-color-background` in both schemes (WCAG 1.4.3 for reference text, which also covers 1.4.11's 3:1 for highlight borders), and every pair stays at least 10 apart in OKLab (ΔE × 100) within each scheme, so no two references read as the same color; `tests/theme/stylesheet.test.ts` checks both. The contrast holds at full opacity only: `--hfe-dim-opacity` dims the references of the enclosing calls (`hfe-token--dim`, §6a) below it. Formula-bar tokens: the color/border ones (`--hfe-formula-bar-{background,foreground,border,border-width,border-radius}`) alias global tokens — no bar-specific colors; the sizing ones (`--hfe-formula-bar-{padding-vertical,padding-horizontal,gap-address,gap-formula,address-width,scrollbar-width}`, `--hfe-z-index-formula-bar`) carry literal defaults. The vertical padding sits on the bar's overlay and textarea, not on the formula cell, and the cell has no end padding.
- Fonts: `--hfe-font-family` (default `inherit`, the host's font) for UI text, `--hfe-formula-font-family` (monospace) for formula text, and `--hfe-error-font-family`, read by both `hfe-cell--error` and `hfe-error__title` as `var(--hfe-error-font-family, var(--hfe-font-family))`, so an error value in a cell and the error popup title always render in the same font. The fallback sits at the use site on purpose: a custom property that refers to another one resolves where it is declared, so declaring `--hfe-error-font-family: var(--hfe-font-family)` on `:root` would freeze the root value and ignore a host's `--hfe-font-family` on its theme class.
- Scrollbars: `--hfe-scrollbar-width` (default `thin`) sets `scrollbar-width` on a height-capped editor and the two popup lists; the bar-hosted editor takes `--hfe-formula-bar-scrollbar-width` (default `auto`) instead, because a thin bar in a one-line scroll port is hard to grab.
- Editor sizing is host-configurable via `--hfe-editor-min-lines` / `--hfe-editor-max-lines` (line-unit height clamps, read by `EditorSizeController`), `--hfe-editor-resize` (`none`/`vertical`/`horizontal`/`both` for the native resize grip), `--hfe-editor-max-width` (px width cap, applied with or without a clipping ancestor), and `--hfe-editor-min-width` (width floor for the resize grip; defaults to `100%` of the mount). Set them on the editor root or an ancestor.
- `FormulaBuilder`'s `className` option is the single theming entry point — it lands on the popup portal, formula bar container, editor root, and (via `adapter.setOverlayClassName`) the adapter's highlight overlays.

---

## 12. Build & Commands

Run from the repository root; the full list of root scripts is in [`dev-docs/BUILD.md`](../../dev-docs/BUILD.md). The package's own scripts take `--workspace=hyperformula-ui/packages/core`; name the workspace by path, because `--workspace=hyperformula-ui` also matches workspaces by folder.

- `npm run build:ui` — styles, JS and declarations for the package.
- `npm run lint` — every workspace lints itself; the UI packages run `biome check .`, and the core also checks the shared configuration and scripts. `npm run lint:fix` applies fixes.
- `npm run typecheck` — `tsc` in every UI package; the core's script also covers `tsconfig.test.json`. The demo and the e2e suite need the engine built first (`npm run bundle-all`), because they resolve `hyperformula` from this workspace.
- `npm run test:ui` — the core's vitest suite.
- `npm run test:e2e` — the Playwright suite; starts the demo server itself.
- `npm run dev:ui` — the demo server on port 5173 (long-running).
- `npm run docs --workspace=hyperformula-ui/packages/core` — regenerates `DOCS.md`.

Build steps: `build:styles` (`scripts/generateCssText.mjs`) → `rspack build` (JS, ESM via `experiments.outputModule` + `library.type: "module"`, swc-loader targeting ES2022, `hyperformula` as an external) → `build:types`: `tsc -p tsconfig.json --emitDeclarationOnly` (`.d.ts`), then `scripts/addDeclarationExtensions.mjs --dir dist`, which rewrites each relative import in the emitted declarations to the `.js` path a `node16`/`nodenext` consumer needs, and fails on one it cannot resolve. `check:types` runs `attw --pack . --profile esm-only` on the packed package; CI runs it after the build. The demo uses Vite, not rspack.

---

## 13. Comments ↔ `N()` Boundary

`packages/core/src/kernel/commentTransform.ts` exports two pure string→string functions (both take an optional `Partial<LexerOptions>` so locale separators — e.g. a `;` arg separator — tokenize the same way as the kernel's lexer; `FormulaEditor` and `FormulaBarCell` pass `EngineBridge.getSeparators()`):

- `commentsToN(src, lexerOptions?)` — convert each `// comment` (in a context where additive `+ N("…")` is legal) into `+ N("…")`. Output is engine-ready. Quotes and backslashes inside the comment are escaped with a backslash (`\"`, `\\`), matching HyperFormula's string grammar (HF does not accept Excel-style doubled `""`); `nToComments` unescapes only those two pairs.
- `nToComments(src, lexerOptions?)` — inverse: detect `+ N("…")` shaped fragments produced by the editor and restore the `// comment` form for display. Non-formula text (no leading `=`) passes through untouched.

These are the **canonical boundary**. `FormulaEditor.setValue` runs `nToComments` so callers can pass either form; `FormulaEditor.getValue` runs `commentsToN` so consumers always get engine-form. The lexer marks each `COMMENT` token with `contextOk` (computed by `additiveContext.ts`) to drive the conversion — comments that aren't in a `+ N(...)`-legal slot stay untouched on both sides.

---

## 14. Tests

Exact counts rot fast — run `npm run test:ui` / see `e2e/COVERAGE.md` for the live picture.

**Vitest — `packages/core/tests/`**: mirrors the `src/` subdirectory layout (`tests/adapter/`, `engine/`, `events/`, `formulaBar/`, `formulaEditor/`, `kernel/`, `lexer/`, `theme/`, `ui/{caret,highlight,popup,text}/`), kebab-case filenames, ~85 files. Shared fakes and DOM helpers live in `tests/helpers/` (barrel) — extend them instead of redefining per-file fakes. The keyboard matrix (`formulaEditor/keyboard-controller.test.ts`), point mode, popups, lexer, comment boundary, named expressions, and highlight geometry are all unit-owned here.

**Playwright — `e2e/tests/`**: a **basic integration smoke** tier, not a behavior suite. Each spec is one line calling the shared `runBasicSuite(findDemo(...))` factory (`tests/_shared/{demos,drivers,basicSuite}.ts`); the editor-only `js/basic` demo gets 1 DOM-only check (`=1+2` → `#result` `3`). Details in `e2e/COVERAGE.md`. All behavior is unit-owned.

Conventions and the failing-test-first workflow: [`TESTING.md`](TESTING.md).

---

## 15. Critical Files

- `tsconfig.base.json`, `biome.json`
- `packages/core/src/index.ts` — public surface
- `packages/core/src/formulaBuilder.ts` — consumer-facing master class
- `packages/core/src/formulaEditor/formulaEditor.ts` — editor facade + controller wiring
- `packages/core/src/formulaEditor/{keymap,keyboardController,pointModeController,refController}.ts` — keyboard/point-mode behavior
- `packages/core/src/formulaBar/{formulaBar,formulaBarAddressBox,formulaBarCell}.ts` — formula bar
- `packages/core/src/ui/icons.ts` — built-in SVG icon data (popups + formula bar fx icon); host overrides via the `icons` option
- `packages/core/src/kernel/kernel.ts`, `kernel/commentTransform.ts`
- `packages/core/src/lexer/lexer.ts`, `lexer/tokens.ts`, `lexer/additiveContext.ts`
- `packages/core/src/engine/engineBridge.ts`, `engine/namedExpr.ts`, `engine/namedExprName.ts`
- `packages/core/src/adapter/types.ts` — adapter contract
- `packages/core/src/ui/text/{richInput,visualOverlay,decorations}.ts`, `ui/highlight/highlightLayer.ts`, `ui/popup/{basePopup,suggestionsPopup,functionHelpPopup,errorPopup,popupContext}.ts`
- `packages/core/src/events/eventManager.ts` — DOM listener lifecycle
- `packages/core/src/theme/classNames.ts` — all BEM names; `theme/refPalette.ts` — ref colors
- `packages/core/src/styles/tokens.scss` — theme variables
- `demo/js/vite.config.ts`
- `e2e/playwright.config.ts`, `e2e/tests/fixtures.ts`
