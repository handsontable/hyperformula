# `script/`

Repository-level scripts. Each package keeps its own in `hyperformula/script/` and `docs/script/`; only what spans the whole repository lives here.

| Script | Invoked by | What it does |
|---|---|---|
| `check-licenses.mjs` | `npm run check:licenses` | Asserts every production dependency is permissively licensed |
| `release/` | `npm run release` | The release procedure, across the packages and the sibling repositories |

- What the build produces, and where the licence gate fits: [`dev-docs/BUILD.md`](../dev-docs/BUILD.md)
- Everything else: [`dev-docs/README.md`](../dev-docs/README.md)

No workflow runs these; they are run by hand from the repository root. `release/release.sh` needs an operator at a terminal on purpose — after `--real-run`, its typed confirmation is the last guard before `npm publish` — so never make it run without one. Nothing here is covered by tests; a change is verified by running it.
