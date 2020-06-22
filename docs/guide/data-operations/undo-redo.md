# Undo-redo

HyperFormula supports undo-redo for CRUD and move operations. By default, you can **undo 20 actions.** The `undoLimit` can be changed inside the [configuration options](../getting-started/configuration-options.md) so you can adapt that number to your needs. Be careful when setting `undoLimit` to large numbers. It may result in performance issues.  
  
Undo and redo work together as a synced pair, so each time you **undo** some action it is put onto a **redo** stack. 

**Named expressions** will behave just like any other [CRUD operations](crud-operations.md).

### isThereSomething\* methods

There are two methods which can be used to check the actual state of the undo-redo stack:`isThereSomethingToUndo` and `isThereSomethingToRedo`.

### Batch operations

When you [batch several operations](batch-operations.md) remember that undo-redo will recognize them as a single cumulative operation.

### Demo

{% embed url="https://githubbox.com/handsontable/hyperformula-demos/tree/develop/undo-redo" %}



