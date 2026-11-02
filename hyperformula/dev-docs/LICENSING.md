# License key handling

`hyperformula/src/license/` reads the license key, maps its capability tokens to built-in functions (`functionCapabilities.ts`) and to public API features (`featureCapabilities.ts`), and gates function calls and API methods.

A gated function or feature is gated on every path that reaches it, an alias included. A refused function call evaluates to `#LIC!`; a refused API method throws `LicenseCapabilityMissingError`. A path that bypasses the gate is a bug, unless the pull request records it as a deliberate decision.

## The license capability table

`hyperformula/src/license/functionCapabilities.ts` decides which license keys can call a built-in function. Add every new built-in either to its group in `FUNCTION_GROUPS` or, if it belongs to no group, to `UNGROUPED_FUNCTIONS`. An ungrouped function is granted only by `fun:all` and by its own `fun:<name>` token. Both lists use canonical names: an alias needs no entry, because it is gated as its canonical function.

A built-in missing from the table escapes the entitlement check: every key that lets formulas evaluate can call it, including a key that grants no functions. The completeness check in the private test suite (`unit/license/capability-registry.spec.ts`) fails on such a function, but the public smoke tests do not.

Group names are part of the license key format, so never rename a group or remove a function from one. Adding a function to a group grants it to every key that already carries that group's token.

## The vendored key reader

`hyperformula/src/license/handsontable-license-key-parser/` is a copy of the entitlement-key reader published by the `handsontable/license-key` repository, taken whole from a tagged release. Don't edit it: fix the problem upstream and take the copy again, as described in `PROVENANCE.md` in that directory. ESLint ignores the directory, and codecov leaves it out of the coverage statuses.

Nothing may live in it that upstream does not ship, other than the files `upstream.json` lists under `own_files`. That is why its `AGENTS.md`, which comes from upstream, has no `CLAUDE.md` symlink beside it.

`npm run check:license-key-parser-drift --workspace=hyperformula` compares the copy with the pinned upstream commit and fails on any difference or on a newer upstream tag. It needs read access to the upstream repository, so it runs in its own CI workflow (`.github/workflows/vendored-parser.yml`) rather than in `npm run test` or `npm run lint`.
