# Engine performance

HyperFormula is a calculation engine, so the performance of production code is a feature, not an afterthought. The style rules these sit under are repository-wide: [`dev-docs/CODE-STYLE.md`](../../dev-docs/CODE-STYLE.md).

- Consider the computational complexity of every change, especially in code that runs **per cell, per formula, per range element, or per dependency-graph node**. Nested loops over ranges, and repeated work that could be computed once or cached, are the usual suspects.
- **Cost scales with the result, not the source.** Don't materialise a range when only a small part of it is needed: a function that returns the first two rows of a 100,000-row range must not read every cell.
- **Skip what the mode doesn't need.** For example, an exact-match binary search does no linear scan.
- **Memory counts.** No cache grows without eviction, and no reference is left behind after sheets, rows or columns are removed. The memory footprint of a new cache is known and acceptable.
- **Bound the input.** Set a limit or a budget against huge ranges and very long strings.
- **Mind the bundle.** No unnecessary imports, polyfills or data tables.
- Run `npm run test:performance` for changes that may affect the evaluation or CRUD hot paths, and check the result is within noise. On a pull request, the Performance workflow counts the CPU instructions of each scenario with valgrind, which does not depend on the load of the runner, and also times the scenarios. It posts one comment in which the executed instructions give the verdict, and garbage collection, JIT compilation and the times are shown for information; the verdicts are advisory and never fail the pull request. `hyperformula/test/hyperformula-tests/performance/README.md` explains how to read them.

Hot paths worth knowing about before touching them:

| Path | Why it is hot |
|---|---|
| `hyperformula/src/interpreter/` function implementations | Runs once per formula, and once per cell for array-broadcast arguments |
| `hyperformula/src/DependencyGraph/` vertex and range mapping | Every read and every structural change goes through it |
| `hyperformula/src/Evaluator.ts` | Walks the whole recalculation order |
| `hyperformula/src/parser/ParserWithCaching.ts` | Cache misses reparse; a change that defeats the cache is a regression |
| `hyperformula/src/LazilyTransformingAstService.ts` | Deferred AST rewrites after row/column/sheet operations |

## Weighing a speed-up

A faster variant is not automatically a better one. Ask:

- Is the code on a hot path (the first rule and the table above), or a one-off, such as configuration parsing, docs generation or an error path?
- Does the gain change the complexity class (O(n) → O(log n), O(source) → O(result)), or is it a constant factor?
- Is the gain measured — with `npm run test:performance`, a benchmark, or the performance comparison CI posts on the pull request — or only theoretical? Was memory measured as well as time?
- What does it cost: new state, caches to invalidate, extra branches, harder tests, harder onboarding?

As a rule of thumb, a complexity-class gain on a hot path is usually worth it, and a micro-optimisation off the hot path usually isn't. Aim for the most effective variant that adds little complexity. When the faster variant is harder to follow, a JSDoc comment explains the trade-off.
