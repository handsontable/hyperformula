# The dependency graph

`hyperformula/src/DependencyGraph/` is what makes recalculation incremental. Vertices are cells and ranges, edges are dependencies, and a topological sort gives the evaluation order.

## The pieces

| File | Role |
|---|---|
| `DependencyGraph.ts` | The facade the rest of the engine talks to. |
| `Graph.ts` | Vertices, edges, and dirty tracking. |
| `TopSort.ts` | Evaluation order, and cycle detection. |
| `AddressMapping/` | `SimpleCellAddress` to vertex. Several strategies, chosen by sheet density. |
| `RangeMapping.ts`, `RangeVertex.ts` | A range is **one** vertex, shared by every formula that uses it. Its cells feed it through per-cell edges, or through the vertex of the same range one row shorter plus the cells of the last row. When those cells are exactly an array formula's output, one edge from the array's vertex replaces the per-cell edges. |
| `ArrayMapping.ts` | Array formulas and the cells they spill into. |
| `SheetMapping.ts` | Sheet ids and names. |
| `CellVertex.ts`, `ValueCellVertex.ts`, `FormulaVertex.ts`, `EmptyCellVertex.ts`, `ParsingErrorVertex.ts` | The vertex kinds. |
| `collectAddressesDependentToRange.ts` | Which addresses a range change invalidates. |

## Rules

- **Ranges stay shared.** `SUM(A1:A10000)` costs 10 000 cell-to-range edges once, empty cells included; every further formula over the same range adds a single edge from the range vertex. A range reuses the vertex of the same range one row shorter, plus its own last row, only when that shorter range already exists at the time the longer one is added. Connecting the cells straight to each formula would repeat those edges per formula and destroy the performance the engine exists for. When changing range handling, keep the cell-to-range edges and `RangeVertex.bruteForce` consistent (`DependencyGraph.ts`), or edits stop reaching the formulas. If you need per-cell information, ask whether the range vertex can answer instead.
- **Every structural change must keep the mappings consistent.** Adding or removing a row moves addresses; the address mapping, the range mapping, and the array mapping all have to agree afterwards, or a later read resolves to the wrong vertex. Structural changes are paired with `hyperformula/src/dependencyTransformers/` and `hyperformula/src/LazilyTransformingAstService.ts`, which defers the AST rewrites until a formula is actually read.
- **Cycles are a value, not an exception.** `TopSort` detects them and the affected cells get a `CYCLE` error. Never let a cycle throw or loop.
- **`EmptyCellVertex` is not "no vertex".** An empty cell that something depends on still needs a vertex, or the dependency is lost when it is later filled.
- This is the hottest code in the engine after the interpreter — every read and every structural change goes through it.

## Testing

Structural-change tests are the ones that catch real bugs here: add and remove rows and columns around a formula, move a range across a formula that references it, and assert **both** the recalculated value and the formula text afterwards. Structural bugs show up in the formula text first.
