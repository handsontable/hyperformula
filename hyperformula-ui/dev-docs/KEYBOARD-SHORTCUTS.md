# Formula-editor keyboard shortcuts — canonical behavior

Single source of truth for what every key does while a formula cell editor is open. Keep it in
sync with `keymap.ts`, `KeyboardController`, and their tests (unit matrix in
`keyboard-controller.test.ts`; e2e is a basic integration smoke only —
`e2e/tests/js/basic/formula-builder.spec.ts`, shortcut behavior is unit-owned).

## Where the behavior lives

- **Bindings (data):** `packages/core/src/formulaEditor/keymap.ts` — `BINDINGS`, an ordered
  list of `{ combo, when, command }`. First match wins. `when` flags: `popupOpen`,
  `isFormula`, `always`.
- **Commands (behavior):** `KeyboardController.registerCommands()`.
- **Dispatcher:** `ShortcutManager` (pure, DOM-free). `mod` in a combo = Ctrl (Win/Linux) or
  Cmd (macOS); `matchesCombo` requires an exact modifier match. Printable single-character combos
  (like `(`, `)`) match on `event.key` alone and ignore `shiftKey` unless the binding sets `shift`
  explicitly, because the key value already encodes shift.
- **Point-mode machine:** `PointModeController` (enter/move/jump/toggle/cancel/exit).
- **Ref insertion:** `RefController.tryInsertRef(refStr, force?, append?)` — `force` bypasses
  only the `canInsertRef()` value-position guard (used by explicit point mode); the mouse-pick
  path never forces. `append` (set by a Cmd/Ctrl-modified pick, delivered via
  `CellPick`/`RangePick.append`) joins the new ref after the pending one with the locale
  `argSeparator` instead of replacing it.
- **Tests:** unit — `packages/core/tests/formulaEditor/keyboard-controller.test.ts` (the key
  matrix), `point-mode-controller.test.ts`, `point-mode-keys.test.ts`, `shortcut-manager.test.ts`,
  `tests/adapter/ref-absolute.test.ts`; e2e covers only basic integration smoke
  (`e2e/tests/js/basic/formula-builder.spec.ts`) — shortcut behavior is unit-owned.

## Range-selection (point) mode

Two arrow behaviors exist while editing a formula: **point** (arrows select a cell/range on the
grid and insert the reference at the caret) and **caret** (arrows move the text cursor inside
the formula). `rangeMode ∈ { auto, on, off }`, held in `KeyboardController`, decides which.

- **Effective ON** (arrows point) when `rangeMode === "on"`, or `rangeMode === "auto"` and:
  keyboard stepping active (`PointModeController.isActive()` AND
  `RefController.hasPendingRefAtCaret()` — mid-pointing), OR `RefController.canInsertRef()` —
  caret at a value position. A pending ref alone (mouse pick, F4) does NOT arm arrows; grid
  picks call `point.deactivate()` (state-only reset, keeps pending ref + highlight) so arrows
  return to the caret after a click.
- **Effective OFF** (arrows move the caret) otherwise.
- A **value position** is a caret sitting right after `=`, an operator (`+ - * / ^ & < > :`),
  `(`, or an argument/array separator (`refOpeners`) — a spot where a reference is expected.
- Eligibility is decided inside the `arrow()` command, NOT via a `when` flag — a caret-move
  arrow must still run to latch `rangeMode = "off"` (see case 8).
- **Reset to `auto`** on: typing a character (`input` → `resetRangeMode()`), and on editor
  reseed (`setValue` → `resetRangeMode()` + `point.exit()`). NOT on caret move.

## Shortcut list — behavior in each mode

| Keys | Range ON (pointing) | Range OFF (editing text) |
|------|---------------------|--------------------------|
| ← → ↑ ↓ | Move the marquee one cell; insert/replace the ref at the caret | Move the text caret |
| Shift + ← → ↑ ↓ | Extend/shrink the marquee into a normalized (top-left:bottom-right) range | Extend text selection (native) |
| Ctrl/Cmd + ← → ↑ ↓ | Jump the marquee to the data-block edge (`adapter.getDataEdge`) | Word/line jump (native) |
| Ctrl/Cmd + Shift + ← → ↑ ↓ | Extend/shrink the marquee to the data-block edge (`adapter.getDataEdge`), anchor kept, normalized range | Extend text selection word/line-wise (native) |
| F2 / Ctrl/Cmd + E | Toggle range-selection OFF (keep any inserted ref) | Toggle range-selection ON (arm from the active cell) |
| F4 | Cycle the ref under the caret: `A1` → `$A$1` → `A$1` → `$A1` → `A1` | same |
| Enter | Commit, move active cell **down** | same |
| Shift + Enter | Commit, move **up** | same |
| Tab | Commit, move **right** | same |
| Shift + Tab | Commit, move **left** | same |
| Ctrl/Cmd + Enter | Insert a newline in the formula | same |
| Escape | Ladder first (see below); if neither popup is open, cancels the pending point ref and stays editing — a 2nd Escape cancels the edit | Ladder: close suggestions popup if open, else close fn-help popup if open (suppressing it for the edit session), else cancel the edit |
| `(` | Auto-insert the matching `)`, caret inside | same |
| `)` | Skip over an existing `)` (else insert) | same |
| Home / End | Caret to line start / end (native) | same |

