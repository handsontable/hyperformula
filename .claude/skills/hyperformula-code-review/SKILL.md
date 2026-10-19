---
name: hyperformula-code-review
description: Use when reviewing a diff, a branch, or a pull request in the HyperFormula repository. Covers correctness for a calculation engine, performance on the hot paths, the six places a function change must touch, API stability, and what the definition of done requires.
---

## 1. Read the relevant files from `dev-docs/`

Always:

| File | Why |
|---|---|
| [`PULL-REQUESTS.md`](../../../dev-docs/PULL-REQUESTS.md#reviewing-a-pull-request) | The review order, and how to report findings |
| [`REVIEWING.md`](../../../hyperformula/dev-docs/REVIEWING.md) | What to look for in each category of an engine change |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change was required to contain |
| [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md) | Style, and which paths are hot enough that complexity matters |
| [`TESTING.md`](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour) | Whether the tests prove anything, or only execute code |

Then the page covering what the diff touches: [`ARCHITECTURE.md`](../../../hyperformula/dev-docs/ARCHITECTURE.md), [`PARSER.md`](../../../hyperformula/dev-docs/PARSER.md), [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md), [`DEPENDENCY-GRAPH.md`](../../../hyperformula/dev-docs/DEPENDENCY-GRAPH.md), [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md), [`I18N.md`](../../../hyperformula/dev-docs/I18N.md), [`LICENSING.md`](../../../hyperformula/dev-docs/LICENSING.md).

## 2. Work through them in order

1. Review each category in the [review order](../../../dev-docs/PULL-REQUESTS.md#reviewing-a-pull-request), using the checks for it in [`REVIEWING.md`](../../../hyperformula/dev-docs/REVIEWING.md). Stop to report the first serious finding.
2. Report as [Reviewing a pull request](../../../dev-docs/PULL-REQUESTS.md#reviewing-a-pull-request) describes.
