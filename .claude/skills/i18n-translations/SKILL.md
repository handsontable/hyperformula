---
name: i18n-translations
paths: src/i18n/**
description: Use when adding a built-in function that needs translated names, adding a language pack, or fixing a function name that is wrong in one language. Covers the translation sources, the rules, and what breaks when a key is missing.
---

## Why it matters

Parsing is language-dependent: the lexer builds its token set from the active translation package. A function with a missing translation is not "untranslated" — it is **unparseable** in that language.

## Adding a function name

Add the key to **every** file in `src/i18n/languages/`, in the same change as the function. There are 19 language packs; missing one is the common failure and nothing type-checks it in every path.

Do not reorder existing entries while adding one — it turns a one-line diff into an unreviewable one.

The key is the canonical English id, the same one used in `implementedFunctions` and in the metadata catalogue. Translations map onto that id; they never replace it.

## Where to find a translation

| Source | Use for |
|---|---|
| [Microsoft's Excel functions translator](https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889) | Languages Excel supports |
| <http://dolf.trieschnigg.nl/excel/index.php> | Cross-check against the above |
| Google Sheets function list with `hl` set to the locale — e.g. <https://support.google.com/docs/table/25273?hl=id> for Indonesian | Languages Excel does not support |
| The English name | Functions Google Sheets does not list either — this matches what Excel does in unsupported locales |

Never invent a translation, and never machine-translate a function name. A wrong name ships to every user of that language pack and cannot be changed without breaking their formulas.

## Scope

Translate the function **name** only. Argument separators, error literals, and boolean literals are also part of a language package; changing them is a language-pack decision, not a side effect of adding a function.

## Adding a language pack

A new pack needs: the file in `src/i18n/languages/`, its export in `src/i18n/languages/index.ts`, a complete key set matching the other packs, and a changelog entry. `npm run bundle:languages` produces the standalone UMD build.

## Tests

A translation change needs a test that parses a formula using the translated name and asserts the result — in that language, not in English.
