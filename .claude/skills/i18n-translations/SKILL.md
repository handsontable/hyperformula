---
name: i18n-translations
paths: src/i18n/**
description: Use when adding a built-in function that needs translated names, adding a language pack, or fixing a function name that is wrong in one language. Covers the translation sources, the rules, and what breaks when a key is missing.
---

Why translations are engine input rather than decoration, the rules, and the table of sources to translate from are in [`I18N.md`](../../../dev-docs/I18N.md). This skill is the procedure.

## Adding a function name

1. Look the name up in the sources listed in [`I18N.md`](../../../dev-docs/I18N.md#where-to-find-a-translation), in that order. **Never invent or machine-translate a function name** — a wrong one ships to every user of that language pack and cannot be changed without breaking their formulas.
2. Add the key to **every** file in `src/i18n/languages/`, in the same change as the function. Missing one is the usual failure, and nothing type-checks it on every path.
3. Do not reorder existing entries while adding one; it turns a one-line diff into an unreviewable one.
4. Add a test that parses a formula using the translated name and asserts the result, in that language.

## Adding a language pack

The file, its export in `src/i18n/languages/index.ts`, a key set identical to the other packs, a changelog entry, and `npm run bundle:languages` to produce the standalone UMD build.

## Verify

```bash
npm run test:jest -- i18n
npm run lint
```
