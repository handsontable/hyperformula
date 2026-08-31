# `script/` — build, docs, and release scripts

Node and shell scripts invoked from `package.json`. Not shipped, not tested.

| Script | Invoked by | What it does |
|---|---|---|
| `check-file.js` | `verify:umd*`, `verify:cjs` | Asserts a build artifact exists and is not trivially small |
| `check-publish-package.js` | `verify:publish-package` | Reads `npm pack` output and checks what would ship |
| `generate-builtin-functions-doc.ts` | `docs:generate-function-docs` | Renders `docs/guide/built-in-functions.md` from the template and the metadata catalogue |
| `formatFunctionSyntax.ts`, `renderBuiltinFunctionsTable.ts` | the generator above | Formatting helpers for the generated page |
| `prepare-cf-assets.js` | `docs:build:cf` | Composes the Cloudflare Worker asset tree |
| `if-ne-env.js` | the `bundle:*` scripts | Skips a recompile when `HF_COMPILE` is already set |
| `release/` | `npm run release` | The release procedure |

## Rules

- **The docs generator is a gate, not a formatter.** It fails the build on a missing catalogue entry or a `'Custom'` category. Keep it failing loudly — a silent skip publishes a built-in function with no description.
- **Release is maintainer-owned.** Do not invent steps around `script/release/`, and do not run it as part of another task.
- These scripts run in CI as well as locally. Do not assume an interactive terminal, a specific working directory, or a developer's environment variables.
- Nothing here is covered by tests. A change to a script is verified by running it.
