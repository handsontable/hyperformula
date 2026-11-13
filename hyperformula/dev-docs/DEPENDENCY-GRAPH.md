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

- **Ranges stay shared.** `SUM(A1:A10000)` costs 10 000 cell-to-range edges once, empty cells included (unless the range is [open-ended](#infinite-and-open-ended-ranges)); every further formula over the same range adds a single edge from the range vertex. A range reuses the vertex of the same range one row shorter, plus its own last row, only when that shorter range already exists at the time the longer one is added. Connecting the cells straight to each formula would repeat those edges per formula and destroy the performance the engine exists for. When changing range handling, keep the cell-to-range edges and `RangeVertex.bruteForce` consistent (`DependencyGraph.ts`), or edits stop reaching the formulas. If you need per-cell information, ask whether the range vertex can answer instead.
- **Every structural change must keep the mappings consistent.** Adding or removing a row moves addresses; the address mapping, the range mapping, and the array mapping all have to agree afterwards, or a later read resolves to the wrong vertex. Structural changes are paired with `hyperformula/src/dependencyTransformers/` and `hyperformula/src/LazilyTransformingAstService.ts`, which defers the AST rewrites until a formula is actually read.
- **Cycles are a value, not an exception.** `TopSort` detects them and the affected cells get a `CYCLE` error. Never let a cycle throw or loop.
- **`EmptyCellVertex` is not "no vertex".** An empty cell that something depends on still needs a vertex, or the dependency is lost when it is later filled.
- This is the hottest code in the engine after the interpreter — every read and every structural change goes through it.

## Infinite and open-ended ranges

A whole-column or whole-row range (`AbsoluteColumnRange`, `AbsoluteRowRange`) has no vertex per cell of its own. It gets edges from the cells its sheet holds when it is added, and `Graph` marks it as an infinite range. A cell that appears inside it later is linked by `correctInfiniteRangesDependency`, so every way of putting a cell at an address has to call it: setting a value or a formula, moving cells, and spilling an array. Such a range may hold no cell at all, so a change that must reach its dependents, such as removing its sheet, has to mark the range vertex itself as dirty. Such a range is never built from the same range one row shorter.

`openEndedRangeMinRows` and `openEndedRangeMinColumns` give a finite range the same treatment. `DependencyGraph.rangeReferencedByFormula` turns a range at least that tall or wide into an `AbsoluteOpenEndedRange`, both when the range vertex is created and when the interpreter evaluates the range, so the two agree.

- **The decision is made once per range vertex**, when it is created. Structural changes resize `RangeVertex.range` in place, and a vertex that started open-ended stays open-ended, and the other way round, whatever size it has later. Read the vertex's own range, not the dependency that led to it. A range evaluated by the interpreter is judged by its current size, which gives the same values either way: the cells an open-ended vertex has no edge from are empty.
- **Two different extents.** `effectiveEndRow` and `effectiveEndColumn` stop at the last cell of the range's own sheet, and are what the graph iterates, so no `EmptyCellVertex` is created past the sheet's cells. `effectiveHeight` and `effectiveWidth` are the size of the range as a value: the range's size capped by the tallest and the widest sheet. They do not depend on the start of the range or on its sheet, so two open-ended ranges of one size always pair up cell by cell.
- **Functions that need the full size ask for it.** `SimpleRangeValue.fullWidth()` and `fullHeight()` return the size between the two corners. `ROWS`, `COLUMNS`, `INDEX`, `COUNTBLANK` and `CriterionFunctionCompute` use them to treat the cells left out of the data as empty.
- **Structural changes reach past the sheet's cells.** An open-ended range can end below the last row, or right of the last column, that its sheet holds. Adding or removing rows and columns there still shifts, resizes or removes the range and rewrites the formulas (`Operations.rowEffectivelyNotInSheet`, `columnEffectivelyNotInSheet`), but leaves the address mapping alone, so the sheet does not grow. A row or column added to or removed from an open-ended range may hold no cell, so `DependencyGraph` marks the resized range vertex itself as dirty.
- **Only ranges referred to by formulas are open-ended.** A range built for anything else, such as the area of a spilled array or the source of a move, stays an `AbsoluteCellRange` and is iterated in full.

## Testing

Structural-change tests are the ones that catch real bugs here: add and remove rows and columns around a formula, move a range across a formula that references it, and assert **both** the recalculated value and the formula text afterwards. Structural bugs show up in the formula text first.
