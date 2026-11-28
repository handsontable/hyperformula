# `script/`

Repository-level scripts. Each package keeps its own in `hyperformula/script/` and `docs/script/`; only what spans the whole repository lives here.

| Script | Invoked by | What it does |
|---|---|---|
| `check-licenses.mjs` | `npm run check:licenses` | Asserts every production dependency is permissively licensed |
| `release/` | `npm run release` | The release procedure, across the packages and the sibling repositories |
| `check-citation-markers.mjs` | `npm run check:citation-markers`, which `build-docs.yml` runs after `docs:build` | Fails when a citation marker from a draft document appears in the engine's build output or the docs |

- What the build produces, and where the licence gate fits: [`dev-docs/BUILD.md`](../dev-docs/BUILD.md)
- Everything else: [`dev-docs/README.md`](../dev-docs/README.md)

Only `check-citation-markers.mjs` runs in CI; the others are run by hand from the repository root. `release/release.sh` needs an operator at a terminal on purpose — after `--real-run`, its typed confirmation is the last guard before `npm publish` — so never make it run without one. Nothing here is covered by tests; a change is verified by running it.
