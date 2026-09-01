# `hyperformula-ui/`

Reserved for the HyperFormula UI components: reference highlighting, the inline formula editor, and function help.

The package is not here yet — it is imported from the formula-builder repository in a separate change, preserving its history. Until then this directory holds only this file, and it is **not** listed in the root `workspaces` array: npm silently ignores an entry with no `package.json`, and the lockfile would then have to be regenerated anyway when the real package arrives. Add the entry in the same change that adds the package, and commit the resulting `package-lock.json` with it.

When importing it: keep the scope it publishes under today, give it an `.nvmrc` saying `22` and a `CHANGELOG.md` of its own, and add an `AGENTS.md` with a `CLAUDE.md` symlink beside it. See [`dev-docs/STRUCTURE.md`](../dev-docs/STRUCTURE.md#what-the-move-still-owes).