### Autocomplete popup open (takes precedence while visible)
| Keys | Behavior |
|------|----------|
| ↑ / ↓ | Move the active suggestion |
| Enter / Tab | Accept the active suggestion |
| Escape | Close the popup (does not cancel the edit) |

### F6 / Shift+F6 (focus toggle: fn-help popup and editor host)
| Key | Behavior |
|---|---|
| Escape (editor focused, fn-help popup open) | Close the fn-help popup (via the Esc ladder above — `closeFnHelp`) and suppress it for the edit session. Does not touch focus (already in the editor). |
| F6 / Shift+F6 (editor focused, fn-help popup open) | Move focus into the popup — first focusable element in DOM order; the scrollable body carries `tabindex="0"` whenever it has content, so this normally lands on the body (scrollable via arrows/PageUp/PageDown). Only a content-free body leaves nothing focusable, falling through to the host toggle below. |
| F6 / Shift+F6 (popup focused) | Return focus to the editor textarea; the popup stays open. |
| Escape (popup focused) | Close the popup — same effect as its close button (`close()` + `onExplicitClose`) — and return focus to the editor (comes free from `close()`'s focus-return path). |
| F6 / Shift+F6 (editor focused, popup closed, bar edit session active) | Toggle the editor host: inline cell ↔ formula bar. The shared editor reparents (text + caret preserved) via the bar's `HostToggleDelegate`. |
| F6 / Shift+F6 (editor focused, popup closed, no bar session) | Not consumed — the browser keeps its native F6 behavior. |

Shift+F6 binds to dedicated `focusFnHelpBack`/`toggleEditorHostBack` commands (registered
next to `focusFnHelp`/`toggleEditorHost` in `KeyboardController`) rather than a reverse flag
on `ShortcutManager` — the manager's handlers stay no-arg. With today's two focus stops the
`*Back` commands delegate straight to the forward logic (identical observable behavior); a
future third stop only changes the `*Back` bodies.

Also: Tab / Shift+Tab while the popup holds focus cycle through its focusable elements,
wrapping (the trap's `exitKeys` is `["F6"]` only — Escape is handled by the popup itself, not
the trap); Enter / Space on the close button closes the popup and returns focus to the editor.
The popup root advertises the exit via `aria-keyshortcuts="F6"` (SC 2.1.2). While docked into
a host container (`attachToHost`) the popup sits in normal page flow, so Tab is not trapped
there — no `preventDefault`, native tab order moves focus out. The popup's keydown listener
`stopPropagation`s every key while the popup holds focus (host JS shortcuts stay quiet;
browser-native behavior like body scrolling is unaffected).

### Escape and the error tooltip (grid-focused, no editor open)

The error tooltip (`ErrorPopup`) shows on hover/focus of an error cell while the grid — not
the editor — owns focus, so none of the keymap above is active. A window-level `keydown`
listener (capture phase), owned by `ErrorPopup` and registered while attached — it consumes
Escape only while the tooltip is visible AND focus is not inside an editor, fn-help, or
formula-bar root (the address box's Escape-revert must also win) —
closes the tooltip on Escape and suppresses that cell until both pointer and focus leave it
(WCAG 1.4.13; the Esc path snapshots and restores the pointer/focus-inside flags across
`close()` so suppression can't be dropped while the pointer still rests on the cell). While
the editor or the fn-help dialog holds focus the listener stands down entirely, so the
focused surface's own Escape handling always wins over a tooltip raised by a pointer merely
resting on an error cell. No adapter involvement.

## All cases — full behavior matrix

| # | Situation | Expected behavior |
|---|-----------|-------------------|
| 1 | Non-formula text (no leading `=`) | Arrows move the caret (bindings gate on `isFormula`) |
| 2 | Caret at a value position (after `=`/operator/`(`/`,`) | Auto-ON: arrows point at cells |
| 3 | Caret after a complete ref/number | Auto-OFF: arrows move the caret |
| 4 | Consecutive arrows after a keyboard point insert | Keep moving the marquee (`point.isActive()` + `hasPendingRefAtCaret`) |
| 4b | Arrow after a mouse pick inserted a ref | Caret mode: arrow moves past the ref (point deactivated on pick) |
| 5 | F2 / Ctrl+E at a value position | Toggle OFF → arrows move the caret |
| 6 | F2 / Ctrl+E again | Toggle ON → arrows point |
| 7 | F2 / Ctrl+E at a non-value position | Toggle ON → arrows force-insert a ref at the caret |
| 8 | Caret-nav arrow past an operator | Stays caret mode (first caret arrow latches `off`) |
| 9 | F2 while pointing | Keep the inserted ref, arrows switch to caret |
| 10 | Type any character while ON | Reset to `auto` |
| 11 | Commit/cancel then reopen | Fresh `auto` (reset on `setValue`) |
| 12 | F2 on a selected cell (no editor open) | Host opens the editor (handled by the host, not this keymap) |
| 13 | Ctrl/Cmd + E | Identical to F2 |
| 14 | Enter / Tab / Shift+Tab commit | Commit value, move active cell down / right / left |
| 15 | Shift+Enter commit | Commit value, move active cell up one cell |
| 16 | Ctrl/Cmd+Enter | Insert a newline instead of committing |
| 17 | Escape while pointing | First press removes the pending ref (stay editing); second cancels the edit |
| 18 | `(` typed in a formula | Auto-insert `)` and place the caret inside |
| 19 | `)` typed before an existing `)` | Skip over it instead of inserting a duplicate |

## Host scope

Point mode requires `adapter.getActiveCell()` to return a cell. Every known adapter
supports it: Handsontable reads its selection directly; TanStack tracks the selected cell
internally; AG Grid and MUI DataGrid track it through their focus/selection bridges;
plain-table takes an optional `getActiveCell` provider (wired from the host's
selected cell). An adapter without a current cell returns
`null` and point mode no-ops (arrows just move the caret). Commit direction is delivered via
`onCommit(value, direction?)` → `IGridAdapter.commit(value, direction?)`; the host owns the
selection move (core never moves the selection).

## Host shortcut collision (Handsontable)

While the editor is open, Handsontable's own grid shortcuts (arrows navigate cells, Enter
commits + moves down, Tab moves right, …) would fight our commands. Two independent mechanisms
prevent that:

1. **`stopPropagation` guard — HOT never sees the key.** `formulaCellEditor.ts` `init()` creates
   a `cell-editor-guard` EventScope with `{ stopPropagation: true }` and binds `keydown`/`keyup`/
   `keypress` to the editor wrapper (`wrap`). Our `FormulaEditor` textarea is mounted inside
   `wrap`; HOT listens on the grid root (bubble phase). A keydown bubbles textarea → `wrap`,
   where the guard stops propagation, so it never reaches HOT's root handler.
2. **`preventDefault` — stops the browser default.** `ShortcutManager.dispatch` calls
   `event.preventDefault()` only when a command returns `true` (handled). This suppresses the
   browser default (Tab focus change, raw `(` insert, etc.), independent of HOT.

**Order:** our `KeyboardController.handleKeydown` runs first (listener is on the textarea, the
event target), optionally `preventDefault`s, then the event bubbles to `wrap` where the guard
`stopPropagation`s — so HOT's root handler never runs. HOT is effectively deaf while editing.

**Consequence — commit movement is explicit.** Because the guard blocks HOT entirely, we do NOT
inherit HOT's native "commit + move". Directional commit is done by us:
`onCommit(value, direction)` → `IGridAdapter.commit` (`HandsontableAdapter`) →
`FormulaBuilderPlugin.commitInlineEdit` calls `hot.selectCell(...)`, stepping through
`rowIndexMapper`/`columnIndexMapper` renderable indexes so hidden rows/columns are skipped
(clamp fallback when a mapper is absent), and skipping the move entirely for header
selections (negative coords). (Verified: with our manual move disabled, HOT moved zero cells for
every commit key — the guard fully blocks HOT's nav.)

**Formula bar variant.** The bar is not a HOT cell editor, so it can't use the cell-editor
guard. `FormulaBar` owns its own `editor-guard` scope (`stopPropagation: true`) so bar
keystrokes don't leak into the grid.

**Gotcha — the guard is intrinsic to OUR editor.** A cell using a stock HOT editor has no guard,
so arrows there navigate the grid (standard HOT). The demo therefore assigns
`editor: "formula"` to every column (`demo/js/handsontable/main.ts` `cellMeta`). If a future host
uses a different editor per column, the guard only applies where our editor is active.

## Notes

- **Commit direction and merged cells:** a directional commit that moves into a merged cell
  lands on the merge's anchor (Handsontable navigates a merge as one unit). This is why a
  Shift+Enter into the demo's `mergeCells [{row:3,col:2,rowspan:2,colspan:2}]` region appears
  to jump two rows — it is correct merge navigation, not a bug. Test directional commits on
  cells clear of merges.

## Known gaps

- **Home / End** are native browser keys (not intercepted). Verify manually if precise
  line-start/end behavior matters.
- **Shift + F2 / Shift + Ctrl + E** (adjust all occurrences of a range) — out of scope.
