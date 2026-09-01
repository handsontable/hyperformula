---
name: hyperformula-function-dev
paths: hyperformula/src/interpreter/**
description: Use when adding a new built-in spreadsheet function to HyperFormula, changing an existing one's signature, arguments, return type, or error behaviour, or when a function returns the wrong value or the wrong error. Covers the FunctionPlugin contract, runFunction and argument metadata, the function metadata catalogue, translations, and the full end-to-end checklist.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md#built-in-functions) | The plugin contract, `runFunction`, and every argument and function metadata field. Read this before writing any code. |
| [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md) | What the catalogue entry must contain, and the two ways to get it wrong |
| [`I18N.md`](../../../hyperformula/dev-docs/I18N.md) | Where to source a translation, and why an invented one cannot be taken back |
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md#what-each-kind-of-change-needs) | The list of cases a function change must cover |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

## 2. Touch all five places

A function is not done until all five agree, and they do not fail the same way — a missing catalogue entry fails the docs build, a parameter-count mismatch only warns on the console, and the rest fail silently.

The list is in [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md#the-five-places-a-function-change-must-touch). Work through it there rather than from a copy; two of the five have their own page, linked from it.

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
