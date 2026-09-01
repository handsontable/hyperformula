# `script/`

Node and shell scripts invoked from `package.json`. Not shipped, not tested, not linted (`script/` is in [`.eslintignore`](../.eslintignore)).

| Script | Invoked by | What it does |
|---|---|---|
| `check-file.js` | `verify:umd*`, `verify:cjs` | Asserts a build artifact exists and is not trivially small |
| `check-publish-package.js` | `verify:publish-package` | Reads `npm pack` output and checks what would ship |
| `prepare-cf-assets.js` | `docs:build:cf` | Composes the Cloudflare Worker asset tree |
| `if-ne-env.js` | the `bundle:*` scripts | Skips a recompile when `HF_COMPILE` is already set |
| `check-licenses.mjs` | `check:licenses` | Asserts every production dependency is permissively licensed |
| `release/` | `npm run release` | The release procedure |

## Before changing one

- What the build produces and how these scripts fit into it: [`dev-docs/BUILD.md`](../dev-docs/BUILD.md)
- Why the docs generator fails loudly rather than skipping: [`dev-docs/FUNCTION-CATALOGUE.md`](../dev-docs/FUNCTION-CATALOGUE.md). It lives in [`docs/script/`](../docs/script/), not here, because it needs the portal's VuePress dependency tree.

Two things that are true only here: these scripts run in CI as well as locally, so they must not assume an interactive terminal, a working directory, or a developer's environment variables; and nothing here is covered by tests, so a change is verified by running it.
