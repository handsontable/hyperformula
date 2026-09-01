# Working in a linked git worktree

Claude Code can run a session — or an isolated subagent — in a `git worktree` so its changes stay off your main checkout. `git worktree` materialises **tracked files only**, so a fresh worktree is not a working checkout until you bootstrap it.

## What is missing, and what to do about it

| Missing | Why it matters | Fix |
|---|---|---|
| `node_modules/` | Nothing runs. | `npm ci` in the worktree |
| `hyperformula/test/hyperformula-tests/` | The private suite is git-ignored, so every `npm run test:jest` run covers only the smoke tests | `npm run test:setup-private` |
| `hyperformula/{lib,dist,es,commonjs,typings,languages}/` | `npm run test:browser` and the bundle checks have nothing to run against | `npm run bundle-all` |
| `docs/api/`, `docs/guide/built-in-functions.md` | The docs build fails, or serves nothing | `npm run docs:build` |
| `.dev.vars*` | `wrangler` deploy and preview fail | Copy it yourself if you need it. Deploy credentials are deliberately **not** copied into worktrees — see [`.worktreeinclude`](../.worktreeinclude) |

## The branch-matched test suite is the trap

`hyperformula/test/fetch-tests.sh` checks out the branch of the **same name** in the private test repository. Two consequences in a worktree:

1. Copying `hyperformula/test/hyperformula-tests/` from the main checkout brings the *other* branch's tests. They will run, and they will report results that have nothing to do with the code in front of you. `.worktreeinclude` copies nothing at all, for this reason among others.
2. Run `npm run test:setup-private` once per worktree, and again after any branch switch inside it.

## Do not symlink `node_modules`

`worktree.symlinkDirectories` used to point each worktree's `node_modules/` at the main checkout's copy. It was removed when the repository became a workspace, and should not come back.

A root-level symlink was safe while there was exactly one `node_modules/.bin`. In a workspace it is not: npm may place a package-local `node_modules/.bin` under a package, which the symlink does not cover, and scripts then die mid-build with a bare `command not found`. Worse, `npm ci` inside a worktree whose `node_modules` is a symlink installs *through* it, so the main checkout and every other worktree silently get that branch's dependency tree.

Run `npm ci` in the worktree. The portal is a separate install either way — `npm run docs:install`.

## Sparse checkouts

`worktree.sparsePaths` limits what git writes to disk. Worth setting once a task can be scoped to one package — `[".claude", "hyperformula"]` for engine work. It is not set by default, because a task that turns out to span packages then fails in a confusing way.
