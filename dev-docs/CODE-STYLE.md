# Code style

ESLint is the source of truth for formatting and code rules — run `npm run lint` before submitting changes (see [the linter section of the building guide](../docs/guide/building.md#run-the-linter)). Some of what follows it enforces, the `jsdoc` rules among them; the rest is what no linter can check for you.

## Style

- Prefer a functional approach where possible (`filter`, `map`, `reduce`).
- Write self-documenting code: meaningful names for classes, functions, and variables, with no unexplained abbreviations. Name files and functions after what they do now, and rename them when that changes. Add comments only where they explain intent the code itself cannot.
- Add JSDoc to all classes and functions. Argument names in JSDoc match the published parameter names; for a built-in function, those are the catalogue's names (see [Naming parameters in prose](../hyperformula/dev-docs/FUNCTION-CATALOGUE.md#naming-parameters-in-prose)).
- **Comments and commit messages describe behaviour and rationale.** They don't describe ticket history or who decided what, and they contain no agent chatter. A comment sits next to the code it explains and describes structures that still exist. It doesn't overclaim ("correctly rounded") and isn't written to go stale. No TODO without a task.
- Choose readability over brevity. Explicit, obvious code beats a clever one-liner.
- Keep control flow straightforward: early returns, flat structure, and a reason for every branch and condition.
- Small functions with a single responsibility. No hidden side effects, no magic values.
- **No dead code.** That means unused functions, variables, exports and parameters, and guards that never fire, such as `?.` or `?? 0` on values that are always defined. Remove dead code entirely rather than patching it.
- **Never fail silently.** A fallback that hides a failure emits a diagnostic (`console.warn`), and a test pins it (see [What a change must cover](TESTING.md#what-a-change-must-cover)). Every swallowed or empty `catch` has a comment explaining why.
- Avoid duplication. Extract shared logic instead of copying it, and reuse the codebase's existing helpers and abstractions.
- Match the style of the surrounding code and of the project as a whole. New code should not stand out from its neighbours: a locally "better" style that makes it stand out is usually worse. Changing the style is a refactor of its own, in [its own pull request](DEFINITION-OF-DONE.md#one-pull-request-one-change).
- Anchor regexes, globs and ignore patterns precisely, so they don't also match future siblings.
- Optimize for long-term maintainability: someone else should be able to read, extend, and safely change the code months from now.

## Design

- **Single source of truth.** Derive values instead of typing them by hand: a list, a count taken from the registry, a table of contents generated the same way as the content. Keep no hand-maintained copies of types or texts. Generate documentation from code where possible (see [Generated files](DOC-STANDARDS.md#generated-files)). The developer docs keep one copy of each rule and link to it everywhere else (see [Conventions](README.md#conventions)).
- **Code knows only what it needs.** No hard-coded business knowledge, such as which capabilities belong to which product package.
- **Split responsibilities sensibly.** For example, the engine returns structured data and the client renders it.
- **A new data structure is expressive enough for the known cases.** For example, `repeatLastArgs` is a number, not a boolean; `'all'` or a set beats a single flag.

These are trade-offs with no fixed answer. Ask:

- Were two to four real options considered before choosing one? When requesting a change, ask "what are the options?" before prescribing one.
- If one function seems to need a change to a shared mechanism, what makes it so different? Can it be solved locally?
- Is there a concept here — an extra flag, an extra relation, an extra layer — whose purpose nobody can explain? Could the code be half as long? Is it building a mechanism for a case nobody asked for?
- Is a defensive check worth its complexity? Is the failure it prevents harmful at all?

## TypeScript

- The public API surface is `hyperformula/src/HyperFormula.ts` and the types re-exported from `hyperformula/src/index.ts`; `npm run bundle:typings --workspace=hyperformula` emits them into `hyperformula/typings/`.
- `npm run verify:typings` (`tsc --noEmit`) must pass. A change that only compiles because of an `as` cast usually has a modelling problem behind it.
- Handle states exhaustively, checked at compile time: a `Record<State, …>` instead of a chain of `if`s.
- A reader can tell what a type resolves to. For example, is `typeof ARR[number]` a string or a number? If it takes working out, name the type.

## Performance

Where a package's code is on a hot path, its own reference says so and names the paths. For the engine — where performance is a feature rather than an afterthought — that is [`hyperformula/dev-docs/PERFORMANCE.md`](../hyperformula/dev-docs/PERFORMANCE.md).
