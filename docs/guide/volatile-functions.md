# Volatile functions

If you work with spreadsheet software regularly, then you've probably
heard about Volatile Functions. They are distinctive because they
affect the way the calculation engine works. **Every cell
dependent on a volatile function is recalculated upon every worksheet
change triggered by the operations listed below
(volatile actions).**

HyperFormula uses a dependency tree to keep track of all related
cells and ranges of cells. On top of that, it constructs a
calculation chain which determines the order in which the recalculation
process should be done.

Usually, only cells marked as "dirty" are calculated
selectively. However, this is not the case when a volatile function
exists somewhere within the workbook. Volatile functions are always
treated as "dirty" and recalculated on most actions.

Depending on how many cells are dependent directly or indirectly on
the volatile function, it may impact the engine's performance. Use them with caution, especially in large workbooks.

## Volatile functions

Volatile functions are recalculated on every volatile action, regardless of the arguments passed in the function call.
Functions that depend on the structure of the sheet act as if they were volatile but only on operations on the sheet structure, such as adding or removing rows or columns.

#### Built-in volatile functions:
 - RAND
 - RANDBETWEEN
 - NOW
 - TODAY

#### Built-in functions that depend on the structure of the sheet:
- COLUMN
- ROW
- COLUMNS
- ROWS
- FORMULATEXT

See the complete [list of functions](built-in-functions.md) available.

## Volatile actions

These actions trigger the recalculation process of volatile functions:

| Description                            | Related method          |
|:---------------------------------------|:------------------------|
| Recalculate on demand                  | `rebuildAndRecalculate` |
| Resume an automatic recalculation mode | `resumeEvaluation`      |
| Batch operations                       | `batch`                 |
| Modify cell content                    | `setCellContents`       |
| Modify sheet content                   | `setSheetContent`       |
| Clear sheet content                    | `clearSheet`            |
| Insert a row                           | `addRows`               |
| Remove a row                           | `removeRows`            |
| Insert a column                        | `addColumns`            |
| Remove a column                        | `removeColumns`         |
| Move a cell                            | `moveCells`             |
| Move a row                             | `moveRows`              |
| Move a column                          | `moveColumns`           |
| Add a defined name                     | `addNamedExpression`    |
| Modify a defined name                  | `changeNamedExpression` |
| Remove a defined name                  | `removeNamedExpression` |
| Add a sheet                            | `addSheet`              |
| Remove a sheet                         | `removeSheet`           |
| Rename a sheet                         | `renameSheet`           |
| Undo                                   | `undo`                  |
| Redo                                   | `redo`                  |
| Cut                                    | `cut`                   |
| Paste                                  | `paste`                 |

## Tweaking performance

The extensive use of volatile functions may cause a performance drop.
To reduce the negative effect, you can try
[batching these operations](batch-operations.md).

## Volatile custom functions

There is a way to mark a custom function as volatile:

```javascript
// this is an example of how the RAND function is implemented
// you can do the same with a custom function
  'RAND': {
      method: 'rand',
      isVolatile: true,
    },
```

You can find more information about creating custom functions in
[this section](custom-functions).
