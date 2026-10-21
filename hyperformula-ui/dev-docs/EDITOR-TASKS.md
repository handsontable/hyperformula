# Where common editor changes go

A map from a kind of change to the files that implement it, for work in `packages/core/src/`. Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first: it maps every component and states the invariants these changes must keep.

All paths below are relative to `packages/core/src/`.

## Tokenization

- Lexer: `lexer/lexer.ts`.
- Token types: `lexer/tokens.ts` (`TokenType`) and `lexer/types.ts` (`Token` and its meta interfaces).
- Post-processing, after lexing and before the state update: `Kernel.tokenPostProcess`, set in the `FormulaEditor` constructor.

## Keyboard shortcuts

- Bindings are data: `formulaEditor/keymap.ts` (`BINDINGS`). Each entry maps a key combination to a command name and a `when` list of context flags (`popupOpen`, `isFormula`, `always`). The first matching binding wins, so order matters.
- Commands are behaviour: `KeyboardController.registerCommands()` in `formulaEditor/keyboardController.ts`. A handler registered with `this.manager.register("commandName", handler)` returns `true` when it consumed the event.
- Context flags come from `KeyboardController.buildContext()`. The dispatcher, `formulaEditor/shortcutManager.ts`, is pure and DOM-free.
- Whether an arrow key moves the caret or picks a cell is decided inside the `arrow()` command (`rangeMode` and `isPointEligible()`), not by a `when` flag: an arrow that moves the caret must still run, to set `rangeMode` to `"off"`.
- Auto-closing a parenthesis: `autoCloseParen()` in `KeyboardController`.

What every key does is specified in [`KEYBOARD-SHORTCUTS.md`](KEYBOARD-SHORTCUTS.md). Read it before changing key behaviour, and keep it in sync with `keymap.ts` and the unit tests.

## Reference highlights

- `pushHighlights()` reads the tokens and builds the `RangeHighlight[]`.
- Colours: `theme/refPalette.ts`, `assignRefIndex(map, refText)` (keyed by the upper-cased reference text) and `paletteColorForIndex(index)`.
- The adapter renders the highlights; the core only sends coordinates and colours.

## Suggestions and function help

- Trigger: `maybeShowPopup()`.
- Rendering: `formulaEditor/popupController.ts`.
- Signature popup: `ui/popup/functionHelpPopup.ts`.
- Portal root: `ui/popup/popupContext.ts`. `FormulaBuilder` creates and owns the `PopupContext` and passes it to `FormulaEditor` through the required `popupCtx` option; create one yourself only in tests.
- Caret context, in `ui/caret/tokenContext.ts`: `currentFunctionPrefix(tokens, offset)` returns the prefix being typed, and `activeCallContext(tokens, offset)` returns the function name and argument index.

## Overlay and syntax colouring

- `renderOverlay()`.
- Decorations: `ui/text/decorations.ts`, from the token list to per-character class names.
- Rendering: `ui/text/visualOverlay.ts`.

## Checks while you work

```bash
npm run typecheck --workspace=hyperformula-ui/packages/core   # after every meaningful edit
npm run test:ui                                               # after a unit of work
npm run lint                                                  # before every commit
```

Run the end-to-end suite only when the change touches what [`e2e/COVERAGE.md`](../e2e/COVERAGE.md) covers.
