# Undo-redo

HyperFormula supports undo-redo for CRUD and move operations.
By default, you can **undo 20 actions.** The `undoLimit` can be changed
inside the [configuration options](configuration-options.md) so you
can adapt that number to your needs. Be careful when setting
`undoLimit` to large numbers. It may result in performance issues.

Undo and redo work together as a synced pair, so each time you
**undo** some action it is put onto a **redo** stack.

**Named expressions** behave just like any other
[CRUD operation](basic-operations).

## isThereSomething* methods

There are two methods which can be used to check the actual state
of the undo-redo stack:`isThereSomethingToUndo` and
`isThereSomethingToRedo`.

## Batch operations

When you [batch several operations](batch-operations.md) remember
that undo-redo will recognize them as a single cumulative operation.

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/undo-redo/example1.html)

@[code](@/docs/examples/undo-redo/example1.css)

@[code](@/docs/examples/undo-redo/example1.js)

@[code](@/docs/examples/undo-redo/example1.ts)

:::
