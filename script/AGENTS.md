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
| `claude/post-tool-use.mjs` | the Claude Code `PostToolUse` hook | Lints the file an agent just edited and reports the remaining ESLint errors back to it |

## Rules

- **The docs generator is a gate, not a formatter.** It fails the build on a missing catalogue entry or a `'Custom'` category. Keep it failing loudly — a silent skip publishes a built-in function with no description.
- **Release is maintainer-owned.** Do not invent steps around `script/release/`, and do not run it as part of another task.
- These scripts run in CI as well as locally. Do not assume an interactive terminal, a specific working directory, or a developer's environment variables.
- Nothing here is covered by tests. A change to a script is verified by running it.

## `claude/` — agent-time hooks

`post-tool-use.mjs` is wired to `Edit|Write` in [`.claude/settings.json`](../.claude/settings.json). Claude Code passes the tool payload as JSON on stdin; the script reads `tool_input.file_path`, runs `eslint --fix` on that one file, and exits 2 with the remaining errors on stderr, which Claude Code shows to the agent.

Two properties to preserve when changing it:

- **Errors only, never warnings.** `npm run lint` reports tens of thousands of warnings across the repository. Reporting them per edit would bury the agent in noise unrelated to the change it just made.
- **`--fix-type problem,layout`.** Never plain `--fix`. `jsdoc/require-jsdoc` is a suggestion-type rule whose autofix inserts an **empty** JSDoc block above every undocumented declaration, so an unconstrained `--fix` quietly scatters those stubs through any file the agent edits. The restriction keeps the fixes that are unambiguously right — the licence header, semicolons, quotes, spacing — and drops the ones that need a human.
- **Fails open.** A missing ESLint binary, a spawn failure, or unparseable output exits 0 silently. A broken hook must never block work.

Verify a change to it by piping a payload in by hand:

```bash
printf '{"tool_name":"Edit","cwd":"'"$PWD"'","tool_input":{"file_path":"src/interpreter/plugin/AbsPlugin.ts"}}' \
  | node script/claude/post-tool-use.mjs; echo "exit=$?"
```

`script/` is listed in [`.eslintignore`](../.eslintignore), so these files are not linted themselves.
