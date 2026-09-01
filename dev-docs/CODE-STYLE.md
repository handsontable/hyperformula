# Code style

ESLint is the source of truth for formatting and code rules — run `npm run lint` before submitting changes (see [the linter section of the building guide](../docs/guide/building.md#run-the-linter)). Some of what follows it enforces, the `jsdoc` rules among them; the rest is what no linter can check for you.

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

## TypeScript

- The public API surface is `hyperformula/src/HyperFormula.ts` and the types re-exported from `hyperformula/src/index.ts`; `npm run bundle:typings --workspace=hyperformula` emits them into `hyperformula/typings/`.
- `npm run verify:typings` (`tsc --noEmit`) must pass. A change that only compiles because of an `as` cast usually has a modelling problem behind it.

## Performance

Where a package's code is on a hot path, its own reference says so and names the paths. For the engine — where performance is a feature rather than an afterthought — that is [`hyperformula/dev-docs/PERFORMANCE.md`](../hyperformula/dev-docs/PERFORMANCE.md).
