---
name: i18n-translations
description: Use when adding a built-in function that needs translated names, adding a language pack, or fixing a function name that is wrong in one language. Covers the translation sources, the rules, and what breaks when a key is missing.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`I18N.md`](../../../hyperformula/dev-docs/I18N.md) | Why translations are engine input rather than decoration, the sources to translate from, the rules, adding a language pack, and testing |
| [`PARSER.md`](../../../hyperformula/dev-docs/PARSER.md) | Only when changing error literals or how the lexer reads translated names |

## 2. Work through `I18N.md` in order

1. [Where to find a translation](../../../hyperformula/dev-docs/I18N.md#where-to-find-a-translation) — look the name up before writing anything.
2. [Rules](../../../hyperformula/dev-docs/I18N.md#rules) — every one of them, for every language file you touch.
3. [Adding a language pack](../../../hyperformula/dev-docs/I18N.md#adding-a-language-pack) — only when adding a whole language.
4. [Testing](../../../hyperformula/dev-docs/I18N.md#testing) — the test the change needs, and the commands to run.
