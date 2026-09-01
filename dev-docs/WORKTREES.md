# Working in a linked git worktree

Claude Code can run a session — or an isolated subagent — in a `git worktree` so its changes stay off your main checkout. `git worktree` materialises **tracked files only**, so a fresh worktree is not a working checkout until you bootstrap it.

## What is missing, and what to do about it

| Missing | Why it matters | Fix |
|---|---|---|
| `node_modules/` | Nothing runs. | `npm ci` in the worktree, or symlink it — see below |
| `test/hyperformula-tests/` | The private suite is git-ignored, so every `npm run test:jest` run covers only the smoke tests | `npm run test:setup-private` |
| `lib/`, `dist/`, `es/`, `commonjs/`, `typings/`, `languages/` | `npm run test:browser` and the bundle checks have nothing to run against | `npm run bundle-all` |
| `docs/api/`, `docs/guide/built-in-functions.md` | The docs build fails, or serves nothing | `npm run docs:build` |
| `.dev.vars*` | `wrangler` commands fail | Copied automatically — see [`.worktreeinclude`](../.worktreeinclude) |

## The branch-matched test suite is the trap

`test/fetch-tests.sh` checks out the branch of the **same name** in the private test repository. Two consequences in a worktree:

1. Copying `test/hyperformula-tests/` from the main checkout brings the *other* branch's tests. They will run, and they will report results that have nothing to do with the code in front of you. `.worktreeinclude` deliberately does not copy it.
2. Run `npm run test:setup-private` once per worktree, and again after any branch switch inside it.

## Symlinking `node_modules`

`worktree.symlinkDirectories` in `.claude/settings.json` points each worktree's `node_modules/` at the main checkout's copy instead of duplicating it:

```json
{
  "worktree": {
    "symlinkDirectories": ["node_modules"]
  }
}
```

This is safe while HyperFormula is a single package: there is exactly one `node_modules/.bin`, and the symlink resolves it. **It stops being safe once the repository becomes a workspace** — package-local `node_modules/.bin` directories are not covered by a root-level symlink, and scripts then die mid-build with a bare `command not found`. Revisit this setting as part of the monorepo migration ([`STRUCTURE.md`](STRUCTURE.md#where-it-is-going)).

## Sparse checkouts

`worktree.sparsePaths` limits what git writes to disk. It buys little today — this repository is small and `src/` is needed by everything. It becomes worth setting once the packages in [`STRUCTURE.md`](STRUCTURE.md#where-it-is-going) exist and a task can be scoped to one of them.
