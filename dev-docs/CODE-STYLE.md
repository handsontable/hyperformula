# Code style

ESLint is the source of truth for formatting and code rules. Run `npm run lint` before submitting changes. Everything below is what ESLint cannot check.

## Style

- Prefer a functional approach where possible (`filter`, `map`, `reduce`).
- Write self-documenting code: meaningful names for classes, functions, and variables. Add comments only where they explain intent the code itself cannot.
- Add JSDoc to all classes and functions.
- Choose readability over brevity. Explicit, obvious code beats a clever one-liner.
- Keep control flow straightforward: early returns, flat structure, and a reason for every branch and condition.
- Small functions with a single responsibility. No hidden side effects, no magic values.
- Avoid duplication. Extract shared logic instead of copying it, and reuse the codebase's existing helpers and abstractions.
- Match the style of the surrounding code and of the project as a whole. New code should not stand out from its neighbours.
- Optimize for long-term maintainability: someone else should be able to read, extend, and safely change the code months from now.

## Performance

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

## TypeScript

- The public API surface is `hyperformula/src/HyperFormula.ts` and the types it exports; `npm run bundle:typings --workspace=hyperformula` emits them into `hyperformula/typings/`.
- `npm run verify:typings` (`tsc --noEmit`) must pass. A change that only compiles because of an `as` cast usually has a modelling problem behind it.
