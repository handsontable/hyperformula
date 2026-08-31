# `src/i18n/` — function-name translations

One file per language under `languages/`, plus `TranslationPackage.ts`. Parsing is language-dependent: the lexer builds its token set from the active package, so these files are engine input, not decoration.

## Rules

- **A new function ships translations for every language in the same change.** A missing key leaves that function unparseable in that language.
- **Keep the key set identical across all language files.** Adding a key to one file and not the rest is the usual failure.
- **Do not reorder existing entries** while adding one. It turns a one-line diff into an unreviewable one.
- **Translate the name only.** Separators, error literals, and boolean literals are part of the package too — do not invent values for them.
- The canonical English id is what `implementedFunctions` and the metadata catalogue use. Translations map onto it; they never replace it.

## Where to find a translation

| Source | Use for |
|---|---|
| [Microsoft's Excel functions translator](https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889) | Languages Excel supports |
| <http://dolf.trieschnigg.nl/excel/index.php> | Cross-check |
| Google Sheets function list with `hl` set to the locale, e.g. <https://support.google.com/docs/table/25273?hl=id> | Languages Excel does not support |
| The English name | Functions Google Sheets does not list either |

Skill: `i18n-translations`. Reference: [`dev-docs/I18N.md`](../../dev-docs/I18N.md).
