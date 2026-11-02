# The function metadata catalogue

`hyperformula/src/interpreter/functionMetadata/categories/` holds the human-readable metadata for every built-in function: `shortDescription`, `parameters` (`snake_case` names, each with a description), `examples`, `documentationUrl`, and the category.

It is the single source of truth for two consumers:

- the public `getAvailableFunctions` / `getFunctionDetails` API, documented in the generated API reference (`docs/api/`, built by `npm run typedoc:build-api`);
- the generated built-in functions guide page (`docs/guide/built-in-functions.md`, produced by `npm run docs:generate-function-docs` from the repository root, after `npm run docs:install`).

Every field is required, `documentationUrl` included. Each entry authors its own link rather than inheriting a shared default, so links can diverge per function without touching any code; they all happen to point at the same guide page today. Do not write a test that asserts an entry's `documentationUrl` equals the shared guide-page link or a placeholder.

## Categories

An entry's `category` must be one of the categories in `FUNCTION_CATEGORIES` — the ones the generated guide page renders as `### ` sections.

The separate `'Custom'` category is reserved for user-registered functions and must **never** appear in `FUNCTION_CATEGORIES` or in a catalogue file. It names no section, and the docs generator rejects an entry carrying it rather than silently dropping it from the page it is building. That rejection is also what turns a missing catalogue entry into a failed docs build.

A new function that Excel also has goes in the category Excel lists it under.

## Keyed by id, not by implementation

The catalogue's key set decides which ids carry an authored **description**, not which ids the API lists.

Both `getAvailableFunctions` and `getFunctionDetails` describe every registered function — custom ones included — and an entry is applied whenever the catalogue holds one for the id, whichever plugin currently provides it. A custom plugin registered over a built-in id is therefore described with that built-in's authored metadata.

Nothing checks a key against a registered function either, so an entry left behind after a rename describes nothing and merely ships in the bundle. Remove or rename it in the same change as the function.

## No catalogue entry

A registered function with no entry is still listed and still resolves to details, but as a custom function: `category: 'Custom'`, no `shortDescription`, `documentationUrl` or `examples` (the API omits every authored field it has no source for, rather than reporting an empty one), and positional parameter names (`Arg1`, `Arg2`, …). `'Custom'` has no section on the generated docs page, so `npm run docs:generate-function-docs` fails rather than publishing a built-in with no description.

## Optionality is not cross-checked

The catalogue authors no optionality of its own — a parameter's `optional` flag is derived entirely from `optionalArg` / `defaultValue` in `implementedFunctions` — so a description that calls an argument optional can sit next to `optional: false` with nothing failing.

When a function accepts a call that arity alone does not express (`SHEET()`, `ROW()`, and anything else served by `runFunctionWithReferenceArgument`'s zero-argument path), the plugin must declare `optionalArg: true` explicitly, or the public API will advertise the argument as required. `ROW`, `COLUMN`, `SHEET` and `SHEETS` all declare it; `ISFORMULA` takes the same path and correctly does not, because its zero-argument call is an error rather than a shorthand.

## Naming parameters in prose

When a description **refers to** a parameter, use that parameter's exact `snake_case` name, never a prose variant: write "shifts `start_date` by …", not "shifts the start date by …". The same strings are rendered next to the generated syntax line, where the `snake_case` name is what the reader sees, so a prose variant leaves the reader guessing which argument is meant. This applies to `shortDescription` and to every parameter description.

It does **not** turn ordinary English into identifiers. A parameter's own description may open with a prose noun phrase for the thing it describes — `lower_bound` is fine as "The lower bound, rounded up to an integer" — and words that merely happen to match a name ("entries that appear exactly once") stay as they are. The rule is about naming a *different* argument, or naming one from the syntax line.

## Markup

`shortDescription` must not use docs-page-local markup — no relative links, no footnote references. The strings are rendered by API consumers as well as by the docs page.

## One style

A `shortDescription` starts with a verb ("Returns …") and ends with a period. An entry's name, descriptions and category do not contradict each other.

Every example works when pasted into a cell. It works with the default configuration, and under a non-English language pack once its function names and error literals are translated.

## Behaviour, not Excel

Descriptions must describe **HyperFormula's** behaviour, not Excel's. Much of the catalogue was seeded from a hand-written page that documented Excel, and HyperFormula deliberately deviates in places (`INT` truncates toward zero, `ISEVEN`/`ISODD` do not truncate, `CEILING.MATH`/`FLOOR.MATH` honour only `mode` = 1). Verify a claim against the implementation before authoring it, and record any deviation in [the list of differences](../../docs/guide/list-of-differences.md).

When the catalogue, the guides or the tests disagree with the implementation, fix them to match the implementation. If the implementation is the bug, fix it in [a separate pull request](../../dev-docs/DEFINITION-OF-DONE.md#one-pull-request-one-change).

## The rules, in short

- **Keyed by function id, not by implementation.** Remove or rename a stale entry in the same change as the function.
- **Every field is required**, `documentationUrl` included. Never assert a shared or placeholder `documentationUrl` in a test.
- **A missing entry fails the docs build.**
- **`'Custom'` must never appear** in a catalogue file or in `FUNCTION_CATEGORIES`.
- **A function Excel also has goes in Excel's category.**
- **Optionality is not cross-checked** — declare `optionalArg` explicitly on the plugin.
- **Name a different argument by its exact `snake_case` name.**
- **No docs-page-local markup in `shortDescription`.**
- **A `shortDescription` starts with a verb and ends with a period; examples work when pasted into a cell.** Name, descriptions and category do not contradict each other.
- **Describe HyperFormula, not Excel.** Where the catalogue, guides or tests disagree with the implementation, fix them; fix an implementation bug in a separate pull request.
