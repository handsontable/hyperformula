# `script/`

Repository-level scripts. Each package keeps its own in `hyperformula/script/` and `docs/script/`; only what spans the whole repository lives here.

| Script | Invoked by | What it does |
|---|---|---|
| `check-licenses.mjs` | `npm run check:licenses` | Asserts every production dependency is permissively licensed |
| `release/` | `npm run release` | The release procedure, across the packages and the sibling repositories |

- What the build produces, and where the licence gate fits: [`dev-docs/BUILD.md`](../dev-docs/BUILD.md)
- Everything else: [`dev-docs/README.md`](../dev-docs/README.md)

These run in CI as well as locally, so they must not assume an interactive terminal, a working directory, or a developer's environment variables. Nothing here is covered by tests; a change is verified by running it.
