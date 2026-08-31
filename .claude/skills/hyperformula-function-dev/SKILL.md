---
name: hyperformula-function-dev
paths: hyperformula/src/interpreter/**
description: Use when adding a new built-in spreadsheet function to HyperFormula, changing an existing one's signature, arguments, return type, or error behaviour, or when a function returns the wrong value or the wrong error. Covers the FunctionPlugin contract, runFunction and argument metadata, the function metadata catalogue, translations, and the full end-to-end checklist.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`INTERPRETER.md`](../../../dev-docs/INTERPRETER.md#built-in-functions) | The plugin contract, `runFunction`, and every argument and function metadata field. Read this before writing any code. |
| [`FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md) | What the catalogue entry must contain, and the two failure modes that are silent |
| [`I18N.md`](../../../dev-docs/I18N.md) | Where to source a translation, and why an invented one cannot be taken back |
| [`TESTING.md`](../../../dev-docs/TESTING.md#what-each-kind-of-change-needs) | The list of cases a function change must cover |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

## 2. Touch all five places

A function is not done until all five agree. Each omission fails differently, and three of them fail silently.

1. **Implementation** — the plugin class in `hyperformula/src/interpreter/plugin/`, plus its `implementedFunctions` entry keyed by the canonical English id.
2. **Catalogue entry** — `hyperformula/src/interpreter/functionMetadata/categories/<category>.ts`. Parameter **count** must match `implementedFunctions`, or the authored names and descriptions are discarded at run time with only a console warning. A missing entry fails the docs build.
3. **Translations** — every file in `hyperformula/src/i18n/languages/`.
4. **Tests** — in `hyperformula/test/`.
5. **Changelog** — skill `changelog-creation`.

## 3. Declare the two things nothing cross-checks

- A function that can return an array needs `sizeOfResultArrayMethod`.
- A function whose valid call arity alone does not express — a zero-argument form, an omitted trailing argument — needs `optionalArg: true` declared explicitly, or the public API advertises the argument as required.

## 4. Verify

```bash
npm run test:jest -- <FunctionName>
npm run docs:generate-function-docs   # fails loudly on a bad or missing catalogue entry
npm run lint
```

## 5. Record any deviation from Excel

That is a decision, not an accident. Put it in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md) and say so in the changelog entry. Never write a description that documents Excel while the code does something else.
