# Changelog

All notable changes to the `hyperformula-ui` package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added the `rootDocument` and `portalParent` options to `FormulaBuilder`, so the popups, the screen-reader announcements and the styles can live in the grid's iframe document or shadow root. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Added fill commit: Ctrl/Cmd+Enter commits the formula to every selected cell when the adapter implements the new optional `commitFill` method, or the `onCommitFill` option is set. Alt+Enter inserts a newline. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Added the `--hfe-error-font-family` CSS variable, used by both a cell's error value and the error popup title. When it is not set, both use `--hfe-font-family`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)

### Changed
- Changed the font of a cell's error value from the monospace formula font to the host's font (`--hfe-font-family`), to match the error popup title. To keep monospace, set `--hfe-error-font-family: var(--hfe-formula-font-family)`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the default reference colors (`--hfe-ref-1` to `--hfe-ref-8`) so that each clears a 4.5:1 contrast ratio on the light and dark editor backgrounds. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the `FormulaBuilder` constructor to log a warning and use the default placement, instead of throwing, when a `popups.*.container` or `formulaBarContainer` selector matches nothing. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed the address box to reject a cell or range when the adapter's `setActiveCell` or `setSelection` returns `false`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Changed `color-scheme` to be set only on the editor, the formula bar, the popup roots and the grid highlight layer, so a host theme class on them controls light and dark mode. [#1839](https://github.com/handsontable/hyperformula/pull/1839)

### Fixed
- Fixed a removed named expression staying colored as a reference in the editor and the formula bar after `undo()`, `redo()`, `changeNamedExpression()` or `removeSheet()`. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed the idle formula bar coloring references differently from the editor when the formula contains a named expression. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed `FormulaBuilder.destroy()` throwing, and leaving the popups and styles in the page, when the HyperFormula instance was destroyed first. [#1839](https://github.com/handsontable/hyperformula/pull/1839)
- Fixed slow tokenizing of a long run of apostrophes, which took about 600 ms for 40,000 characters. [#1839](https://github.com/handsontable/hyperformula/pull/1839)

## [0.3.5] - 2026-10-21

### Added
- Added the `hyperformula-ui` package: a formula editor for HyperFormula with syntax and reference highlighting, function autocomplete and help, range picking, and an optional formula bar, connected to any grid through the `IGridAdapter` interface. [#1832](https://github.com/handsontable/hyperformula/pull/1832)
