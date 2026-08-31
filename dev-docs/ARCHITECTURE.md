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

## Core modules

| Module | Role |
|---|---|
| `src/HyperFormula.ts` | The public API. Every documented method lives here; JSDoc on it is the API reference. |
| `src/BuildEngineFactory.ts` | Constructs an engine from sheets, data, and config. |
| `src/Config.ts`, `src/ConfigParams.ts` | Configuration options, defaults, and validation. |
| `src/CrudOperations.ts` | Create/read/update/delete on sheets and cells. Validates before mutating. |
| `src/Operations.ts` | The mutation primitives `CrudOperations` composes. |
| `src/UndoRedo.ts` | The undo/redo stack, expressed in terms of those primitives. |
| `src/parser/` | Formula text to AST, and back (`Unparser`). Caches parsed formulas. |
| `src/interpreter/` | AST to value. Owns the function registry and every built-in function. |
| `src/DependencyGraph/` | Vertices, edges, address mapping, range mapping, topological sort. |
| `src/dependencyTransformers/` | Rewrites ASTs when rows, columns, or sheets are added, removed, or moved. |
| `src/Evaluator.ts` | Drives recalculation over the graph. |
| `src/NamedExpressions.ts` | Named expression storage and scoping. |
| `src/Serialization.ts`, `src/Exporter.ts` | Read values, formulas, and serialized content back out. |
| `src/i18n/` | Function-name translations, one file per language. |
| `src/format/` | Number and date format parsing. |
| `src/statistics/` | Instrumentation counters used by the performance benchmarks. |

## The parser

`src/parser/` wraps the [Chevrotain](https://chevrotain.io/) parser generator.

- `LexerConfig.ts` and `ParserConfig.ts` build the token set from the active language and config — the lexer is **language-dependent**, because function names are translated.
- `ParserWithCaching.ts` is the entry point; identical formula strings resolve from `Cache.ts` rather than being reparsed.
- `collectDependencies.ts` extracts the relative dependencies of an AST; `absolutizeDependencies.ts` resolves them against a concrete address.
- `Unparser.ts` is the inverse — AST back to text, in the target language. A change to parsing almost always needs a matching change here, or round-tripping breaks.

## The interpreter

`src/interpreter/Interpreter.ts` evaluates an AST node against an `InterpreterState`.

- `FunctionRegistry.ts` maps a function id to the plugin that implements it. Custom functions register through the same registry, and may override a built-in id.
- Every built-in function lives in a plugin under `src/interpreter/plugin/` extending `FunctionPlugin`. See [`src/interpreter/plugin/AGENTS.md`](../src/interpreter/plugin/AGENTS.md).
- `src/interpreter/functionMetadata/` holds the human-readable description of each function — a separate, id-keyed source from the implementation. See [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md).
- `ArithmeticHelper.ts` centralises coercion and comparison. Reach for it rather than writing coercion inside a function.

## The dependency graph

`src/DependencyGraph/` is what makes recalculation incremental.

- `Graph.ts` holds the vertices and edges; `TopSort.ts` produces the evaluation order and detects cycles.
- Vertex kinds: `ValueCellVertex`, `FormulaVertex`, `EmptyCellVertex`, `RangeVertex`, `ParsingErrorVertex`.
- `AddressMapping/` maps a `SimpleCellAddress` to its vertex; `RangeMapping.ts` does the same for ranges, so a range is a single vertex rather than one edge per cell.
- `LazilyTransformingAstService.ts` defers AST rewrites after structural changes until a formula is actually read — a change here affects both correctness and the CRUD hot path.

## Invariants

- **Headless.** No DOM, no network, no filesystem access in `src/`.
- **Incremental.** A change recalculates the affected subgraph, never the whole sheet. Anything that forces a full recalculation is a performance regression.
- **Language-dependent parsing.** Function names, argument separators, and error literals all vary by language. Never hard-code an English function name in the parser or interpreter.
- **Public API stability.** `src/HyperFormula.ts` is the contract. See [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md) for what a breaking change requires.
