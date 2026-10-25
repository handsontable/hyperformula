---
name: hyperformula-ui-dev
description: >
  Use for ANY work in `hyperformula-ui/`: the formula editor package (`hyperformula-ui`,
  in `hyperformula-ui/packages/core/`), its demo, its end-to-end suite, its build scripts
  and its shared configuration. Covers the editor, the formula bar, the lexer, the kernel,
  reference highlighting, autocomplete and function help popups, keyboard shortcuts,
  `IGridAdapter`, the generated stylesheet and API docs, and releasing the package. Triggers
  on file paths under `hyperformula-ui/`, or when the user describes a symptom in the formula
  editor without naming a file. Its code style is not the engine's: load this skill instead
  of `hyperformula-dev` for anything in this folder.
---

## 1. Read the relevant files from `dev-docs/`

Always:

| File | Why |
|---|---|
| [`ARCHITECTURE.md`](../../../hyperformula-ui/dev-docs/ARCHITECTURE.md) | The components, the data flow, and the invariants every change keeps |
| [`CODE-STYLE.md`](../../../hyperformula-ui/dev-docs/CODE-STYLE.md) | The conventions inside `hyperformula-ui/`, which differ from the engine's |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | What the change must contain before review |

Then the page for what you are changing:

| File | For |
|---|---|
| [`EDITOR-TASKS.md`](../../../hyperformula-ui/dev-docs/EDITOR-TASKS.md) | Which files implement tokenization, shortcuts, highlights, popups and the overlay |
| [`KEYBOARD-SHORTCUTS.md`](../../../hyperformula-ui/dev-docs/KEYBOARD-SHORTCUTS.md) | Any change to what a key does |
| [`SPEC.md`](../../../hyperformula-ui/dev-docs/SPEC.md) | The public API, the adapter contract, CSS, and the commands |
| [`TESTING.md`](../../../hyperformula-ui/dev-docs/TESTING.md) | Writing the test the change needs |
| [`RELEASE.md`](../../../hyperformula-ui/dev-docs/RELEASE.md) | Publishing the package — only when asked to release |

## 2. Work through them in order

1. Find the files with [`EDITOR-TASKS.md`](../../../hyperformula-ui/dev-docs/EDITOR-TASKS.md), and the invariants they must keep with [Key invariants](../../../hyperformula-ui/dev-docs/ARCHITECTURE.md#key-invariants).
2. Write the failing test first — [New behaviour](../../../hyperformula-ui/dev-docs/TESTING.md#new-behaviour) — with skill `test-writing-discipline`.
3. Change the code, then run the checks in [Checks while you work](../../../hyperformula-ui/dev-docs/EDITOR-TASKS.md#checks-while-you-work). Name the workspace by path, as [`SPEC.md`](../../../hyperformula-ui/dev-docs/SPEC.md#12-build--commands) says. Regenerate the stylesheet or the API docs when the change affects them.
4. Add the entry to [`hyperformula-ui/CHANGELOG.md`](../../../hyperformula-ui/CHANGELOG.md) when the change is user-facing, and finish everything in [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md).
