# Volatile functions

If you work with spreadsheet software regularly then you probably heard about Volatile Functions. They are distinctive because they affect the way the calculation engine works. **Every cell that is dependent on a volatile function is recalculated on every worksheet change triggered by the operations enlisted further below \(volatile actions\).** 

HyperFormula uses the dependency tree to keep track of all related cells and ranges of cells. On top of that, it constructs the calculation chain which determines the order in which the recalculation process should be done.

Normally only cells that are marked as "dirty" are calculated selectively. However, it is not the case when a volatile function exists somewhere within the workbook. Volatile functions are always treated as "dirty" so they are recalculated whenever a certain action is triggered. 

Depending on how many cells are dependent directly or indirectly on the volatile function, it may have an impact on the performance of the engine. Use them with caution, especially in large workbooks.

### Volatile functions

HyperFormula supports RAND function which is always volatile which means that it triggers the recalculation of the cells across the entire calculation chain and regardless of the arguments passed in the formula. There are two other functions: COLUMNS and ROWS, they are usually non-volatile unless you perform an action on columns or rows like adding, removing them. In such cases, they behave like volatile functions.

The table below presents a list of volatile functions supported by HyperFormula that might be volatile:

| Function ID | Description |
| :--- | :--- |
| RAND | Returns a random number between 0 and 1. Always volatile. |
| COLUMNS | Returns the number of columns in the given reference. |
| ROWS | Returns the number of rows in the given reference. |

See the complete [list of functions](built-in-functions.md) available.

### Volatile actions

These actions trigger the recalculation process of volatile functions:

| Description | Related method |
| :--- | :--- |
| Recalculate on demand | `rebuildAndRecalculate` |
| Resume an automatic recalculation mode | `resumeEvaluation` |
| Bathes operations | `batch` |
| Modify a cell content | `setCellContents` |
| Modify a sheet content | `setSheetContent` |
| Clear a sheet from the content | `clearSheet` |
| Insert a row | `addRows` |
| Remove a row | `removeRows` |
| Insert a column | `addColumns` |
| Remove a column | `removeColumns` |
| Move a cell | `moveCells` |
| Move a row | `moveRows` |
| Move a column | `moveColumns` |
| Add a defined name | `addNamedExpression` |
| Modify a defined name | `changeNamedExpression` |
| Remove a defined name | `removeNamedExpression` |
| Add a sheet | `addSheet` |
| Remove a sheet | `removeSheet` |
| Rename a sheet | `renameSheet` |
| Undo | `undo` |
| Redo | `redo` |
| Cut | `cut` |
| Paste | `paste` |

### Tweaking performance

The extensive use of volatile functions may cause a performance drop. To reduce the negative effect you can try [batching these operations](batch-operations.md).

### Volatile custom functions

There is a way to define a custom function that you consider volatile. To do so, when you implement own function you need to define it as a volatile:

```javascript
// this is an example of how RAND function is implemented
// you can do the same with your own custom function
  'RAND': {
      method: 'rand',
      isVolatile: true,
    },
```

You can find more information about creating custom functions [in this section](creating-custom-functions.md).

