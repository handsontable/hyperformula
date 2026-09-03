---
tags:
  - speed
  - slow
  - memory
  - optimize
  - recalculate
  - loading
  - buildFromSheets
  - addSheet
  - useColumnIndex
  - chooseAddressMappingPolicy
  - maxPendingLazyTransformations
---

# Performance

We implemented various techniques to boost the performance of
HyperFormula. In some cases, turning them on or off might increase
the performance of your app. Below we provide a number of tips on
how to speed it up.

## Loading multiple sheets

Build the engine once with all the data instead of adding sheets one
by one. HyperFormula's
[`buildFromSheets`](../api/classes/hyperformula.md#buildfromsheets)
method takes every sheet in a single call and resolves the whole
dependency graph once:

```javascript
const hf = HyperFormula.buildFromSheets({
  Sheet1: [ ['1', '=Sheet2!A1'] ],
  Sheet2: [ ['10'] ],
}, { licenseKey: 'gpl-v3' })
```

Loading the same data incrementally, with an
[`addSheet`](../api/classes/hyperformula.md#addsheet) and a
[`setSheetContent`](../api/classes/hyperformula.md#setsheetcontent)
call per sheet, is much slower, and the gap widens with every sheet
added. Each [`setSheetContent`](../api/classes/hyperformula.md#setsheetcontent)
call recalculates every loaded cell that depends on the sheet it just
filled, so when the sheets already loaded reference the one being
added, the work grows with each step. In a test with 500
cross-referencing sheets, the per-sheet loop was more than a hundred
times slower than a single `buildFromSheets` call.

[`addSheet`](../api/classes/hyperformula.md#addsheet) adds to this
whenever the formulas already loaded point at the sheet being added:
it marks all the cells and ranges of that sheet as dirty and
recalculates on its own, which roughly doubles the cost of each step.
Registering all the sheet names upfront removes that half, because
there is nothing to recalculate yet when the names are registered, but
it does not remove the growth.

When the data is not known upfront and sheets have to be added at
runtime, group the operations into a
[batch](batch-operations.md), so that the recalculation runs once for
the whole group instead of once per operation. Note that during a
batch, and between
[`suspendEvaluation`](../api/classes/hyperformula.md#suspendevaluation)
and [`resumeEvaluation`](../api/classes/hyperformula.md#resumeevaluation),
the methods that read cell values throw an error instead of returning
a value (see [batch operations](batch-operations.md)). Keep whatever
renders your data from reading the engine until the evaluation is
resumed.

### The order of loading does not matter

A formula that references a sheet which has not been added yet
evaluates to `#REF!`, but the reference stays live: adding that sheet
later repairs the formula, with no re-parsing and no rebuild on your
side. Load the sheets in whatever order is convenient.

```javascript
const hf = HyperFormula.buildFromSheets({
  Hub: [ ['=Later!A1+1'] ],  // #REF! for now
}, { licenseKey: 'gpl-v3' })

hf.addSheet('Later')                                  // Hub!A1 is 1
hf.setSheetContent(hf.getSheetId('Later'), [ [41] ])  // Hub!A1 is 42
```

This also means that ordering the inserts by dependency is not a fix
for the cost described above. It helps only as long as every reference
happens to point the same way, and a single reference pointing back
puts you on the slow path again with nothing to signal it.

### Passing the engine to other libraries

Data grids and other integrations built on HyperFormula usually accept
either the `HyperFormula` class or a ready instance. Given the class,
they call [`buildEmpty`](../api/classes/hyperformula.md#buildempty) and
then add your sheets one at a time, which is the slow path above.
Build the instance yourself with `buildFromSheets` and hand that over
instead.

## VLOOKUP/MATCH

If you are planning to use VLOOKUP or MATCH heavily in your app,
you may consider enabling the `useColumnIndex` flag in the HyperFormula
configuration. It will increase memory usage but can significantly
improve the performance of these two functions, especially when
running on unsorted or very large data sets. The column index will
not be used despite the option `useColumnIndex` enabled when  using
**wildcards** or **regular expressions**.

Leaving this option disabled will cause the engine to use binary
search when dealing with sorted data, and the naive approach otherwise.

## Address mapping strategies

HyperFormula uses two approaches to store the mapping of cell
addresses in order to optimize memory usage. The choice of the
strategy is made independently for each sheet. The
`chooseAddressMappingPolicy` option allows for changing the way
the strategy will be chosen.

You may use one of three built-in policies:

* `AlwaysDense` – uses dense mapping for each sheet. This policy is
particularly useful when the spreadsheet is a densely filled rectangle.
* `AlwaysSparse` – uses sparse mapping for each sheet. This approach
is useful when in your spreadsheet/dataset there are relatively few
cells filled, but located very far from each other.
* `DenseSparseChooseBasedOnThreshold` – the choice is made based on
the fill ratio of the sheet. Let the engine choose the best strategy
for you.

## Lazy transformation cleanup

Structural operations (adding/removing rows/columns, moving cells) create
transformations that are applied lazily to formulas. Over time, these
transformations accumulate in memory. HyperFormula automatically flushes
them when their count reaches the `maxPendingLazyTransformations` threshold
(default: 50).

You can tune this setting to balance memory usage and CPU overhead:

* **Lower values** (e.g., 10) reduce peak memory usage but trigger
  cleanup more frequently, adding slight CPU overhead per flush.
* **Higher values** (e.g., 200) reduce the frequency of cleanup but
  allow more memory to accumulate between flushes.
* The default of **50** works well for most use cases.

```javascript
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  maxPendingLazyTransformations: 100,
})
```

## Suspending automatic recalculations

By default, HyperFormula recalculates formulas after every change.
However, due to the fact that we store the graph of dependencies
between cells in the sheet, we recalculate only the cells affected
by the update.

Sometimes, a simple change can cause recalculation of a large part
of the sheet, e.g., when the modified cell is at the very beginning
of the dependency chain or when there are many
[volatile functions](volatile-functions.md) in the worksheet.
In such a case you may want to postpone the recalculation.

The first option is to call `suspendEvaluation` before making
changes and `resumeEvaluation` at a convenient moment.

The second option is to pass the callback function with multiple
operations to a [batch function](batch-operations.md). Recalculation
will be suspended before performing operations and resumed after them.
In cases where you perform operations which may not cause a
recalculation but only change the shape of the worksheet, like
`addRows`, `removeRows`, or `moveColumns` , we do not recommend suspending
recalculation, as this may have a slightly negative impact on
performance.
