---
name: hyperformula-dev
description: >
  Use for ANY work touching the HyperFormula engine in `hyperformula/src/`: fixing bugs, adding features,
  changing the public API, working on the parser, the interpreter, the dependency graph,
  CRUD operations, configuration options, named expressions, or number and date formats.
  Also use for how-to questions about engine internals (how recalculation works, why a formula
  returns an error, where a value is coerced). Triggers on file paths under `hyperformula/src/`, or when the
  user describes a symptom in a calculation without naming a file. This is the primary entry
  point for engine development — when in doubt, load it.
---

## 1. Read the relevant files from `dev-docs/`

Always:

| File | Why |
|---|---|
| [`ARCHITECTURE.md`](../../../hyperformula/dev-docs/ARCHITECTURE.md) | The pipeline, where a symptom lives, the core modules, and the invariants that hold everywhere in `hyperformula/src/` |
| [`CODE-STYLE.md`](../../../dev-docs/CODE-STYLE.md) | Style, and which paths are hot enough that complexity matters |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

Then the page for the stage you are changing:

| File | For |
|---|---|
| [`PARSER.md`](../../../hyperformula/dev-docs/PARSER.md) | `hyperformula/src/parser/` — formula text to AST, and back |
| [`INTERPRETER.md`](../../../hyperformula/dev-docs/INTERPRETER.md) | `hyperformula/src/interpreter/` — AST to value, and built-in functions |
| [`DEPENDENCY-GRAPH.md`](../../../hyperformula/dev-docs/DEPENDENCY-GRAPH.md) | `hyperformula/src/DependencyGraph/` — dependency tracking and recalculation order |
| [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md) | `hyperformula/src/interpreter/functionMetadata/` — function descriptions |
| [`I18N.md`](../../../hyperformula/dev-docs/I18N.md) | `hyperformula/src/i18n/` — function-name translations |
| [`LICENSING.md`](../../../hyperformula/dev-docs/LICENSING.md) | `hyperformula/src/license/` — license keys and gating |
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md) | Writing the test the change needs |

## 2. Work through them in order

1. Find the stage before changing anything — [Where a symptom lives](../../../hyperformula/dev-docs/ARCHITECTURE.md#where-a-symptom-lives). A wrong function result: skill `hyperformula-function-dev`. Wrong in one language: skill `i18n-translations`. Find definitions and callers with the language server — [`AGENT-TOOLING.md`](../../../dev-docs/AGENT-TOOLING.md#claudesettingsjson).
2. Attach the private suite — [Fetching the private suite](../../../hyperformula/dev-docs/TESTING.md#fetching-the-private-suite) — then reproduce with a failing test first, with skill `test-writing-discipline`.
3. Change the code, then run the fast loop — [Running tests](../../../hyperformula/dev-docs/TESTING.md#running-tests) and `npm run lint`; on a hot path, also [Performance](../../../hyperformula/dev-docs/TESTING.md#performance).
4. Finish everything in [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md).
