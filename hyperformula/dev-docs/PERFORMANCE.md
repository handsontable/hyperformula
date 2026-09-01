# Engine performance

HyperFormula is a calculation engine, so the performance of production code is a feature, not an afterthought. The style rules these sit under are repository-wide: [`dev-docs/CODE-STYLE.md`](../../dev-docs/CODE-STYLE.md).

HyperFormula is a calculation engine, so the performance of production code is a feature, not an afterthought.

- Consider the computational complexity of every change, especially in code that runs **per cell, per formula, or per dependency-graph node**. Nested loops over ranges, and repeated work that could be computed once or cached, are the usual suspects.
- Pick the best complexity that still keeps the code readable. When a faster algorithm is harder to follow, explain the trade-off in a JSDoc comment.
- Run `npm run test:performance` for changes that may affect the evaluation or CRUD hot paths.

Hot paths worth knowing about before touching them:

| Path | Why it is hot |
|---|---|
| `hyperformula/src/interpreter/` function implementations | Runs once per formula, and once per cell for array-broadcast arguments |
| `hyperformula/src/DependencyGraph/` vertex and range mapping | Every read and every structural change goes through it |
| `hyperformula/src/Evaluator.ts` | Walks the whole recalculation order |
| `hyperformula/src/parser/ParserWithCaching.ts` | Cache misses reparse; a change that defeats the cache is a regression |
| `hyperformula/src/LazilyTransformingAstService.ts` | Deferred AST rewrites after row/column/sheet operations |
