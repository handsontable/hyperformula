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

A single pull request should contain an atomic self-contained functional change (single bugfix, single feature, single improvement). If a pull request contains multiple features or bugfixes, it should be split.

## Code style

- Prefer a functional approach where possible (`filter`, `map`, `reduce`).
- Write self-documenting code: use meaningful names for classes, functions, and variables. Add code comments only when they explain intent the code itself cannot.
- Add JSDoc to all classes and functions.
- ESLint is the source of truth for formatting and code rules. Run `npm run lint` before submitting changes (see [building](docs/guide/building.md#run-the-linter)).

## Automatic tests

- All changes to the production code must be covered by automatic tests kept in the `test/` directory.
- Each test case must be very simple and focused on a single assertion. Don't use loops, conditionals, or other control flow statements in test cases.

## Documentation

- Follow the [documentation content guide](DOCS_CONTENT_GUIDE.md) when creating or editing docs (writing style, language, and how to structure guides).

## How to add a new function

Adding a built-in function is similar to adding a [custom function](docs/guide/custom-functions.md), so that guide is a useful reference for the function-implementation patterns (argument metadata, return types, array handling). The built-in flow on top of that is:

1. Create or modify a plugin in `src/interpreter/plugin/`.
2. Add function metadata to `implementedFunctions`.
3. Implement the function method.
4. Add translations to all language files in `src/i18n/languages/`.
5. Add tests in `test/unit/interpreter/`.

## Internationalization and function translations

HyperFormula supports internationalization and provides localized function names for all built-in languages. Translation files live in `src/i18n/languages/`. New functions must include translations for all built-in languages.

When looking for the valid translations for new functions, try these sources:

- https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889
- http://dolf.trieschnigg.nl/excel/index.php

For languages not officially supported by Microsoft Excel, the two sources above do not apply. For these languages, use Google Sheets as the reference. Switch the `hl` query parameter to the target locale, for example:

- https://support.google.com/docs/table/25273?hl=id (Indonesian)

For functions that Google Sheets does not list either, fall back to the English name (matching the convention used by Excel in unsupported locales).
