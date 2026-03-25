# Dev Docs

Random notes and things to know useful for maintainers and contributors.

## Definition of Done for the code changes

Each change to the production code (bugfixes, new features, improvements) must include these elements. They must be present in the pull request BEFORE requesting the code review.

- changes to the production code
  - including changes to all supported language packs in `src/i18n/languages` directory (if applicable)
- automatic tests
  - for bugfixes: at least one test reproducing the bug
  - for new features: a set of tests describing the feature specification precisely
  - pull requests from external contributors should include tests in `tests/` directory (they will be moved to the private repository by the internal team)
  - internal team adds tests directly to the private repository (through a separate pull request)
- updates to documentation related to the change
  - for breaking changes: a section in the migration guide
- technical documentation in the form of the jsdoc comments (high-level description of the concepts used in the more complex code fragments)
- changelog entry
- pull request description

## Sources of the function translations

HF supports internationalization and provides the localized function names for all built-in languages. When looking for the valid translations for the new functions, try these sources:
- https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889
- http://dolf.trieschnigg.nl/excel/index.php
