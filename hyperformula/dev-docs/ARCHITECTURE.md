# Engine architecture

HyperFormula is a headless spreadsheet calculation engine. No UI, no DOM, no server. Everything below runs in the browser and in Node.

## The pipeline

```
        setCellContents / buildFromArray
                     │
                     ▼
        CellContentParser          classify raw input: formula, number, date, string, error
                     │
                     ▼
        parser/  (Chevrotain)      formula text  ──►  AST + relative dependencies
                     │
                     ▼
        GraphBuilder               AST  ──►  vertices and edges
                     │
                     ▼
        DependencyGraph/           who depends on whom; topological order
                     │
                     ▼
        Evaluator                  walk the order, evaluate each formula vertex
                     │
                     ▼
        interpreter/               AST node  ──►  InterpreterValue
                     │
                     ▼
        Serialization / Exporter   engine values  ──►  values the caller asked for
```

## Where a symptom lives

| Symptom | Stage |
|---|---|
| Does not parse, or parses wrongly | `hyperformula/src/parser/` |
| `getCellFormula` returns something the user never typed | `hyperformula/src/parser/Unparser.ts` |
| A function returns the wrong value or error | `hyperformula/src/interpreter/plugin/` |
| Value right, but stale after an edit | `hyperformula/src/DependencyGraph/`, `hyperformula/src/Evaluator.ts` |
| Wrong after adding or removing rows or columns | `hyperformula/src/dependencyTransformers/`, `LazilyTransformingAstService.ts` |
| Wrong in one language only | `hyperformula/src/i18n/languages/` |
| Coercion or comparison is wrong | `hyperformula/src/interpreter/ArithmeticHelper.ts` |
| The public API disagrees with its docs | `hyperformula/src/HyperFormula.ts` |

A bug that looks like an interpreter problem is often a parser or graph problem. Confirm which stage is wrong before editing. The smallest reproduction of a calculation bug is a two-line `buildFromArray` plus one `getCellValue`.

## Core modules

| Module | Role |
|---|---|
| `hyperformula/src/HyperFormula.ts` | The public API. Every documented method lives here; JSDoc on it is the API reference. |
| `hyperformula/src/BuildEngineFactory.ts` | Constructs an engine from sheets, data, and config. |
| `hyperformula/src/Config.ts`, `hyperformula/src/ConfigParams.ts` | Configuration. `ConfigParams.ts` is the interface; `Config.defaultConfig` holds the values. |
| `hyperformula/src/CrudOperations.ts` | Create/read/update/delete on sheets and cells. Validates before mutating. |
| `hyperformula/src/Operations.ts` | The mutation primitives `CrudOperations` composes. |
| `hyperformula/src/UndoRedo.ts` | The undo/redo stack, expressed in terms of those primitives. |
| `hyperformula/src/parser/` | Formula text to AST, and back (`Unparser`). Caches parsed formulas. |
| `hyperformula/src/interpreter/` | AST to value. Owns the function registry and every built-in function. |
| `hyperformula/src/DependencyGraph/` | Vertices, edges, address mapping, range mapping, topological sort. |
| `hyperformula/src/dependencyTransformers/` | Rewrites ASTs when rows, columns, or sheets are added, removed, or moved. |
| `hyperformula/src/Evaluator.ts` | Drives recalculation over the graph. |
| `hyperformula/src/NamedExpressions.ts` | Named expression storage and scoping. |
| `hyperformula/src/Serialization.ts`, `hyperformula/src/Exporter.ts` | Read values, formulas, and serialized content back out. |
| `hyperformula/src/i18n/` | Function-name translations, one file per language. |
| `hyperformula/src/license/` | License key reading, capability tables, and license gating — see [`LICENSING.md`](LICENSING.md). Its `handsontable-license-key-parser/` is vendored; do not edit it. |
| `hyperformula/src/format/` | Number and date format parsing. |
| `hyperformula/src/statistics/` | Instrumentation counters used by the performance benchmarks. |

## The parser

