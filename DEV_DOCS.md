# Developer documentation

Canonical reference for everyone working on the HyperFormula source code: maintainers, the internal team, and AI agents triggered by them. Everything a developer needs to know lives here or is linked from here.

## Quick links

- **[Building, testing, and linting](docs/guide/building.md)** &mdash; all `npm` commands and build outputs
- **[Test suite](test/README.md)** &mdash; smoke tests and how to attach the private test suite
- **[Public docs portal](https://hyperformula.handsontable.com/docs)** &mdash; main documentation
- **[Docs README](docs/README.md)** &mdash; how to run the docs portal locally
- **[Docs content guide](DOCS_CONTENT_GUIDE.md)** &mdash; how to create and edit docs content
- **[Changelog](CHANGELOG.md)**
- **[Pull request template](.github/pull_request_template.md)**

## Repository layout

```
.
├── src/                        # Source code
│   ├── HyperFormula.ts         # Main engine class, public API entry point
│   ├── parser/                 # Formula parsing (uses Chevrotain parser generator)
│   ├── interpreter/            # Formula evaluation engine
│   │   └── plugin/             # Built-in spreadsheet function plugins
│   ├── DependencyGraph/        # Cell dependency tracking and recalculation order
│   ├── CrudOperations.ts       # Create/read/update/delete operations on sheets and cells
│   └── i18n/                   # Function-name translations per language
├── test/                       # Test suite
├── docs/                       # Public documentation portal (VuePress)
│   ├── guide/                  # Markdown guides (building, contributing, usage…)
│   ├── api/                    # API reference (generated from JSDoc)
│   ├── .vuepress/              # VuePress configuration, theme, components
│   └── README.md               # How to run the docs portal locally
├── script/                     # Maintenance and release scripts
├── .github/                    # CI workflows, issue and PR templates
├── DEV_DOCS.md                 # Canonical developer documentation (this file)
├── AGENTS.md                   # Guidance for AI agents
├── CONTRIBUTING.md             # Guide for external contributors
├── README.md                   # Project overview
├── CHANGELOG.md
├── LICENSE.txt
├── package.json
└── tsconfig.json
```

## Architecture

### Core modules

- `src/HyperFormula.ts` &mdash; main engine class, public API entry point
- `src/parser/` &mdash; formula parsing (uses the [Chevrotain](https://chevrotain.io/) parser generator)
- `src/interpreter/` &mdash; formula evaluation engine
- `src/DependencyGraph/` &mdash; cell dependency tracking and recalculation order
- `src/CrudOperations.ts` &mdash; create/read/update/delete operations on sheets and cells

### Function plugins (`src/interpreter/plugin/`)

All spreadsheet functions are implemented as plugins extending `FunctionPlugin`. Each plugin:

- declares an `implementedFunctions` static property mapping function names to metadata
- uses the `runFunction()` helper for argument validation, coercion, and array handling
- registers function translations in `src/i18n/languages/`

## Definition of Done

Each change to the production code (bugfix, new feature, or improvement) must include the following elements **before** requesting a code review:

- Changes to the production code
  - including changes to all supported language packs in `src/i18n/languages` (if applicable)
- Automatic tests
  - for bug fixes: at least one test reproducing the bug
  - for new features: a set of tests precisely describing the feature
  - pull requests from external contributors should include tests in the `test/` directory (they will be moved to the private repository by the internal team)
  - the internal team adds tests directly to the private repository (through a separate pull request)
- Updates to documentation related to the change
  - for breaking changes: a section in the migration guide
- Technical documentation in the form of JSDoc comments (high-level description of the concepts used in more complex code fragments)
- Changelog entry (not required for documentation-only changes (guides, JSDoc, README, etc.)
- Pull request description

Every element of the change must not only be present but also correct: the changelog entry must describe the change accurately, and the documentation updates must match the new behaviour.

Read through your own diff before requesting a review, and ask yourself what could be done better. Fix what you find while the change is still yours.

A single pull request should contain an atomic self-contained functional change (single bugfix, single feature, single improvement). If a pull request contains multiple features or bugfixes, it should be split. Every change in the pull request must be relevant to the issue it solves &mdash; unrelated refactors, reformatting, or clean-ups belong in a separate pull request.

## Code style

- Prefer a functional approach where possible (`filter`, `map`, `reduce`).
- Write self-documenting code: use meaningful names for classes, functions, and variables. Add code comments only when they explain intent the code itself cannot.
- Add JSDoc to all classes and functions.
- Choose readability over brevity. Explicit, obvious code is better than a clever one-liner.
- Keep the logic straightforward: avoid convoluted control flow, prefer early returns and a flat structure, and make sure every branch and condition has a reason to exist.
- Follow clean code principles and general programming best practices: small functions with a single responsibility, no hidden side effects, no magic values.
- Avoid duplication. Extract shared logic instead of copying it, and reuse the existing helpers and abstractions of the codebase.
- Match the style of the surrounding code and of the project as a whole. New code should not stand out from its neighbours.
- Optimize for long-term maintainability: someone else should be able to read, extend, and safely change the code months from now.
- ESLint is the source of truth for formatting and code rules. Run `npm run lint` before submitting changes (see [building](docs/guide/building.md#run-the-linter)).

## Performance

HyperFormula is a calculation engine, so the performance of the production code is a feature, not an afterthought.

- Consider the computational complexity of every change, especially in code that runs per cell, per formula, or per dependency-graph node. Nested loops over ranges and repeated work that could be computed once or cached are the usual suspects.
- Pick the best complexity that still keeps the code readable. When a faster algorithm is harder to follow, explain the trade-off in a JSDoc comment.
- Run `npm run test:performance` for changes that may affect the evaluation or CRUD hot paths.

## Automatic tests

- All changes to the production code (the `src/` directory) must be covered by automatic tests kept in the `test/` directory.
- Each test case must be very simple and focused on a single assertion. Don't use loops, conditionals, or other control flow statements in test cases.
- Cover more than the happy path: boundary values, empty and invalid input, error results, and interactions with related features.
- Before requesting a review, ask yourself which further tests would be valuable and add the ones that protect against realistic regressions.
- Don't add tests for code in the `docs/`, `examples/`, and `script/` directories.

## Documentation

- Follow the [documentation content guide](DOCS_CONTENT_GUIDE.md) when creating or editing docs (writing style, language, and how to structure guides).
- We try not to duplicate information in the documentation. The API reference (generated from JSDocs) should contain all the details about each function and class (it is the primary source of truth). Guides should provide high-level overview. They may duplicate some of the information from the API reference if they are relevant to the context but, above all, they should link to the API reference for the detailed information.

## How to add a new function

Adding a built-in function is similar to adding a [custom function](docs/guide/custom-functions.md), so that guide is a useful reference for the function-implementation patterns (argument metadata, return types, array handling). The built-in flow on top of that is:

1. Create or modify a plugin in `src/interpreter/plugin/`.
2. Add function metadata to `implementedFunctions`.
3. Implement the function method.
4. Add a catalogue entry to `src/interpreter/functionMetadata/categories/<category>.ts` (see below).
5. Add translations to all language files in `src/i18n/languages/`.
6. Add tests in `test/hyperformula-tests/unit/interpreter/` — that's the private `hyperformula-tests` repo checked out under `test/`. Interpreter and function specs don't live in this public repo; a copy under `test/unit/` would run twice and leave `develop` red if only one of the paired PRs lands.

### The function metadata catalogue

`src/interpreter/functionMetadata/categories/` holds the human-readable metadata for every built-in function: `shortDescription`, `parameters` (`snake_case` names, each with a description), `examples`, `documentationUrl`, and the category. It is the single source of truth for two consumers: the public [`getAvailableFunctions`/`getFunctionDetails`](docs/api/classes/hyperformula.md) API, and the generated built-in functions guide page (see [docs/README.md](docs/README.md)).

Every field is required, `documentationUrl` included. Each entry authors its own link rather than inheriting a shared default, so that the links can diverge per function without touching any code; they all happen to point at the same guide page today.

An entry's `category` must be one of the categories in `FUNCTION_CATEGORIES` &mdash; the ones the generated guide page renders as `### ` sections. The separate `'Custom'` category is reserved for user-registered functions and must never appear in `FUNCTION_CATEGORIES` or in a catalogue file: it names no section, and the docs generator rejects an entry carrying it rather than silently dropping it from the page it is building. (That rejection is also what turns a missing catalogue entry into a failed docs build. Arity drift below needs no such guard: the function still reaches the generator, which renders its degraded syntax line.)

The catalogue's key set decides which ids carry an authored **description**, not which ids the API lists. Both `getAvailableFunctions` and `getFunctionDetails` describe every registered function &mdash; custom ones included &mdash; and an entry is applied whenever the catalogue holds one for the id, whichever plugin currently provides it: the catalogue is keyed by id, not by implementation, so a custom plugin registered over a built-in id is described with that built-in's authored metadata. Nothing checks a key against a registered function either, so an entry left behind after a rename describes nothing and merely ships in the bundle. Remove or rename it in the same change as the function.

Two ways to get this wrong:

- **No catalogue entry.** A registered function with no entry is still listed and still resolves to details, but as a custom function: `category: 'Custom'`, no `shortDescription`, `documentationUrl` or `examples` (the API omits every authored field it has no source for, rather than reporting an empty one), and positional parameter names (`Arg1`, `Arg2`, …). `'Custom'` has no section on the generated docs page, so `npm run docs:generate-function-docs` fails rather than publishing a built-in with no description.
- **Arity drift.** If the entry's parameter **count** disagrees with the plugin's `implementedFunctions`, the implementation wins: `getFunctionDetails` reports one parameter per implemented argument under positional names, discarding the authored names and descriptions, and warns on the console naming the function. The entry's category, `shortDescription`, `examples` and `documentationUrl` are still used, and the function stays listed &mdash; the parameter prose degrades, not the availability.

Keep the entry's parameters in step with `implementedFunctions` whenever you change a signature.

When a description **refers to** a parameter, use that parameter's exact `snake_case` name, never a prose variant: write "shifts `start_date` by …", not "shifts the start date by …". The same strings are rendered next to the generated syntax line, where the `snake_case` name is what the reader sees, so a prose variant leaves the reader guessing which argument is meant. This applies to `shortDescription` and to every parameter description.

It does **not** turn ordinary English into identifiers. A parameter's own description may open with a prose noun phrase for the thing it describes &mdash; `lower_bound` is fine as "The lower bound, rounded up to an integer" &mdash; and words that merely happen to match a name ("entries that appear exactly once") stay as they are. The rule is about naming a *different* argument, or naming one from the syntax line.

`shortDescription` must not use docs-page-local markup (no relative links, no footnote references): the strings are rendered by API consumers as well as by the docs page.

Note what the drift warning does **not** cover: **optionality is not cross-checked.** The catalogue authors no optionality of its own &mdash; a parameter's `optional` flag is derived entirely from `optionalArg`/`defaultValue` in `implementedFunctions` &mdash; so a description that calls an argument optional can sit next to `optional: false` with nothing failing. When a function accepts a call that arity alone does not express (`SHEET()`, `ROW()`, and anything else served by `runFunctionWithReferenceArgument`'s zero-argument path), the plugin must declare `optionalArg: true` explicitly, or the public API will advertise the argument as required. `ROW`, `COLUMN`, `SHEET` and `SHEETS` all declare it; `ISFORMULA` takes the same path and correctly does not, because its zero-argument call is an error rather than a shorthand.

Descriptions must describe **HyperFormula's** behaviour, not Excel's. Much of the catalogue was seeded from a hand-written page that documented Excel, and HyperFormula deliberately deviates in places (`INT` truncates toward zero, `MOD` takes the sign of the dividend, `ISEVEN`/`ISODD` do not truncate, `CEILING.MATH`/`FLOOR.MATH` honour only `mode` = 1). Verify a claim against the implementation before authoring it, and record any deviation in [the list of differences](docs/guide/list-of-differences.md).

## Internationalization and function translations

HyperFormula supports internationalization and provides localized function names for all built-in languages. Translation files live in `src/i18n/languages/`. New functions must include translations for all built-in languages.

When looking for the valid translations for new functions, try these sources:

- https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889
- http://dolf.trieschnigg.nl/excel/index.php

For languages not officially supported by Microsoft Excel, the two sources above do not apply. For these languages, use Google Sheets as the reference. Switch the `hl` query parameter to the target locale, for example:

- https://support.google.com/docs/table/25273?hl=id (Indonesian)

For functions that Google Sheets does not list either, fall back to the English name (matching the convention used by Excel in unsupported locales).
