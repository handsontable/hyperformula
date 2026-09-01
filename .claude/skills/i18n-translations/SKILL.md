---
name: i18n-translations
paths: hyperformula/src/i18n/**
description: Use when adding a built-in function that needs translated names, adding a language pack, or fixing a function name that is wrong in one language. Covers the translation sources, the rules, and what breaks when a key is missing.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`I18N.md`](../../../hyperformula/dev-docs/I18N.md) | Why translations are engine input rather than decoration, the rules, and the table of sources to translate from |
| [`PARSER.md`](../../../hyperformula/dev-docs/PARSER.md) | Only when changing separators or error literals — the lexer builds its token set from the language package |

## 2. Look the name up in a real source

Use the sources in [`I18N.md`](../../../hyperformula/dev-docs/I18N.md#where-to-find-a-translation), in the order listed. **Never invent or machine-translate a function name.** A wrong one ships to every user of that language pack and cannot be changed without breaking their formulas.

## 3. Add the key to every language file

All of them, in the same change as the function. Missing one is the usual failure, and nothing type-checks it on every path. Do not reorder existing entries while adding one — it turns a one-line diff into an unreviewable one.

## 4. Test it in that language

A test that parses a formula using the translated name and asserts the result. Not in English.

## 5. Verify

```bash
npm run test:jest -- i18n
npm run lint
```

## Adding a whole language pack

The file, its export in `hyperformula/src/i18n/languages/index.ts`, a key set identical to the other packs, a changelog entry, and `npm run bundle:languages --workspace=hyperformula` for the standalone UMD build.
