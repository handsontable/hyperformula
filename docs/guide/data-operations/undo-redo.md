# Undo-redo

HyperFormula supports undo-redo for CRUD and move operations. By default, you can **undo 20 actions.** The `undoLimit` can be changed inside the [configuration options](../getting-started/configuration-options.md) so you can adapt that number to your needs. Be careful when setting `undoLimit` to large numbers. It may result in performance issues.  
  
Undo and redo work together as a synced pair, so each time you **undo** some action it is put onto a **redo** stack. 

**Named expressions** will behave just like any other [CRUD operations](crud-operations.md).

### isThereSomething\* methods

There are two methods which can be used to check the actual state of the undo-redo stack:`isThereSomethingToUndo` and `isThereSomethingToRedo`.

### Batch operations

When you [batch several operations](batch-operations.md) remember that undo-redo will recognize them as a single cumulative operation.

### Demo

<iframe
   src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/develop/undo-redo?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview"
   style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
   title="handsontable/hyperformula-demos: basic-usage"
   allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
   sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>