`hyperformula/src/parser/` wraps the [Chevrotain](https://chevrotain.io/) parser generator.

- `LexerConfig.ts` and `ParserConfig.ts` build the token set from the active language and config — the lexer is **language-dependent**, because function names are translated.
- `ParserWithCaching.ts` is the entry point; formulas that are the same once the relative parts of their references are taken as offsets from their own cell share one cached AST in `Cache.ts` rather than being reparsed — see [`PARSER.md`](PARSER.md).
- `collectDependencies.ts` extracts the relative dependencies of an AST. Resolving them against a concrete address is `hyperformula/src/absolutizeDependencies.ts`, which sits at the source root rather than in `hyperformula/src/parser/`.
- `Unparser.ts` is the inverse — AST back to text, in the target language. A change to parsing almost always needs a matching change here, or round-tripping breaks.

## The interpreter

`hyperformula/src/interpreter/Interpreter.ts` evaluates an AST node against an `InterpreterState`.

- `FunctionRegistry.ts` maps a function id to the plugin that implements it. Custom functions register through the same registry, and may override a built-in id.
- Every built-in function lives in a plugin under `hyperformula/src/interpreter/plugin/` extending `FunctionPlugin`. See [`hyperformula/src/interpreter/plugin/AGENTS.md`](../src/interpreter/plugin/AGENTS.md).
- `hyperformula/src/interpreter/functionMetadata/` holds the human-readable description of each function — a separate, id-keyed source from the implementation. See [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md).
- `ArithmeticHelper.ts` centralises coercion and comparison. Reach for it rather than writing coercion inside a function.

## The dependency graph

`hyperformula/src/DependencyGraph/` is what makes recalculation incremental.

- `Graph.ts` holds the vertices and edges; `TopSort.ts` produces the evaluation order and detects cycles.
- Vertex kinds: `ValueCellVertex`, `FormulaVertex`, `EmptyCellVertex`, `RangeVertex`, `ParsingErrorVertex`.
- `AddressMapping/` maps a `SimpleCellAddress` to its vertex; `RangeMapping.ts` does the same for ranges, so every formula over a range shares one range vertex — see [`DEPENDENCY-GRAPH.md`](DEPENDENCY-GRAPH.md).
- `hyperformula/src/LazilyTransformingAstService.ts` — at the source root, not in this directory — defers AST rewrites after structural changes until a formula is actually read. A change there affects both correctness and the CRUD hot path.

## Invariants

Everything in `hyperformula/src/` ships, runs in the browser and in Node, and sits on the hot path of a calculation engine. These hold everywhere in it.

- **Headless.** No DOM, no network, no filesystem. A dependency that reaches for `window`, `document`, or `fs` does not belong in `hyperformula/src/`.
- **Incremental.** A change recalculates the affected subgraph, never the whole sheet. Anything that forces a full recalculation is a performance regression, not an implementation detail.
- **Language-dependent parsing.** Function names and error literals vary by language. The argument, decimal and array separators do not: they are configuration (`ConfigParams`). Never hard-code an English function name in the parser or the interpreter.
- **Errors are values.** Return a `CellError` with a message from `hyperformula/src/error-message.ts`. A throw reachable from evaluation escapes one cell and takes the whole recalculation with it.
- **Coercion goes through `ArithmeticHelper`.** Spreadsheet coercion is not JavaScript coercion, and it is already implemented once.
- **Public API stability.** `hyperformula/src/HyperFormula.ts` and the types re-exported from `hyperformula/src/index.ts` are the contract. The JSDoc on it **is** the published API reference — write it for the reader of the docs portal. See [`DEFINITION-OF-DONE.md`](../../dev-docs/DEFINITION-OF-DONE.md) for what a breaking change requires.
- **Tests, always.** Every change here ships a test in `hyperformula/test/`; a bug fix ships one that fails against the unfixed code. See [`TESTING.md`](TESTING.md).

## Subsystem references

| Subsystem | Page |
|---|---|
| `hyperformula/src/parser/` | [`PARSER.md`](PARSER.md) |
| `hyperformula/src/interpreter/`, including `plugin/` | [`INTERPRETER.md`](INTERPRETER.md) |
| `hyperformula/src/interpreter/functionMetadata/` | [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md) |
| `hyperformula/src/DependencyGraph/` | [`DEPENDENCY-GRAPH.md`](DEPENDENCY-GRAPH.md) |
| `hyperformula/src/i18n/` | [`I18N.md`](I18N.md) |

## Everything else in `hyperformula/src/`

- `HyperFormula.ts` — the public API. Every method here is documented output.
- `CrudOperations.ts` / `Operations.ts` / `UndoRedo.ts` — CRUD validates, `Operations` mutates, `UndoRedo` records. A new mutation needs all three, or undo silently diverges.
- `Config.ts` / `ConfigParams.ts` — `ConfigParams.ts` declares the interface and carries the `@default` JSDoc tags; the default values live in `Config.defaultConfig`. The constructor does not merge a partial config onto them: it reads each option by name and assigns most of them through `configValueFromParam` (`ArgumentSanitization.ts`), which checks the type or the allowed values and falls back to the default; array and object options use `configValueFromParamCheck`, and `chooseAddressMappingPolicy`, `functionPlugins` and `context` are assigned directly. Only `mergeConfig`, used by `updateConfig`, merges a partial onto the current config and builds a new `Config` from the result. A new option therefore needs the field in `ConfigParams.ts`, a value in `defaultConfig`, a field on `Config` with its constructor assignment and validation, and a guide entry. `Config` implements `ConfigParams`, so the compiler rejects an option added to `ConfigParams.ts` alone.
- `dependencyTransformers/` — AST rewrites when rows, columns, or sheets move. Paired with `LazilyTransformingAstService.ts`, which defers them until a formula is read.
- `format/`, `helpers/`, `Lookup/`, `statistics/` — number and date formats, shared utilities, lookup strategies, instrumentation counters.
