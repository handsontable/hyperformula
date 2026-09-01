# `hyperformula-ui/`

Reserved for the HyperFormula UI components: reference highlighting, the inline formula editor, and function help.

The package is not here yet — it is imported from the formula-builder repository in a separate change, preserving its history. Until then this directory holds only this file, and `hyperformula-ui` is listed in the root `workspaces` array so the workspace resolves once the package lands.

When importing it: keep the scope it publishes under today, give it an `.nvmrc` saying `22` and a `CHANGELOG.md` of its own, and add an `AGENTS.md` with a `CLAUDE.md` symlink beside it. See [`dev-docs/STRUCTURE.md`](../dev-docs/STRUCTURE.md#what-the-move-still-owes).
