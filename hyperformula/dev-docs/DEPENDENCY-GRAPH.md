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
- **Runtime dependencies stay in the graph.** INDIRECT finds its references while it runs, so the parser can't add them. The formula records each cell or range it reads through `hyperformula/src/EvaluationPass.ts`; the graph adds an edge from that cell, or from the range's vertex, and the `FormulaVertex` stores the dependency. After a completed evaluation, `commitRuntimeDependencies` removes the edges the formula no longer read, except edges it also has through its AST; an interrupted one keeps what it recorded (`keepRuntimeDependencies`). Range and empty-cell vertices left without dependents are removed after the evaluation (`removeUnusedRuntimeVertices`), never while `TopSort` holds them. Because the edges stay, INDIRECT is not volatile: an edit reaches it like any other formula, and only edits that change what its text points to without changing a cell (rows and columns, sheets added, renamed, cleared or removed, named expressions) mark it dirty through the structure flag.
- **A formula can wait for a cell.** "Not current" means the cell may still be recomputed in this pass (`EvaluationPass.isPending`), not that it has no value: after an edit, a pending cell still holds its old value. A formula that reads a pending cell requests it (`requestPull`) and throws `EvaluationDeferred`; `TopSort` computes the requested cells, and the pending cells they depend on, and retries the formula in the same pass. A requested cell already on that chain of waiting formulas is a cycle.
- **`EmptyCellVertex` is not "no vertex".** An empty cell that something depends on still needs a vertex, or the dependency is lost when it is later filled.
- This is the hottest code in the engine after the interpreter — every read and every structural change goes through it.

## Testing

Structural-change tests are the ones that catch real bugs here: add and remove rows and columns around a formula, move a range across a formula that references it, and assert **both** the recalculated value and the formula text afterwards. Structural bugs show up in the formula text first. For runtime dependencies, also test the edges after an edit: change the text so it points elsewhere, then edit the old target, and the formula must not recompute; and compare the values after a series of random edits with a fresh build of the same sheets.
