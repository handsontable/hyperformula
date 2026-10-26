# Changelog

All notable changes to the `hyperformula-ui` package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added the `rootDocument` and `portalParent` options to `FormulaBuilder`, so the popups, the screen-reader announcements and the styles can live in the grid's iframe document or shadow root. Container selectors are also looked up in that shadow root. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Added fill commit: Ctrl/Cmd+Enter commits the formula to every selected cell when the adapter implements the new optional `commitFill` method, or the `onCommitFill` option is set. Alt+Enter inserts a newline. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Added the `--hfe-error-font-family` CSS variable, used by both a cell's error value and the error popup title. When it is not set, both use `--hfe-font-family`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Added smaller API pieces used by the fixes below: `FormulaBarCellOptions.tokenPostProcess` and `FormulaBarCell.refresh()`, a `root` argument (document or shadow root) on `StyleInjector.inject()` and `release()` with the `StyleRoot` type, a `ShadowRoot` container for `LiveRegion`, and, for the formula bar's address box, the `AddressBoxNavigation` outcome its navigation callbacks may return and the `onUnavailableTarget` option. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Added the `phrases` option to `FormulaBuilder` and `FormulaEditor`, which translates every accessible name, hint and screen-reader announcement, with the English defaults exported as `DEFAULT_PHRASES`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)

### Changed
- Changed the font of a cell's error value from the monospace formula font to the host's font (`--hfe-font-family`), to match the error popup title. To keep monospace, set `--hfe-error-font-family: var(--hfe-formula-font-family)`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the default reference colors (`--hfe-ref-1` to `--hfe-ref-8`) so that each clears a 4.5:1 contrast ratio on the light and dark editor backgrounds and no two look alike. To keep the previous colors, set the eight properties on the class you pass as `className`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the `FormulaBuilder` constructor to log a warning and use the default placement, instead of throwing, when a `popups.*.container` or `formulaBarContainer` selector matches nothing or is not valid CSS. To fail on a missing container, check it before constructing the builder, or attach it with `attachFormulaBar()`, `attachSuggestionsHost()` or `attachFnHelpHost()`, which still throw. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the address box to reject a cell or range when the adapter's `setActiveCell` or `setSelection` returns `false`, and to announce that it cannot be selected. Both methods now return `boolean | void`: an adapter that already returned a boolean should return `true` on success, and a wrapper declared as returning `void` that returns the wrapped adapter's result must declare `boolean | void`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the stylesheet to set no `color-scheme`, so the editor, the formula bar, the popups and the grid highlights follow the scheme the host page sets, on `<html>` or on the class passed as `className`, instead of the operating system. A page that sets no scheme now gets the light colors; to follow the operating system, set `color-scheme: light dark` on `<html>`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)

### Fixed
- Fixed a grid pick made with the caret inside an existing cell or range reference: it inserted the pick into the middle of the reference when the caret followed the colon of a range (`=SUM(C1:A1:B2C2)`), and otherwise counted as a click outside the editor, which committed the formula. The pick now replaces the whole reference the caret sits in, at either end included, and Ctrl/Cmd appends after it. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed the editor logging an error on every keystroke, and losing named-expression colors, when the HyperFormula instance has no sheet with the editor's `sheetId`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed reference picking with `DomRangePicker` and the error popup in a grid inside a shadow root or an iframe: a drag picked only its first cell, the error popup did not open or close with Escape, and the popups did not follow a scroll inside the shadow root. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed a removed named expression staying colored as a reference in the editor and the formula bar after `undo()`, `redo()`, `changeNamedExpression()` or `removeSheet()`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed the idle formula bar coloring references differently from the editor when the formula contains a named expression. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed `FormulaBuilder.destroy()` throwing, and leaving the popups and styles in the page, when the HyperFormula instance was destroyed first. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed slow tokenizing of a long run of apostrophes, which took about 600 ms for 40,000 characters. [#1839](https://github.com/handsontable/hyperformula/pull/1839)

## [0.3.5] - 2026-10-21

### Added
- Added the `hyperformula-ui` package: a formula editor for HyperFormula with syntax and reference highlighting, function autocomplete and help, range picking, and an optional formula bar, connected to any grid through the `IGridAdapter` interface. [#1832](https://github.com/handsontable/hyperformula/pull/1832)
