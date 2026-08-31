# `src/interpreter/functionMetadata/` — what the docs and the API say about each function

The human-readable description of every built-in function: `shortDescription`, `parameters` with `snake_case` names and descriptions, `examples`, `documentationUrl`, and `category`. One file per category under `categories/`.

Two consumers read it: the public `getAvailableFunctions` / `getFunctionDetails` API, and the generated `docs/guide/built-in-functions.md` page.

## Rules

- **Keyed by function id, not by implementation.** An entry applies to whichever plugin currently provides that id — including a custom plugin registered over a built-in. An entry left behind after a rename describes nothing and still ships in the bundle; remove or rename it in the same change.
- **Every field is required**, `documentationUrl` included.
- **Parameter count must match `implementedFunctions`.** On a mismatch the implementation wins: authored names and descriptions are discarded, positional names (`Arg1`, `Arg2`) are reported, and a console warning names the function. The function stays listed.
- **A missing entry fails the docs build.** A registered function with no entry is described as `category: 'Custom'`, and `'Custom'` has no section on the generated page, so `npm run docs:generate-function-docs` fails rather than publishing a built-in with no description.
- **`'Custom'` must never appear in a catalogue file** or in `FUNCTION_CATEGORIES`.
- **Optionality is not cross-checked.** The `optional` flag comes entirely from `optionalArg` / `defaultValue` in the plugin. A description calling an argument optional next to `optional: false` fails nothing and misleads everyone.
- **Name parameters exactly.** When a description refers to a *different* argument, use its exact `snake_case` name — "shifts `start_date` by …", never "shifts the start date by …". A parameter's own description may still open with ordinary English for the thing it describes.
- **No docs-page-local markup in `shortDescription`** — no relative links, no footnote references. API consumers render these strings too.
- **Describe HyperFormula, not Excel.** Verify against the implementation, and record deviations in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md).

Full detail, including why each failure mode behaves the way it does: [`dev-docs/FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md).
