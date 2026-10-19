---
name: hyperformula-function-dev
description: Use when adding a new built-in spreadsheet function to HyperFormula, changing an existing one's signature, arguments, return type, or error behaviour, or when a function returns the wrong value or the wrong error. Covers the FunctionPlugin contract, runFunction and argument metadata, the function metadata catalogue, translations, and the full end-to-end checklist.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md#built-in-functions) | The plugin contract, `runFunction`, every argument and function metadata field, and the six places a function change must touch. Read this before writing any code. |
| [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md) | What the catalogue entry must contain, and the two ways to get it wrong |
| [`I18N.md`](../../../hyperformula/dev-docs/I18N.md) | Where to source a translation, and why an invented one cannot be taken back |
| [`LICENSING.md`](../../../hyperformula/dev-docs/LICENSING.md#the-license-capability-table) | Which license keys may call the function |
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md#what-each-kind-of-change-needs) | The list of cases a function change must cover |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

## 2. Work through them in order

1. Touch every one of [the six places a function change must touch](../../../hyperformula/dev-docs/INTERPRETER.md#the-six-places-a-function-change-must-touch), working through the list there rather than from memory. Translations: skill `i18n-translations`. Tests: skill `hyperformula-unit-testing`.
2. Declare what nothing cross-checks: `sizeOfResultArrayMethod` ([function metadata](../../../hyperformula/dev-docs/INTERPRETER.md#built-in-functions)) and `optionalArg` ([Optionality is not cross-checked](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md#optionality-is-not-cross-checked)).
3. Run [Verifying a function change](../../../hyperformula/dev-docs/INTERPRETER.md#verifying-a-function-change).
4. Record any deviation from Excel — [Behaviour, not Excel](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md#behaviour-not-excel).
