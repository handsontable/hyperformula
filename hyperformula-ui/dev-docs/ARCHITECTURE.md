# Core package — architecture

## High-level picture

`packages/core` is the engine-agnostic formula editor. It has no dependency on any specific
grid host. The host connects via `IGridAdapter`. HyperFormula is an optional peer dependency
used for function validation and named-expression resolution.

## Single-editor host-switch model

There is exactly one `FormulaEditor` instance per grid. It is owned by `FormulaBuilder` and
reparents between two locations via `FormulaEditor.attachTo(mount)`:

- **Inline mode** — the editor lives in the cell overlay mount created by the adapter.
- **Bar mode** — the editor lives inside the formula bar overlay created by
  `FormulaBar`.

`IGridAdapter` brokers the handoff via thirteen bar lifecycle methods:

- `getActiveCell()` — returns the active cell, or `null` when there is none. Serves both the
  formula bar (which cell to mirror) and keyboard point-mode (the anchor
  `PointModeController.enter()` starts from). Addresses are HF-space: the external Handsontable
  `formulaBuilder` plugin (handsontable repo) maps its tracked visual selection through
  `visualToHfRow`/`visualToHfCol` and returns `null`
  when the selection is not a formula-capable cell. Of the example adapters maintained outside
  this repository, the TanStack one reads its tracked selection directly, and the plain-table one
  delegates to its injected `PlainTableHost` when one is provided (its demo's `PlainTableSheet`),
  else falls back to its `getActiveCell` constructor option, else `null`. The controller handles the `null` path by calling
  `selectFirstCell()`, so new adapters may return `null` safely.
- `onSelectionChange(callback)` — adapter fires `GridSelection | null` (`{ active, range }`)
  when the selection changes; the bar mirrors the active cell's value and the address box
  shows the range (`A1` for a single cell, `A1:B5` for multi-cell).
- `setSelection(range)` — adapter selects the given `CellRange`; called by the address box
  when a typed `A1:B5` range is submitted. Gesture ownership (mouse drag, shift+click,
  shift+arrows) is host-owned, not core's: the external Handsontable plugin rides HOT's
  native selection, the plain-table example host implements its own
  mousedown/mouseover/keydown gestures, and the TanStack example adapter ships default gestures through `getCellProps` and owns the resulting
  anchor+focus state. Core and adapters carry the data contract only — no gesture code, no
  selection visuals.
- `onInlineEditStart(callback)` — adapter fires when a cell editor opens; the formula-bar
  controller calls `attachTo(barMount)` and seeds the value.
- `onInlineEditClose(callback)` — adapter fires when the cell editor closes; the controller
  detaches.
- `onSwitchToInline(callback)` — adapter fires when the bar hands editing back to the inline
  cell; the controller moves the editor back to the inline mount.
- `getCellFormula(address)` — controller reads this to seed the bar when the selection changes.
- `beginEdit(address, seed?): boolean` — controller calls this when the user clicks the bar
  placeholder to open the cell editor. Returns `true` if it initiated an edit (synchronously OR
  async-pending), `false` if it bailed (read-only, unmapped or not-rendered cell).
  `FormulaBar.activateFromIdle` rolls back its bar session only on `false`, so an adapter whose
  editor starts on a later tick (e.g. `ag-grid-react`'s deferred `startEditingCell`) must still
  return `true` — otherwise the deferred inline-start lands on the wrong branch. When the
  activation was focus-driven (idle cell focused) and the deferred `onInlineEditStart` arrives
  after focus has already left the formula-cell region, `handleInlineEditStart` cancels the
  session (`adapter.cancel()`) instead of stealing focus back into the bar.
- `selectFirstCell()` — controller calls this when `getActiveCell()` returns `null` (no
  selection); adapters that always have a selection may implement this as a no-op.
- `setActiveCell(address)` — selects the given cell via the same selection path as
  `selectFirstCell()`, without starting an edit. Called by `FormulaBar.navigateTo` (the
  address box), paired with `scrollCellIntoView`, and by `FormulaBuilder` after an
  outside-click commit (see the outside-click commit policy below). Addresses are HF-space;
  the external Handsontable plugin maps them back to visual indices before selecting.
  Both `setActiveCell` and `setSelection` return `boolean | void`: `false` means the host could
  not select the target (a filtered-out row, a hidden column), and the address box then rejects
  the typed address — `FormulaBar` returns `"unavailable"` to it, so it reverts, announces
  `Phrases.cellUnavailable` ("Cannot select B7") rather than `invalidCellAddress`, and skips
  `scrollCellIntoView`. `void` counts as success, so adapters written before the result keep
  working.
- `commit(value, direction?)` — controller calls to commit the current value; the optional
  `Direction` drives the host's post-commit selection move (Enter → down, Tab → right, …).
  `commit(value, direction)` must apply the value to the engine synchronously before
  returning — commit-error announcements read the engine and capture `valuesUpdated`
  inside the commit call. Applies equally to a host-side commit bridge (such as the plain-table
  example's `PlainTableHost.commit`) and any consumer-supplied `onCommit`. A deferred write degrades announcements to silence
  (no crash, no wrong message).
- `commitFill?(value)` — optional; Ctrl/Cmd+Enter calls it (through `FormulaBuilder`'s
  commit wrapper, so commit-error announcements work the same) to write `value` into every
  selected cell. A builder `onCommitFill` option takes precedence, as `onCommit` does over
  `commit`. With neither, the `commitFill` command returns `false` and `ShortcutManager` falls
  through to the next Ctrl/Cmd+Enter binding, `insertNewline`; Alt+Enter always inserts a
  newline.
- `cancel()` — controller calls to cancel the current edit.
- `setInlineEditorVisible(visible)` — hides or shows the cell overlay mount while the editor
  is hosted in the bar (the plain-table and TanStack example adapters toggle the container's CSS display;
  the external Handsontable plugin hides HOT's editor container via `_hfeHidden`).

`FormulaBar` composes two own-root sub-components, each with its own `EventManager` scope:
`FormulaBarAddressBox` (`address-box` scope) — an `A1`-style jump-to-cell/range input that
calls `adapter.setActiveCell` + `scrollCellIntoView` for a single cell or `adapter.setSelection`
for an `A1:B5` range, and mirrors the current `GridSelection` via `setSelection()` — and `FormulaBarCell` (`formula-cell` scope) — the fx-icon +
formula area, owning both the idle read-only colored-formula view (its own `VisualOverlay`
seeded with `FormulaEditor.knownFunctionNames`, rendered via `renderValue()` through
`nToComments`) and the `overlayMount` the shared editor `attachTo`'s while bar-hosted. The idle
view's tokens go through the same `annotateNamedExprs` step as the editor's kernel
(`FormulaBarCellOptions.tokenPostProcess`), so a named expression takes a reference color slot
in both and every later reference keeps the same color; `FormulaBar` re-renders the idle view
through `FormulaBarCell.refresh()` when `EngineBridge.onNamedExpressionsChange` fires (on HyperFormula's named-expression, `valuesUpdated` and `sheetRemoved` events — see SPEC.md §10 for why the named-expression events alone are not enough).

While the editor is inline, `FormulaBarCell`'s idle view shows a live colored mirror of the
current text. Because the wrap styles are shared, a bar-hosted editor soft-wraps at the bar
container's width the same way the inline editor wraps at the grid edge (the bar-hosted editor
carries `max-width: 100% !important` — formula-bar.scss — so it wraps at the bar body's width
regardless of EditorSizeController's clip-derived inline cap, which stays in charge of the
height cap); the idle view wraps the same way
(`pre-wrap` + `break-all`) but keeps a static one-line height and scrolls vertically
(`overflow-y: auto`) — never a horizontal scrollbar, never a growing bar while inline. The
bar's vertical padding sits on the overlay and the textarea, not on the formula cell, so the
idle view and a bar-hosted editor capped at one line (`--hfe-editor-max-lines: 1`) are the
same height, and the capped editor's scroll port spans the whole cell. When the user clicks the idle formula cell, the bar triggers a host-switch: the
editor reparents to the bar mount (`FormulaBarCell.overlayMount`), the cell overlay is hidden, and focus moves to the bar
input. The bar shows the mount before `attachTo`, so `EditorSizeController` measures a visible
editor and applies its cap before `focus()` can scroll an ancestor to the caret. A
bar-initiated open then calls `FormulaEditor.scrollToStart()`: the caret stays at the end, but
a capped bar shows the formula's first line, as the idle view did.

Formula bar activation (a11y design decision, 2026-07, revised 2026-07): the idle formula
cell is a focusable `role="textbox"` placeholder (`tabindex="0"`, `aria-label="Formula
input"`, no `aria-readonly`) whose idle overlay is AT-visible, so the current formula reads
as the textbox value. **Focusing the placeholder activates the shared editor** (Tab,
Shift+Tab, or click — `mousedown` calls `preventDefault` and activates directly rather than
relying on the resulting focus). `role="button"` was rejected: the cell is input-like, not
button-like. A role-less named div was rejected: naming `role=generic` is ARIA-prohibited.
While the overlay editor is mounted the placeholder drops to `tabindex="-1"` so Shift+Tab
from the textarea cannot land on it.

An earlier hybrid design (bare focus inert, Enter/F2/Space/printable-key activation)
rejected focus-activation on the grounds that Shift+Tab from the grid would re-enter editing
and commit straight back — a backward-traversal loop. The fix is the **clean-editor tab
slide**: while the editor is bar-hosted and its value equals the formula captured when the
edit session started (`KeyboardController.isCleanBarHosted()`, backed by
`HostToggleDelegate.isDirty`), Tab/Shift+Tab are not commit gestures. The captured pristine
value is run through `FormulaEditor.normalizeFormula()` — the same `nToComments`/
`commentsToN` round-trip `setValue`/`getValue` apply — before `FormulaBar` stores it; a raw
`adapter.getCellFormula()` compared directly against `editor.getValue()` would read a cell
carrying an `N("…")` comment as dirty on open (the round-trip re-spaces the call), sliding
never engaging for any commented formula.
`KeyboardController.commit()` checks `isTabTraversalCommit(direction)` — true for
`commitRight`/`commitLeft`, the two commands the Tab bindings produce, never for the Enter
variants (`commitUp`/`commitDown`) — and returns `false` before invoking `onCommit` when
that check and `isCleanBarHosted()` both hold. `ShortcutManager.dispatch` then never calls
`preventDefault`, so the browser's native Tab navigation moves focus off the bar in either
direction. Inline (cell-hosted) editing keeps Tab-commit unconditionally; only the
bar-hosted clean case slides. The abandoned bar editor (now unfocused, still open) is closed
by `FormulaEditor`'s blur handler: when focus leaves and `isCleanBarHosted()` is still true,
it calls the same `onCancel` the Escape key uses, so the session cancels silently — no
commit, idle view restored — instead of leaking an open editor behind the moved focus.
Dirty sessions (including a type-to-edit seed, which already differs from the pristine
value) still commit on Tab as before.

### Bar-less fallback

A grid running **without** a `FormulaBar` wired up has no bar-side subscriber to
`onInlineEditStart`. The external Handsontable `formulaBuilder` plugin (handsontable repo)
handles this itself: when `activeEditor` is still null after the listener loop, the
`!activeEditor` branch in its `handleInlineEditStart` calls `builder.openEditor(mount, seed)` —
which calls `FormulaEditor.attachTo(mount)`, sets the seed value, enters ref-selection mode,
and focuses the editor.

The `FormulaEditor` inside `FormulaBuilder` is **long-lived**: it is created once and reused
across edit sessions. The plugin's cell editor calls
`editor.input.replaceChildren()` on close, which detaches the editor's root element from
the mount but does not delete it. On the next open, `attachTo(mount)` re-appends the same
element — all DOM listeners survive (see the reparent invariant below). The plain-table
example adapter always assumes a `FormulaBar` is present and does not have this fallback;
the TanStack example adapter's bar is dynamically attachable/detachable, so it relies on the same
barless inline-edit subscription when the bar is absent. That barless subscription
(`FormulaBuilder.subscribeInlineEditLifecycle`, scope `inline-edit`) handles both ends of the
session: `onInlineEditStart` → `openEditor(mount, seed)`, and `onInlineEditClose` → reattach
the editor to the builder's detached mount plus `closeEditor()`. The close half exists because
adapters may remove the inline mount on close (the TanStack example adapter deletes its overlay);
without the reattach the live editor DOM would be torn out with the mount. With a bar
attached, `FormulaBar` owns the same reattachment instead.

### Phrases

No user-visible or spoken English is hard-coded in a component. Every accessible name, hint
and announcement is a member of `Phrases` (`ui/types.ts`), with English defaults in
`DEFAULT_PHRASES` (`ui/phrases.ts`); phrases that take values (a function name, a cell address,
an error count) are functions, so a translation can reorder words and handle plurals.
`FormulaEditor` resolves the `phrases` option once and exposes the result as
`FormulaEditor.phrases`; the popups receive it through `BasePopupOptions.phrases` (read in
`createRoot`, which runs inside the base constructor), and `FormulaBar` and `FormulaBuilder` read
it from the editor. A new string goes into `Phrases`, not into the component. The one exception is a key
name shown as a key chip (`Tab`, `↑`, `↓`): it names the key on the keyboard, as Excel and Google Sheets
show it in every language. Phrases that end up inside brackets or after a key chip carry no brackets
or surrounding spaces; the component adds them, so a host dictionary that trims whitespace or treats
`[name]` as a variable (Handsontable's) can hold them.

## Component map

```
formulaBuilder.ts — FormulaBuilder: master class owning PopupContext + ErrorPopup + FormulaEditor
                    for one grid instance; optionally owns FormulaBar, attached via
                    attachFormulaBar(container)/detachFormulaBar() (the formulaBarContainer
                    constructor option is sugar that calls attachFormulaBar during
                    construction; detaching restores the barless inline-edit
                    subscription); adapters construct one FormulaBuilder, call
                    openEditor/closeEditor, and markCell in their renderer hooks. Its className
                    option is the single theming entry point: it lands on the popup portal, the
                    formula bar container, the editor root, and — via
                    adapter.setOverlayClassName — the adapter's highlight overlay elements
                    (cleared again with null in destroy(), since the adapter outlives the builder).
                    Host-owned elements stay outside the theme scope by design: whole-row/column
                    header tinting (HighlightLayer.renderHeaders inline backgroundColor) and the
                    hfe-cell--error class resolve CSS variables against the host grid's cascade,
                    not the className
formulaEditor/ (facade + controllers)
├── formulaEditor.ts        — FormulaEditor facade: constructs collaborators/controllers,
│                             wires DOM events, exposes public API
├── editorContext.ts        — isFormula(kernel): the module's only runtime export
├── editorEdit.ts           — applyEditorEdit(ctx, highlights, edit): the single programmatic
│                             text-mutation primitive (kernel.replaceRange → kernel caret →
│                             input.setText → input.setCaret → highlights.afterMutation).
│                             Every controller edit (ref insert/clear, suggestion accept,
│                             auto-close paren, unbalanced-paren close, newline, F4 cycle)
│                             goes through it — never hand-roll the sync ritual, or the
│                             kernel and textarea desync silently
├── types.ts                — EditorContext record shared by all controllers, plus
│                             FormulaEditorOptions/FormulaEditorEvents; CommandId, ContextFlag,
│                             KeyContext, Combo, Binding
├── highlightController.ts  — HighlightController: overlay rendering + adapter highlights
├── refController.ts        — RefController: ref-insertion state machine
├── popupController.ts        — PopupController: suggestions popup + fn-help lifecycle + textarea
│                             ARIA mirroring (applySuggestionsAria / applyFnHelpAria)
├── keyboardController.ts   — KeyboardController: keydown dispatch (delegates to ShortcutManager)
├── shortcutManager.ts      — ShortcutManager: declarative keybinding dispatch (ordered binding
│                             table + command map; pure, DOM-free)
├── keymap.ts               — BINDINGS: the declarative key-combo → command table (data only)
├── pointModeController.ts  — PointModeController: arrow-key reference point-mode state machine
├── editorSizeController.ts — EditorSizeController: caps the editor's max-width AND max-height at
│                             the nearest clipping ancestor's client edges (overflow ≠ visible walk
│                             from the editor root), so a long formula soft-wraps
│                             at the grid's right edge and, when it hits the bottom edge, the editor
│                             stops growing and scrolls internally (hfe-editor--height-capped —
│                             applied only when content actually overflows the cap — sets
│                             overflow-y: scroll on BOTH the textarea and the overlay so both
│                             reserve an identical scrollbar gutter and wrap at the same width;
│                             a gutter on only one layer shifts its wrap points and desyncs the
│                             caret from the colored text. ScrollAnchor mirrors textarea scroll
│                             onto the overlay). The overlay gets a padding-bottom mirror of the
│                             textarea's scrollHeight because Chrome gives the textarea a phantom
│                             caret line when text ends exactly at a wrap boundary — without it the
│                             two layers' scroll ranges diverge. Recomputes on input, attachTo,
│                             ancestor scroll, and window resize; no clipping ancestor → falls
│                             back to the viewport (documentElement client box at 0,0) as the
│                             clip, so hosts without an overflow wrapper still get both caps.
│                             The height cap never exceeds the clip's clientHeight: once an
│                             ancestor scrolls the editor's top above the clip, the rect-based
│                             distance to the clip bottom grows by the scroll, and the clamp
│                             keeps that from growing the editor.
│                             A host may tighten the width cap below the clip edge by setting the
│                             --hfe-editor-max-width CSS variable on the editor's mount (the
│                             external Handsontable formulaBuilder plugin sets it in its
│                             formulaCellEditor's refreshDimensions
│                             — applyContentEdgeWidth — to the distance from the edited cell to the
│                             master scroll holder's content edge (read via
│                             hot.view.getOverlayByName("top").holder), so a right-edge cell wraps at the
│                             true grid edge instead of HOT's wider outer wrapper; the js basic
│                             demo sets it to its panel's content width so the resize grip can't
│                             drag the editor past the panel). The width FLOOR is
│                             --hfe-editor-min-width (editor.scss min-width, default 100% of the
│                             mount — grid cells keep cell-width parity; a standalone host may
│                             lower it so the resize grip can shrink the editor below the mount).
│                             Height is host-configurable in line units:
│                             --hfe-editor-min-lines (opening height + native-resize floor; min IS
│                             the default) and --hfe-editor-max-lines (growth + drag ceiling,
│                             intersected with the clip cap), both resolved as
│                             lines × line-height + the textarea's computed vertical padding —
│                             line-height comes from the textarea too (probe-measured when
│                             "normal", root fallback), so adapter overrides count; min-height
│                             is written as max(100%, Npx), keeping the stylesheet's mount-parity
│                             floor so min-lines never shrinks the editor below its host cell;
│                             the Npx term is clamped to the available height (clip ∩ max-lines)
│                             so min-height can't beat max-height and overflow the clip.
│                             Unparseable lines value → off.
│                             --hfe-editor-resize: vertical enables the browser-native resize grip
│                             on the editor root (resize: var(--hfe-editor-resize, none) +
│                             overflow: hidden); a ResizeObserver on the root routes manual drags
│                             through update(), where a browser-written inline height drives the
│                             overlay cap + height-capped class. attachTo calls resetManualSize()
│                             (clears the browser-written inline size), so every reopen renders
│                             content-sized within the clamps.
│                             Wrap parity relies on textarea wrap="soft" + the shared
│                             white-space: pre-wrap / word-break: break-all block in editor.scss
│                             applied identically to the input and the overlay
└── scrollAnchor.ts         — ScrollAnchor: textarea scroll sync + ancestor-scroll reanchor
FormulaBar (formulaBar/)
├── formulaBar.ts           — FormulaBar: bar mount; composes FormulaBarAddressBox +
│                             FormulaBarCell; drives the shared FormulaEditor between bar and
│                             inline cell via the IGridAdapter bar-lifecycle methods (see
│                             host-switch model above)
├── formulaBarAddressBox.ts — FormulaBarAddressBox: own-root jump-to-cell input
│                             (AddressBoxTarget {col,row}); Enter commits via onNavigate,
│                             Escape/blur reverts to the last-synced address
└── formulaBarCell.ts       — FormulaBarCell: own-root fx icon + idle colored-formula view
                              (own VisualOverlay) + the overlayMount the shared editor
                              attaches into while bar-hosted
Kernel (kernel/)
├── kernel.ts           — tokenizes text, maintains state, emits events
├── stateManager.ts     — holds current text + tokens + cursor position
├── eventBus.ts         — typed publish/subscribe bus (KernelEventMap)
├── commentTransform.ts — commentsToN / nToComments boundary
└── types.ts            — FormulaState, CursorPosition, KernelEventMap
Lexer (lexer/)
├── lexer.ts            — hand-written stateless scanner; tokenizes partial/invalid input live;
│                         locale-configurable separators (decimal/arg/array)
├── tokens.ts           — TokenType + colLettersToIndex/indexToColLetters
├── types.ts            — Token + ref/comment/named-expr meta interfaces, LexerOptions
├── matchers.ts         — per-token-kind match helpers used by the scanner loop
├── patterns.ts         — shared regex fragments
└── additiveContext.ts  — marks each COMMENT token contextOk (legal + N(...) slot) for the
                          comments boundary
EngineBridge (engine/)
├── engineBridge.ts          — EngineBridge facade: separators, config reads, sheet-boundary
│                              queries (isOwnSheet / expandWholeRange); delegates the function
│                              catalog to FunctionCatalog and named-expression resolution to
│                              NamedExpressions. The ONLY HyperFormula access point outside
│                              src/engine/ (composed across these engine/ files)
├── functionCatalog.ts       — FunctionCatalog (internal): catalog build, signatures, filtering;
│                              owns the module-level catalog/canonical caches
├── namedExpressions.ts      — NamedExpressions (internal): named-expression scope resolution,
│                              formatNamedRange, filtering
├── namedExpr.ts             — whole-range span math + annotateNamedExprs token annotation
├── namedExprName.ts         — validateNamedExprName
├── readCellText.ts          — readCellText(engine, addr): formula → serialized → value fallback
│                              shared by adapters and demo hosts
└── types.ts                 — shared engine types: FunctionParam/FunctionSignature/
                               FunctionCatalogEntry, HyperFormulaLike, NamedExprResolution,
                               CellTextSource/EngineCellAddress
IGridAdapter (adapter/)
├── types.ts             — the IGridAdapter contract, composed of three required role interfaces
│                          plus one optional one, that mirror the core consumers: GridPickSurface
│                          (coord lookup, ref formatting, highlights, cell-pick events,
│                          onOutsideCellClick, the outsideClickCommitMode capability,
│                          setOverlayClassName, ref-selection mode — driven by FormulaEditor +
│                          HighlightController), GridNavigation (getGridSize, getDataEdge,
│                          stepCell, scrollCellIntoView — driven by PointModeController;
│                          move/jump scroll the viewport so the point-mode cursor stays visible —
│                          the point-mode anchor comes from the edit-lifecycle getActiveCell),
│                          GridEditLifecycle (the bar/edit lifecycle — driven by FormulaBar and
│                          the barless inline-edit subscription), GridHeaderPickSurface
│                          (onHeaderPick(callback): Unsubscribe, emitting HeaderPick {axis,
│                          sheet, start, end, append} with start/end in HF/engine-space indices
│                          — driven by header click/drag on the grid's row/column headers).
│                          GridHeaderPickSurface is optional: IGridAdapter and EditorGridAdapter
│                          both mix it in as Partial<GridHeaderPickSurface>, so adapters without
│                          headers (NullAdapter included) implement nothing for it — no no-op
│                          method needed. FormulaEditor.wireAdapter subscribes defensively via
│                          `adapter.onHeaderPick?.(...)`, formatting the pick with
│                          formatWholeRef(pick) (adapter/refFormat.ts, A:C / 4:4 shape) before
│                          inserting; expandHeaderSpan(pick, size) (adapter/range.ts) turns a
│                          HeaderPick into the equivalent CellRange for highlighting. Adapters
│                          that do implement it must never intercept a header interaction that
│                          is ineligible (outside ref-selection mode, or drag/click not aimed at
│                          a real header) — no preventDefault, no synthetic emit; host-native
│                          behavior runs unmodified. Implemented by the external Handsontable
│                          formulaBuilder plugin, which covers both axes via its
│                          CellPickController, and by the four example adapters maintained
│                          outside this repository: AG Grid (column-only, dual path — DomRangePicker for
│                          bar-hosted editing, plus an inline-edit interceptor feeding an
│                          adapter-owned HeaderDragTracker; ineligible/unresolvable header
│                          clicks stay swallowed dead, a deliberate exception protecting
│                          against mid-edit sorting); MUI (column-only, direct DOM mousedown on
│                          the header cell plus an apiRef columnHeaderOver extension — no
│                          columnHeaderMouseDown apiRef event exists); plain-table and TanStack
│                          (both axes, via DomRangePicker, riding HeaderDragTracker
│                          transitively). IGridAdapter extends all four and adds
│                          destroy() (host-owned lifecycle, never called by core);
│                          EditorGridAdapter = GridPickSurface & GridNavigation &
│                          Pick<GridEditLifecycle, "getActiveCell"> &
│                          Partial<GridHeaderPickSurface> — the slice FormulaEditorOptions.adapter
│                          and EditorContext.adapter are typed against (FormulaBar/FormulaBuilder
│                          take the full IGridAdapter); also GridGeometry, RangeRect
├── nullAdapter.ts      — no-op implementation FormulaBuilder falls back to when constructed
│                         without an adapter; also the base class for basic adapters
│                         (the plain-table example's PlainTableAdapter extends it)
├── cell.ts             — parseCellInput / formatCellValue / stepCell (single-step clamped move)
│                         / findDataEdge (data-aware boundary walk shared by every adapter's
│                         getDataEdge; the caller supplies a hasData predicate in its own
│                         coordinate space)
├── range.ts            — CellRange helpers, expandWholeRange, expandHeaderSpan
├── geometry.ts         — coordinate math
├── refFormat.ts        — A1-notation formatting, formatWholeRef
├── refAbsolute.ts      — cycleRefAbsolute: F4-style $-anchoring cycle on the ref under the caret
├── domRangePicker.ts   — DOM-based range selection helper; owns the DOM event wiring
│                         (mousedown/mousemove/mouseup/blur) and eligibility gating, delegating
│                         the drag state machine to RangeDragTracker (scroll element defaults
│                         to the nearest scrollable ancestor of the root, overridable via
│                         getScrollElement)
├── rangeDragTracker.ts — RangeDragTracker: shared drag-pick state machine (anchor/last/append
│                         state, preview on extend, single-cell vs range drop decision, edge
│                         autoscroll integration); input-source agnostic — DomRangePicker feeds
│                         it DOM events, adapter-level pickers (AG Grid's in-edit picks, the
│                         external Handsontable plugin's CellPickController) feed it their own
│                         events; callers render previews and route drops via its callbacks
├── headerDragTracker.ts — HeaderDragTracker: shared header-drag state machine, the
│                         RangeDragTracker pattern applied to whole-row/column picking
│                         (anchor/last/append, same-axis latch, normalize lo:hi on drop; options
│                         sheet/onPreview/onDrop/onDragEnd); input-source agnostic — DomRangePicker
│                         consumes it internally (behavior unchanged from before the extraction),
│                         the AG Grid adapter's header interceptor and the external Handsontable
│                         plugin's CellPickController each feed it their own events
├── trailingClickSwallow.ts — armTrailingClickSwallow(document, shouldSwallow): one-shot
│                         document-capture click swallow armed after a routed header pick, so the
│                         gesture's trailing click never reaches host sort/filter handlers;
│                         self-removes on the next click OR mousedown (a stale arm from a drag
│                         whose click never fired dies on the next gesture instead of eating it);
│                         consumed by DomRangePicker, MUI RefPickController, and the external
│                         Handsontable plugin's CellPickController
├── edgeAutoScroller.ts — EdgeAutoScroller: shared drag-past-edge autoscroll primitive
│                         (overshoot → clamped scroll steps on rAF + onStep callback with the
│                         pointer clamped to the scroll element's client box); driven by
│                         RangeDragTracker
└── pickEmitter.ts      — cell/range/header pick event wiring
UI (ui/) — split by concern: popup/, text/, caret/, highlight/, plus shared dom.ts, icons.ts
├── dom.ts                — createEl / clear / ensureRelativePosition helpers (shared primitive);
│                           createIcon builds a glyph from a host IconsOptions factory or,
│                           failing that, from the built-in SVG data via createSvgIcon
│                           (createElementNS — no HTML sink)
├── focusTrap.ts          — FocusTrap: reusable focus-scope primitive (focusable discovery via
│                           generic selector, focusFirst, focusNext with Tab/Shift+Tab wrap,
│                           exit-key callback — default exit key is Escape, hosts override via
│                           exitKeys (fn-help passes ["F6"] only — Escape inside the popup now
│                           closes it instead of just exiting the trap, so it is handled by the
│                           popup's own keydown listener, not the trap) — hasFocus); owns no
│                           listeners — the host registers
│                           keydown and delegates to interceptKeydown (used by
│                           FunctionHelpPopup's F6 scope)
├── icons.ts              — SVG icon data shared by popups and FormulaBarCell's fx icon,
│                           keyed by IconName in BUILT_IN_ICONS
├── types.ts              — IconName, IconsOptions (public: the `icons` option)
├── popup/
│   ├── basePopup.ts        — base class for all popup-style overlays; self-appends root to container
│   ├── suggestionsPopup.ts — suggestions dropdown (extends BasePopup)
│   ├── functionHelpPopup.ts — function signature popup, non-modal dialog (extends BasePopup); also exports
│   │                         FunctionHelpPopupOptions (single-consumer, inlined here)
│   ├── errorPopup.ts       — error tooltip (extends BasePopup); lifecycle owned by FormulaBuilder;
│   │                         also exports ErrorPopupOptions (single-consumer, inlined here)
│   ├── cellError.ts        — cellErrorMessage / setCellError adapter-facing cell-marking utils
│   ├── popupContext.ts     — PopupContext class; owns the shared <div> portal that all
│   │                         popups for one adapter instance are appended to; constructed
│   │                         and owned exclusively by FormulaBuilder, not part of the
│   │                         package's public surface
│   ├── positionStrategy.ts — BottomViewportAnchoredStrategy / EndViewportAnchoredStrategy; viewport-absolute coords
│   ├── popupsOptions.ts    — withSharedClose(): consumer-facing popup options resolution
│   └── types.ts            — shared popup types: AnchorRect, Position, Viewport, PositionStrategy,
│                             SuggestionItem, SuggestionsHandlers, SuggestionsAriaState,
│                             SuggestionsOptions, FunctionHelpOptions, ErrorOptions, PopupsOptions
├── text/
│   ├── richInput.ts      — <textarea> wrapper; emits input/caretmove/focus/keydown
│   ├── visualOverlay.ts  — syntax-coloring layer rendered on top of the textarea
│   └── decorations.ts    — maps token list → per-character CSS class spans
├── caret/
│   └── tokenContext.ts   — pure token walkers: currentFunctionPrefix / activeCallContext
│                           (free functions, DOM-free, Node-testable)
└── highlight/
    └── highlightLayer.ts — range-highlight DOM layer (consumed by adapters + DomRangePicker)
Events (events/)
├── eventManager.ts     — EventManager + EventScope: DOM listener lifecycle, conflict policy
├── listenerSet.ts      — ListenerSet<Args>: generic add/emit/clear listener registry used by
│                         PickEmitter and the adapter bar-lifecycle events
└── types.ts            — Disposable, ScopePolicy, DomEventOptions
Theme (theme/)
├── classNames.ts       — CN + TOKEN_CN class-name tables (hfe- BEM prefix)
├── cssText.ts          — GENERATED (repo-root scripts/generateCssText.mjs, committed): compiled
│                         stylesheet as a string; regenerate via build:styles after any
│                         src/styles/*.scss change
├── injectStyles.ts     — createStyleInjector(marker, cssText): ref-counted <style [marker]>
│                         head injection, SSR-guarded; injectStyles()/releaseStyles() wrap the
│                         core instance (data-hfe-styles). Constructors inject, destroy()
│                         releases, the tag is removed when the last instance dies; consumers
│                         never import CSS (no hyperformula-ui/styles export). Adapters reuse
│                         createStyleInjector for their own generated cssText.ts
└── refPalette.ts       — REF_PALETTE + assignRefIndex/paletteColorForIndex ref coloring
Styles (styles/)
└── *.scss              — SCSS sources (tokens, editor, overlay, ref-mark, highlight, popup,
                          suggestions, fn-help, error, formula-bar); compiled by build:styles
                          into the committed theme/cssText.ts — never edit cssText.ts by hand
```

### formulaEditor/ dependency direction

Controllers depend only on `EditorContext` (and each other where noted); the facade wires
all DOM events and owns all construction. One exception: `EditorSizeController` takes raw
elements (`rootEl`, `overlayEl`, `inputEl`) plus the `editor-size` scope — not ctx — and is
constructed before the ctx exists. The acyclic order is:

1. `EditorContext` — plain record, no dependencies.
2. `HighlightController(ctx)` — reads tokens/adapter from ctx.
3. `RefController(ctx, highlights)` — delegates overlay updates to HighlightController.
4. `PopupController(ctx, highlights, refs)` — drives popup and fn-help.
5. `PointModeController(ctx, refs, highlights)` — constructed after RefController; depends on
   ctx, refs, and highlights. Manages arrow-key point-mode state.
6. `KeyboardController(ctx, highlights, refs, popupCtrl, point, getValue)` — dispatches keys
   via ShortcutManager; depends on PointModeController.
7. `ScrollAnchor(ctx, reanchor)` — syncs scroll; calls back into the suggestions popup via the
   `reanchor` closure injected by the facade.
8. `FormulaEditor` (facade) — constructs all of the above, calls `wireUi`/`wireAdapter`,
   exposes the public API.

## UI Components — popup hierarchy

All popup-style overlays share a common base class `BasePopup`
(`src/ui/popup/basePopup.ts`). Key facts for AI agents and contributors:

- `BasePopup` constructor appends `this.root` to a container element (default
  `document.body`). Callers never manually append popup roots; constructing the
  object is sufficient.
- `SuggestionsPopup`, `FunctionHelpPopup`, and `ErrorPopup` all extend `BasePopup`.
- **Shared portal:** `PopupContext` (`src/ui/popup/popupContext.ts`) is constructed and owned
  exclusively by `FormulaBuilder` (not public API). Its `<div class="hfe-popup-portal">`
  (`popupCtx.portal`) is the shared DOM parent all three popups append to. All three popups
  take a plain `container: HTMLElement`, not the full `PopupContext` — `FormulaBuilder` passes
  `popupCtx.portal` to each; `popupCtx.destroy()` runs in `FormulaBuilder.destroy()`.
- **Document and portal parent:** `FormulaBuilder`'s `portalParent` option (default
  `rootDocument.body`) is where the portal and the `LiveRegion` go; both are created in the
  parent's own document. A host inside a shadow root passes that shadow root, so the
  textarea's `aria-controls`/`aria-activedescendant` and a cell's `aria-errormessage` resolve
  in one tree, and an axe scan of that root sees the popups. `rootDocument` (default the portal
  parent's document, else the global `document`, so passing only an iframe's `body` is enough) is
  the document selector options are resolved against, the detached mount is created in, and the
  stylesheet goes into. Every other element (editor, popups, icons, highlights) is created in the
  global `document` and adopted when it is appended. Styles are injected per root
  (`createStyleInjector(...).inject(root)`, ref-counted per document or shadow root): into
  `rootDocument`, plus into the portal parent's shadow root when it is in one. Container selectors
  (`formulaBarContainer`, `popups.*.container`, the `attach*` methods) are looked up in that shadow
  root first, then in `rootDocument`. No other shadow root receives the styles, so a popup docked
  in a third tree renders unstyled; hosts dock popups in the grid's own tree. Focus checks
  never read `document.activeElement`: they call `deepActiveElement(element.ownerDocument)`
  (`ui/dom.ts`), which follows open shadow roots down to the focused element and reads the
  document the element is actually in. Window and document listeners follow the element too:
  `viewOf(node)` gives the window of the document a node is in, and the error popup, popup
  viewport sizes, `PopupController`'s fallback clip, and `DomRangePicker` read it instead of the
  global `window`/`document`. The editor's ambient scroll/resize listeners (`ScrollAnchor`,
  `EditorSizeController`) live in an `editor-view` scope that `FormulaEditor.attachTo` rebinds when
  the editor moves into another document or shadow root (`listenToView`). `scroll` is not composed,
  so a scroller inside a shadow root never reaches a window listener: the editor's controllers, the
  error popup and `DomRangePicker` also listen for scroll (capture) on the shadow root their element
  is in. Node checks never use `instanceof`:
  an element from an iframe belongs to another realm and fails `instanceof Element`, so
  `isElement`/`isHTMLElement`/`isNode` (`ui/dom.ts`) test `nodeType`. `DomRangePicker` reads a
  document-level event's cell from `eventOrigin(event)` (the first node of `composedPath()`),
  because a shadow root retargets `event.target` to its host, also listens for scroll on its
  shadow root (scroll is not composed), and hit-tests through the shadow root's own
  `elementFromPoint` (`elementAt`).
- `FormulaBar` constructor signature:
  `(container: HTMLElement, options: { adapter: IGridAdapter; editor: FormulaEditor; knownFunctions: ReadonlySet<string>; className?: string })`.
  It receives the pre-built `FormulaEditor` from `FormulaBuilder` — it does not construct
  its own editor. `knownFunctions` (`FormulaEditor.knownFunctionNames`) seeds `FormulaBarCell`'s
  idle-view `VisualOverlay`.
- **Close button:** `BasePopup` owns close-button construction via a flat `showClose`/
  `onExplicitClose` option, defaulting `showClose` to `false` for every popup — the X is
  opt-in. Each popup has its own small options type (`SuggestionsOptions`,
  `FunctionHelpOptions`, `ErrorOptions`); `FormulaBuilder`'s `popups: PopupsOptions` option
  (`src/ui/popup/popupsOptions.ts`) lets a consumer set one shared `showClose` default with
  per-popup overrides, resolved via `withSharedClose()` before configs reach `FormulaEditor`
  (suggestions, fnHelp) and `ErrorPopup` (error).
- **`ErrorPopup` trigger quirk:** it opens/closes on `mouseover`/`mouseout` AND
  `focusin`/`focusout` of the host grid (keyboard parity for focusable error cells), not
  editor focus. The two triggers are tracked independently (`pointerCell`/`focusCell`,
  null = outside) and the popup closes only when BOTH are gone — so a pointer-leave never closes it
  while the error cell holds focus, and focus movement never closes it while the pointer
  rests on the cell. `handleLeave` also keeps it open when `relatedTarget` is inside the
  popup itself (`this.contains`) — required so the cursor (or Tab) can reach the close
  button without the popup closing mid-transit; the popup root carries its own
  `mouseout`/`focusout` listeners because the portal lives outside the attach container.
- **ARIA wiring:** `SuggestionsPopup` assigns itself a unique listbox id plus per-option ids
  and reports `{expanded, listboxId, activeOptionId}` through
  `SuggestionsHandlers.onAriaStateChange`; `PopupController.applySuggestionsAria` mirrors that
  state onto the textarea as `aria-controls`/`aria-activedescendant` (the static
  `aria-autocomplete="list"` and the input id live in `RichInput`; the facade only forwards the
  callback). `FunctionHelpPopup` reports show/close via `onVisibilityChange` and
  `PopupController.applyFnHelpAria` links it with `aria-describedby`. Its root is a non-modal
  `role="dialog"` labeled `"<NAME> function help"` (not `tooltip` — it holds interactive
  descendants: the opt-in close button and the Learn-more link), carrying
  `aria-keyshortcuts="F6"` to advertise the focus-exit key (SC 2.1.2 requires advising the
  user of a non-standard exit). The scrollable body (`.hfe-fn-help__body`) gets
  `tabindex="0"` whenever it has content, so clipped description text is
  keyboard-scrollable and `focusFirst()` always has a landing spot (SC 2.1.1) — it is the
  first focus stop, before Learn-more and the close button. F6/Shift+F6 from the editor
  move focus into it (`focusFnHelp`/`focusFnHelpBack` commands → `focusFirst()`; only a
  content-free body leaves nothing focusable, making the command return `false` and fall
  through to `toggleEditorHost`/`toggleEditorHostBack` — see below); the focus scope is
  implemented by the reusable
  `FocusTrap` primitive (`ui/focusTrap.ts`) — focusables are discovered by a generic selector
  (`button, a[href], input, …`) in DOM order, not a hardcoded element list, so new interactive
  content joins the cycle automatically; inside, Tab/Shift+Tab wrap through them, and
  F6/Shift+F6 return focus to the textarea via `onFocusReturn` without closing the popup
  (`FocusTrap`'s `exitKeys` are `["F6"]` only — the key-name match ignores shift, so Shift+F6
  exits too). The popup's keydown listener `stopPropagation`s every key while the popup holds
  focus — deliberate: focus in the popup scopes intent to the popup, and a leaked arrow key
  would drive the host grid's document-level shortcut manager mid-read. Browser-native
  behavior (body scrolling, Ctrl+F, native Tab moves) is unaffected — `stopPropagation` only
  silences upstream JS listeners. While `attachToHost` has docked the popup into normal page
  flow, Tab skips the trap's interception (no `preventDefault`), so the native document tab
  order moves focus out — no keyboard trap on the natural tab path. Escape inside the popup is handled separately, by the popup's own keydown
  listener in the same `fn-help-focus` scope (not the trap's exit-key path): it closes the
  popup — `close()` + `onExplicitClose`, identical to the close button — and focus return
  comes free, since `close()` fires `onFocusReturn` whenever the popup held focus at close
  time. From the editor (focus still in the textarea), plain Escape closes fn-help through the
  keymap's `closeFnHelp` command instead (see the Esc ladder under "Data flow" / §7 in
  SPEC.md), one rung before the plain-Escape `cancel` binding. Shift+F6 does not reuse
  `ShortcutManager`'s handler signature for a reverse flag — it binds to dedicated
  `focusFnHelpBack`/`toggleEditorHostBack` commands (registered next to the forward ones in
  `KeyboardController`) that delegate to the same forward logic; today's two focus stops make
  the observable behavior identical to F6, but the direction is now plumbed so a future third
  stop only changes the `*Back` bodies. Closing while the popup holds focus (e.g. Enter on the
  close button) also fires `onFocusReturn`. The editor's blur handler skips its close-popups
  path when `relatedTarget`
  is inside the fn-help popup, so the F6 handoff doesn't dismiss the popup or drop the focused
  state. The complementary leak is plugged by `onFocusLeave`: the popup listens for `focusout`
  on its root and, when focus lands outside both popup and editor (grid or page click), the
  editor runs its full blur path via `handleFocusExit` (`applyFocusState(false)` — clears
  `focused`, closes popups, suppresses highlights — plus the clean bar-hosted cancel:
  `onCancel` and focus restore, same as a direct textarea blur), so the popup can't stay open
  with a stale focused state and a clean bar session can't leak open through it.
  Deliberately absent:
  `role="combobox"`, `aria-expanded`, and `aria-haspopup` — axe's `aria-allowed-attr` forbids
  them on a `<textarea>` (implicit `textbox` role), and adding them drops the Lighthouse
  accessibility score.
- **F6/Shift+F6 host toggle (popup closed):** `formulaEditor/keymap.ts` orders the F6 bindings
  fn-help-first — `{F6, fnHelpOpen} → focusFnHelp`, `{F6+shift, fnHelpOpen} → focusFnHelp`,
  `{F6, always} → toggleEditorHost`, `{F6+shift, always} → toggleEditorHost` — first match
  wins, so popup mode always wins while the popup is open (the host never switches then).
  When the popup is closed (or its `focusFnHelp` returned `false` for lack of a focusable
  element), `toggleEditorHost` asks `HostToggleDelegate.currentHost()` for the opposite host
  and calls `focusHost(host)`, moving the single shared `FormulaEditor` between the inline
  cell and the formula bar (`attachTo` preserves text + caret — same single-editor
  host-switch model as the bar click-to-edit path, §7a below). The delegate
  (`HostToggleDelegate { isAvailable(); currentHost(): EditorHost; focusHost(host) }`,
  `EditorHost = "inline" | "bar"`, both exported from `formulaEditor/types.ts` and the
  package barrel) is registered via `FormulaEditor.setHostToggleDelegate(delegate)`; `FormulaBar`
  registers its delegate after its subscriptions are wired in the constructor and clears it
  (`setHostToggleDelegate(null)`) first in `destroy()`. With no bar attached (or no active bar edit session), F6/Shift+F6 are
  not consumed — no `preventDefault`, browser default runs. `functionHelpPopup.ts` and
  `focusTrap.ts` are unchanged by this toggle.
- **Positioning:** `PositionStrategy` (`src/ui/popup/positionStrategy.ts`) —
  `BottomViewportAnchoredStrategy` (suggestions, fn-help) vs `EndViewportAnchoredStrategy`
  (error). Anchor coords are always viewport-absolute (`getBoundingClientRect()`), never
  page-absolute. Z-index is CSS-owned (`--hfe-z-index-popup`), not JS-managed.
- **RTL/LTR (`direction` option):** construction-only, `FormulaEditorOptions.direction?:
  LayoutDirection` (`"ltr" | "rtl"`, default `"ltr"`). Layout mirrors; formula text stays LTR.
  `FormulaEditor` sets `dir="rtl"` on `rootEl` only when `direction === "rtl"`; the two content
  layers (`RichInput`'s textarea, `VisualOverlay`'s root) are hardcoded `dir="ltr"` always, so
  function names/A1 refs/operators never reorder — `.hfe-editor[dir="rtl"]` right-aligns them
  with `text-align: right` instead. `FormulaBar` mirrors the same way: `dir="rtl"` on its
  container reorders the address box/fx-icon/formula-cell parts. `PopupController` builds
  `AnchorRect.direction` from `ctx.opts.direction ?? "ltr"`; `BottomViewportAnchoredStrategy`
  and `EndViewportAnchoredStrategy` both branch on it to anchor from the right edge /
  flip open-side in RTL instead of the left/right defaults. Direction is a core option only —
  `IGridAdapter` has no direction concept; it is never read from or reported by the grid.
- **Docked popup hosts:** `BasePopup.attachToHost(container, themeClassName?)` re-parents
  `this.root` into `container`, adds `hfe-popup--hosted` (`CN.popupHosted`; CSS
  `position: static; width: 100%; max-height: none`) plus the theme class (the builder
  `className` normally scoped on the portal — `FormulaEditor` pass-throughs forward
  `opts.className`; removed again on detach), and renders statically — no `PositionStrategy`, `reposition()` a no-op —
  with no close button regardless of `showClose` (explicit-close suppression is unreachable
  while docked; intended). `detachFromHost()` closes an open popup and returns the root to its
  constructor container (the shared portal); the next controller pass re-shows it floating.
  `isAttachedToHost` reports current state. `PopupController.anchorAt(skipClip)` skips the
  scroll-clip hiding check per docked popup — suggestions and fn-help are checked
  independently, and suggestions that lose their anchor to the clip fall through to the
  fn-help path instead of returning early (a docked fn-help still shows). `FormulaEditor` exposes plain pass-throughs
  (`attachSuggestionsHost`/`detachSuggestionsHost`/`attachFnHelpHost`/`detachFnHelpHost`, all
  `HTMLElement`); `FormulaBuilder` re-exposes the same four names accepting `HTMLElement |
  string` (selector via `document.querySelector`, throwing on a miss) plus
  `popups.suggestions.container`/`popups.fnHelp.container` constructor sugar
  (`PopupHostOption`) that delegates to attach after construction — mirroring
  `formulaBarContainer`/`attachFormulaBar`. The constructor never throws on a selector:
  one that matches nothing, or is not valid CSS, logs a `console.warn` once per message and falls back to the
  default placement (a floating popup, no bar), because a host that rebuilds the builder
  from an event handler may pass a container its framework unmounted in between, and a
  throw there would leave the host without a builder. The `attach*` methods still throw on
  a miss: the host calls them directly and can handle the error.

### BasePopup lifecycle invariants

Understanding the DOM lifecycle is critical before subclassing `BasePopup`:

- `open()` calls `clear(root)` **before** `renderContent()` — so re-opening is safe and
  never duplicates content.
- `close()` also calls `clear(root)` — removing **all** child nodes from `this.root`.
- `onVisibilityChanged(visible: boolean): void` is a **protected hook**, no-op by default,
  fired only on real transitions: after `open()` when the popup was not previously visible,
  and at the end of `close()` when it was. Subclasses override it for visibility side
  effects (SuggestionsPopup re-emits ARIA state on hide, FunctionHelpPopup forwards to its
  `onVisibilityChange` option, ErrorPopup clears `activeCell` + its aria-errormessage link —
  deliberately NOT its `pointerCell`/`focusCell` tracking, which mirrors physical pointer/focus
  position and is owned by the enter/leave handlers) instead of overriding `close()` —
  `open()`/`close()` overrides that duplicate the `wasVisible` bookkeeping are the historical
  pattern this hook replaced.
- `onExplicitClosed(): void` is a second **protected hook** and the single dispatch point for
  user-initiated dismissal (close button, FunctionHelpPopup's Escape). The base impl invokes
  the `onExplicitClose` constructor callback; subclasses override to add cleanup (ErrorPopup
  resets `pointerCell`/`focusCell`, since a hidden popup emits no leave events to do it).
  Hiding a focused close button can fire a sync `focusout` mid-`close()`; ErrorPopup's
  `handleLeave` re-anchors only while `isVisible()` so that reentrant event cannot re-open.
- Any DOM appended inside `renderContent()` is **transient** — it is cleared on every
  `close()` and re-rendered on every `open()`.
- Constructor-time DOM (appended to `this.root` before the first `open()`) is **also
  cleared** on the first `close()`. Subclasses must inject all per-open DOM inside
  `renderContent()`; the close button is the one exception — `BasePopup.open()` re-appends
  it itself after each render.

## Data flow on each keystroke

1. User types → `RichInput` emits `input(text, caretOffset)`.
2. `FormulaEditor.wireUi` calls `Kernel.applyEdit(text, cursor)`.
3. `Kernel` runs the `Lexer`, optionally post-processes tokens (named-expr annotation via
   `kernel.tokenPostProcess`), stores the result, and emits `tokenize` + `change` on `EventBus`.
3a. `syncFormulaClass` toggles `CN.editorFormula` (`hfe-editor--formula`) on `rootEl` from
   `isFormula(kernel)`; `editor.scss` scopes `--hfe-formula-font-family` to that class only,
   so plain values keep the grid font. `FormulaBarCell.renderValue` mirrors the same class
   toggle on its idle element (`formula-bar.scss`).
4. `wireUi` calls `HighlightController.renderOverlay()`:
   `computeDecorations(tokens, caret)` → `VisualOverlay.render(tokens, text, decorations)`.
5. `wireUi` calls `HighlightController.pushHighlights()`:
   reads tokens → builds `RangeHighlight[]` → `adapter.setHighlights(items)`. Refs whose sheet
   prefix fails `EngineBridge.isOwnSheet` are skipped here (one adapter = one grid), while
   step 4 still colors them in the overlay — deliberate, see SPEC.md §6.
6. `wireUi` calls `PopupController.maybeShowPopup()`:
   checks caret context via `currentFunctionPrefix`/`activeCallContext` (`ui/caret/tokenContext.ts`) → shows `SuggestionsPopup` or `FunctionHelpPopup`.

## The commentsToN / nToComments boundary

Formulas can contain inline comments (`// my note`) for human readability, but `//` is not
valid formula syntax. The editor uses an internal representation (`//`) and a storage
representation (`+ N("my note")`), which evaluates to 0 in HyperFormula — a no-op addend.

- **`nToComments(src, lexerOptions?)`** — storage → internal. Called in `FormulaEditor.setValue`.
  Converts `+ N("text")` → `// text` only when the N() call is in a safe additive position.
  Non-formula text (no leading `=`) passes through untouched.
- **`commentsToN(src, lexerOptions?)`** — internal → storage. Called in `FormulaEditor.getValue`.
  Converts `// text` → `+ N("text")` only when the comment has a valid additive context.

Both take an optional `Partial<LexerOptions>` so locale separators (a `;` arg separator, a `,`
decimal) tokenize identically to the kernel's lexer — `FormulaEditor` and `FormulaBarCell`
pass `EngineBridge.getSeparators()`. Quotes and backslashes inside `N("…")` are escaped with a
backslash (`\"`, `\\`) — HyperFormula's string grammar (`"[^"\\]*(?:\\.[^"\\]*)*"`; HF does NOT
accept Excel-style doubled `""`). The lexer's `RE_STRING` uses the same grammar. `nToComments`
unescapes only `\"` and `\\`; other backslash pairs pass through verbatim.

**Invariant:** `setValue` must always call `nToComments` on its input.
`getValue` must always call `commentsToN` on the kernel state text.
Both must receive the engine's separators when a non-default locale is configured.
Bypassing either function corrupts the cell value stored in the host grid.

Relevant file: `packages/core/src/kernel/commentTransform.ts`

## Error display policy

`FormulaEditor` never shows errors while the user is typing. `FormulaBuilder` (the core
master class) owns the error popup lifecycle: it creates `PopupContext` and `ErrorPopup`
internally and attaches hover listeners to the grid root element.

Cell error marking — calling `builder.markCell(cellEl, value)` — is done by adapters
inside their host-specific renderers, because each host renders cells differently:

- External Handsontable `formulaBuilder` plugin: `FormulaBuilderPlugin.onAfterRenderer`
  (handsontable repo)
- Plain table: the host's own `renderCell` (the plain table has no host library, so its grid
  scaffolding is example code — see "Adapter scope" below)

The error tooltip itself is Esc-dismissible: `ErrorPopup` owns a window-level `keydown`
(capture) listener, registered while attached; it consumes Escape only while the tooltip is
visible AND no builder surface holds focus (`builderSurfaceHasFocus()` —
the deep active element inside a `.hfe-editor`, `.hfe-fn-help`, or `.hfe-formula-bar` root;
the fn-help dialog's own Escape handler and the address box's Escape-revert must win the
same way the editor's ladder does), acted on in `attach()`'s
scope alongside its existing scroll listener — no adapter or
`IGridAdapter` involvement. Escape closes the popup and records `suppressedCell = activeCell`,
so the tooltip does not immediately reopen while the pointer/focus still rest on that cell; the
listener only `stopPropagation`s when it actually consumed the key, leaving the grid's own
Escape behavior untouched otherwise. The Esc-close path runs through `onVisibilityChanged(false)`,
which clears only `activeCell` — `pointerCell`/`focusCell` survive it (they mirror physical
pointer/focus position, which Esc does not move), which is what lets `suppressedStillHeld`
keep suppression while pointer or focus still rest on the dismissed cell; were they cleared,
the next unrelated `focusout` would fall through `handleLeave` and drop `suppressedCell`,
letting an in-cell `mouseover` reopen the dismissed tooltip (a 1.4.13 violation). Suppression
clears only once both pointer and focus have left the cell (`handleLeave`), or on
`detach()` — so re-entering the cell after leaving shows the tooltip again; re-entering the
suppressed cell while the tooltip shows a DIFFERENT cell's error closes that stale tooltip
instead of leaving it anchored to the other cell (`handleEnter`'s suppressed branch). Because this
listener sits at the window in capture phase, it would otherwise consume Escape before the
editor's keymap or the fn-help focus scope sees it — the focused-surface skip exists
precisely so a tooltip raised by a pointer resting on an error cell never outranks the
focused editor's Esc ladder (suggestions → fn-help → cancel) or the focused fn-help dialog's
own Escape handler; the tooltip extends that ladder only while the grid owns focus.

Suppression is keyed by DOM-node identity (`suppressedCell`), not by logical cell address. A
virtualized host (e.g. Handsontable) that recreates the cell's DOM element on scroll or
re-render clears that identity, so a re-render after Esc-dismiss can make the tooltip reopen
even though pointer/focus never logically left the cell. Accepted as a documented limitation;
re-keying by logical cell would need a host render hook — future work if it bites.

`markCell` does not write `aria-description`: the host owns the cell's accessible
description and its accessibility settings, so it adds the error message itself (the external
Handsontable plugin writes it from `data-hfe-error`, only under its `ariaTags` setting, and keeps
an application's own description). A package-side write would override both.

While a hovered/focused error cell surfaces its message via `ErrorPopup` and
`aria-invalid`/`aria-errormessage` (the popup root carries a generated id, associated onto the
cell for the screen reader to resolve on demand), committing a formula moves focus away before
that association is useful — the primary a11y gap this closes is the commit itself, not
revisiting the cell later. `FormulaBuilder` owns a `LiveRegion` (`aria-live="polite"`) and wraps
`commitHandler`: it captures `adapter.getActiveCell()` before the write, runs the commit inside
`EngineBridge.captureValueChanges` (subscribes to the engine's `valuesUpdated` for the duration
of the call only, so nothing outside a commit — recalcs, host edits, renders — can ever trigger
an announcement), then calls `announceCommitErrors`. That reads the committed cell's value via
`EngineBridge.getCellValue` (reliable even when the value did not change) for its own error
message, and counts dependent cells turned to errors from the captured changes (excluding the
committed cell itself) for a "N more cells now contain errors" suffix — never enumerated, just
a count. See the `IGridAdapter` bar-lifecycle section above for the commit-synchronicity
contract this relies on.

## Outside-click commit policy

While the editor is open, a mousedown on a grid cell either picks a reference or commits —
decided by `FormulaEditor.isRefSelectionActive()` (ref insertion not disabled via
`setRefActive(false)`, and caret after a ref opener, a pending ref at the caret, or the caret
inside a cell or range reference, which the pick then replaces — a deactivated editor treats
every cell click as a commit, never a dead pick). `FormulaEditor.enterRefSelectionMode()` is the single wiring point: it
calls `adapter.enterRefSelectionMode(resolveColor, isPickEligible)` with both callbacks
derived from the editor, and every entry path (`FormulaBuilder.openEditor`,
`FormulaBar.handleInlineEditStart`) goes through it. When the predicate is false,
DOM-picker adapters emit `onOutsideCellClick(address)`; `FormulaBuilder` responds by closing
unbalanced parens, suppressing grid highlights (`FormulaEditor.suppressHighlights`, the same
suppress keyboard commit performs before its `onCommit`), then routing the editor value
through its resolved commit handler (the consumer's `onCommit` when supplied, else
`adapter.commit`) followed by `adapter.setActiveCell(address)`. Which side commits is declared
by `GridPickSurface.outsideClickCommitMode`: `"emitted"` adapters emit the event and core
commits; `"native"` adapters never emit and `FormulaBuilder` skips the subscription. No
in-repo adapter is `"native"` — the mode is exercised by the external Handsontable
`formulaBuilder` plugin (handsontable repo): its pick controller simply stops suppressing the
native mousedown, and HOT's editor manager commits and selects the clicked cell itself.

## Adapter scope

An adapter's scope tracks its host library's capability — it delivers as much as the host
delivers, no more. The adapters below are examples maintained outside this repository; the only
adapter in it is `NullAdapter`, and Handsontable ships its own as the `formulaBuilder` plugin.

- **plain-table example** — host is a raw `<table>`, no library. The adapter is **basic**: it bridges
  any plain `<table>` via native DOM geometry (`rowIndex`/`cellIndex`, no `data-*` markup
  required) and carries the bar-lifecycle callback bridge (`PlainTableAdapterOptions.host`,
  typed `PlainTableHost`) — when a host is injected, the thirteen bar-lifecycle methods delegate
  to it instead of the inherited `NullAdapter` no-ops; without one they stay no-ops. The grid
  scaffolding itself (render/model/edit/select) is still example code, not adapter logic.
- **TanStack / AG Grid / MUI DataGrid examples** — hosts are full grid libraries. These adapters are **rich**:
  they cover the library's features (frozen panes, virtualization, selection, hooks). Their
  controller/plugin/hook code is the library bridge and belongs in the adapter, not in the
  host's example code.

Rule of thumb for new code: if it is generic spreadsheet scaffolding the host library does not
provide, it is demo/example code, not adapter code.

## Adding a new public API

Before adding a method to a concrete adapter only, ask: should all adapters support this?
If yes:
1. Add the method signature to `packages/core/src/adapter/types.ts`.
2. Add a no-op implementation to `packages/core/src/adapter/nullAdapter.ts`.
3. Implement it in the Handsontable plugin and the example adapters outside this repository.
4. Typecheck each of them against the new core — TypeScript flags any adapter that missed the method.

## EventManager — DOM listener lifecycle

`packages/core/src/events/` provides `EventManager` and `EventScope`. Each lifecycle owner
constructs its own `private readonly events = new EventManager()` — there is no global
instance. Owners call `events.disposeAll()` in their teardown.

### Scope list

| Scope name       | Owner                                          | Lifecycle                        |
|------------------|------------------------------------------------|----------------------------------|
| `editor-input`   | `FormulaEditor`                                | active while editor is mounted   |
| `popup-anchor`   | `FormulaEditor`                                | active while popup is anchored   |
| `editor-size`    | `FormulaEditor` (drives `EditorSizeController`) | active while editor is mounted (window scroll/resize for height cap) |
| `editor-guard`   | `FormulaBar`                         | keeps bar keystrokes out of the grid |
| `address-box`    | `FormulaBarAddressBox`                         | own-root lifetime (bar lifetime) |
| `formula-cell`   | `FormulaBarCell`                               | own-root lifetime (bar lifetime) |
| `cell-editor-guard` | external HOT plugin `formulaCellEditor.ts`  | active while the inline cell editor is open |
| `subscriptions`  | `FormulaBuilder` / `FormulaBar`                | adapter callback teardown, owner lifetime |
| `inline-edit`    | `FormulaBuilder`                               | barless inline start/close subscription; disposed while a formula bar is attached |
| `range-pick`     | `DomRangePicker` (plain-table + TanStack examples) | persistent for adapter lifetime  |
| `host-bindings`  | plain-table / TanStack examples (+ external HOT `FormulaBuilderPlugin`) | active for adapter lifetime      |
| `popup-static`   | `BasePopup` (suggestions / fnHelp / error)     | root + close button, popup lifetime |
| `fn-help-focus`  | `FunctionHelpPopup`                            | root keydown (F6/Escape/Tab focus scope), popup lifetime |
| `popup-render`   | `BasePopup`                                    | recreated each `open`, disposed on `close` |
| `error-host`     | `ErrorPopup`                                   | active while attached to a host container |

### Separation from EventBus and PickEmitter

- **`EventBus`** (`kernel/eventBus.ts`) — DOM-free typed pub/sub for kernel state events
  (`change`, `tokenize`, `caretmove`, `focus`, `popup:close`). Lives entirely in the Kernel
  with no DOM dependency.
- **`PickEmitter`** (`adapter/pickEmitter.ts`) — cell/range/header pick channel between the
  adapter and the editor.
- **`EventManager`** — DOM listener lifecycle + conflict policy only. It does not replace
  EventBus or PickEmitter.

### Key rules

1. **Capture-flag symmetry** — `removeEventListener` requires the same capture flag as
   `addEventListener`. Each `DomRegistration` stores the resolved `capture` value and passes it
   to both calls; never unbind a listener by guessing the flag.
2. **Non-DOM teardown via `scope.add(disposable)`** — pending `requestAnimationFrame` handles,
   `ResizeObserver.disconnect`, HT hook removal, and similar non-DOM resources register their
   `{ dispose() }` object via `scope.add()` so they are torn down with the scope.
3. **`exactOptionalPropertyTypes` is ON** — build `AddEventListenerOptions` objects
   conditionally; never spread `{ passive: undefined }` into them.

### Reparent invariant

`FormulaEditor.attachTo(container)` moves the editor's root element via
`container.appendChild(this.rootEl)`. Moving an existing node preserves all DOM listeners
bound to it, so the `editor-input` scope survives reparenting between the inline cell and the
formula bar with no rebind. This relies on `attachTo` continuing to **move** the node rather
than destroy and recreate it. If a future change recreated the node, the `editor-input` scope
would need an explicit rebind.

### Popup listeners

`BasePopup` routes every DOM listener through its own `EventManager`. Persistent listeners
(root `mousedown`, close button) live on a `popup-static` scope bound once in the constructor.
Ephemeral per-render listeners (the function-help link) are registered via the protected
`renderListen()` helper onto a `popup-render` scope that is recreated on each `open()` and
disposed on `close()` — so listeners on cleared DOM are dropped every cycle with no
accumulation. `SuggestionsPopup` pools its rows instead of re-rendering them, so it registers
just two delegated `renderListen()` listeners (`mousedown`/`mousemove`) on the list element
and dispatches to the row under the pointer. `ErrorPopup`'s host `mouseover`/`mouseout` listeners live on an `error-host` scope
created in `attach()` and disposed in `detach()`. No popup uses inline `addEventListener`; the
only direct `addEventListener` calls in the codebase are inside `EventScope` itself.

## Key invariants

- No inline code comments anywhere in the codebase — no `//`, no explanatory `/* */`.
  JSDoc (`/** */`) is allowed in exactly one place: on declarations that
  `packages/core/src/index.ts` re-exports (the package's public API surface), written in the
  defining module. Concise TSDoc style — one-sentence summary; `@param`/`@returns` only when
  the name and type don't already say it; contracts over implementation detail. Standard
  TSDoc tags only (`@param`, `@returns`, `@remarks`, `@example`, `@defaultValue`,
  `@category`, `{@link}`) — comments will feed the planned TypeDoc-generated docs site;
  `@category` goes on
  every top-level public symbol, `@example` on primary entry points. Internal-only
  symbols stay undocumented. Two further exceptions: `biome-ignore` directives for tooling,
  and generated `cssText.ts` files, which carry a `@generated` banner written by their
  generator script (`scripts/generateCssText.mjs`) — never hand-edit them.
- Source filenames: camelCase (`formulaEditor.ts`). Test filenames: kebab-case (`fn-help.test.ts`).
- `Kernel` has no DOM dependency and runs in Node.js (vitest). `FormulaEditor` requires a DOM.
- `EngineBridge` gracefully handles a missing HyperFormula instance — autocomplete and
  named-expr annotation are silently disabled; the editor still works for plain text.
- Raw `HyperFormulaLike` is never touched outside `src/engine/`. Controllers reach engine
  facts only through `EditorContext.engine` (the `EngineBridge`); `EditorContext.opts` is
  typed `Omit<FormulaEditorOptions, "hyperformula">` so the compiler enforces this.
- Selection gestures (mouse drag, shift+click, shift+arrows) are host-owned, never core's:
  core and adapters only carry the `GridSelection` data contract (`onSelectionChange`,
  `setSelection`) and render no selection visuals.
