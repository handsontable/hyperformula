# hyperformula-ui developer documentation

The internals of the UI packages in `hyperformula-ui/`. Repository-wide standards (the definition of done, testing standards, documentation rules, pull requests) are in [`dev-docs/`](../../dev-docs/README.md) at the repository root; a fact lives in exactly one of the two.

| You are working on | Read |
|---|---|
| How the editor is built: components, data flow, invariants | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| The full design: layout, public API, lexer, highlights, behaviours, CSS | [`SPEC.md`](SPEC.md) |
| Where a common change goes | [`EDITOR-TASKS.md`](EDITOR-TASKS.md) |
| What every key does in the editor | [`KEYBOARD-SHORTCUTS.md`](KEYBOARD-SHORTCUTS.md) |
| Code style inside `hyperformula-ui/` | [`CODE-STYLE.md`](CODE-STYLE.md) |
| The unit and end-to-end suites | [`TESTING.md`](TESTING.md) |
| Reviewing a change to `hyperformula-ui/` | [`REVIEWING.md`](REVIEWING.md) |
| Publishing the package to npm | [`RELEASE.md`](RELEASE.md) |

The public API, generated from the JSDoc, is [`packages/core/DOCS.md`](../packages/core/DOCS.md).
