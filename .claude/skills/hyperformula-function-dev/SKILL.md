---
name: hyperformula-function-dev
paths: src/interpreter/**
description: Use when adding a new built-in spreadsheet function to HyperFormula, changing an existing one's signature, arguments, return type, or error behaviour, or when a function returns the wrong value or the wrong error. Covers the FunctionPlugin contract, runFunction and argument metadata, the function metadata catalogue, translations, and the full end-to-end checklist.
---

The plugin contract, `runFunction`, and every metadata field are documented in [`INTERPRETER.md`](../../../dev-docs/INTERPRETER.md#built-in-functions). Read it before writing code. This skill is the checklist.

## The five places, in order

A function is not done until all five agree. Each omission fails differently, and three of them fail silently.

1. **Implementation** — the plugin class in `src/interpreter/plugin/`, plus its `implementedFunctions` entry keyed by the canonical English id. See [`INTERPRETER.md`](../../../dev-docs/INTERPRETER.md#built-in-functions).
2. **Catalogue entry** — `src/interpreter/functionMetadata/categories/<category>.ts`. Parameter **count** must match `implementedFunctions`, or the authored names and descriptions are discarded at run time with only a console warning. A missing entry fails the docs build. See [`FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md).
3. **Translations** — every file in `src/i18n/languages/`. See [`I18N.md`](../../../dev-docs/I18N.md).
4. **Tests** — in `test/`. The list of what a function change must cover is in [`TESTING.md`](../../../dev-docs/TESTING.md#what-each-kind-of-change-needs).
5. **Changelog** — skill `changelog-creation`.

## Two declarations nothing cross-checks

- A function that can return an array needs `sizeOfResultArrayMethod`.
- A function whose valid call arity alone does not express — a zero-argument form, an omitted trailing argument — needs `optionalArg: true` declared explicitly, or the public API advertises the argument as required.

## Verify

```bash
npm run test:jest -- <FunctionName>
npm run docs:generate-function-docs   # fails loudly on a bad or missing catalogue entry
npm run lint
```

## When the behaviour differs from Excel

That is a decision, not an accident. Record it in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md) and say so in the changelog entry. Never write a description that documents Excel while the code does something else.
