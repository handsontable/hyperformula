---
title: "Performance"
tags:
  - speed
  - slow
  - memory
  - optimize
  - recalculate
  - buildFromSheets
  - addSheet
  - useColumnIndex
  - chooseAddressMappingPolicy
  - maxPendingLazyTransformations
  - maxParserCacheSize
---

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
call per sheet, can be much slower, and the gap widens with every
sheet added. Each [`setSheetContent`](../api/classes/hyperformula.md#setsheetcontent)
call recalculates every loaded cell that depends on the sheet it just
filled, so when the sheets already loaded reference the one being
added, the work grows with each step. In a test with 500
cross-referencing sheets, the per-sheet loop was more than a hundred
times slower than a single `buildFromSheets` call.

[`addSheet`](../api/classes/hyperformula.md#addsheet) adds to this
whenever the formulas already loaded point at the sheet being added:
it marks all the cells and ranges of that sheet as dirty and
recalculates on its own; in the 500-sheet test that roughly doubled
the cost of each step. Registering all the sheet names upfront removes
that share, because there is nothing to recalculate yet when the names
are registered, but it does not remove the growth.

When the data is not known upfront and sheets have to be added at
runtime, group the operations into a [batch](batch-operations.md) so
that the recalculation runs once for the whole group instead of once
per operation, and keep whatever renders your data from reading the
engine until the batch ends: the methods that read cell values throw
while the evaluation is suspended. See
[suspending automatic recalculations](#suspending-automatic-recalculations)
below.

### Order of loading

Since version 3.1.1, a formula that references a sheet which has not
been added yet evaluates to `#REF!` but keeps a live reference: adding
that sheet later repairs the formula, with no re-parsing and no
rebuild on your side. The results therefore do not depend on the
order in which you add the sheets.

```javascript
const hf = HyperFormula.buildFromSheets({
  Hub: [ ['=Later!A1+1'] ],  // #REF! for now
}, { licenseKey: 'gpl-v3' })

hf.addSheet('Later')                                  // Hub!A1 is 1
hf.setSheetContent(hf.getSheetId('Later'), [ ['41'] ])  // Hub!A1 is 42
```

The order still affects the cost. Each
[`setSheetContent`](../api/classes/hyperformula.md#setsheetcontent)
call recalculates the loaded cells that depend on the sheet it fills,
so the cost grows with how much of the loaded data depends on sheets
not loaded yet. Adding every sheet after the sheets it references
keeps the per-sheet loop close to a single `buildFromSheets` call, and
a few formulas that point at sheets added later cost little. Adding
the sheets in the reverse order makes every step recalculate the
sheets added before it. In a test with 150 sheets of 10 rows by 40
columns, each reading the previous sheet, the per-sheet loop took
0.6 seconds in dependency order and 31 seconds in reverse order,
against 0.5 seconds for `buildFromSheets`. `buildFromSheets` does not
depend on the order, so it is the safe choice when you cannot
guarantee one.

### One engine, not one per sheet

Splitting the sheets across several engine instances does not avoid
the recalculation that each per-sheet `setSheetContent` call triggers
when loaded cells depend on the sheet it fills. A formula can only
reference a sheet that lives in the same instance: pointing at a sheet
held by another one evaluates to `#REF!`, the same as pointing at a
sheet that does not exist. So sharding by instance does not divide the
work, it removes the cross-sheet references that made the work
necessary – which is usually the feature the sheets were loaded for.

### Passing the engine to other libraries

A library you hand HyperFormula to may accept either the
`HyperFormula` class or a ready instance. Given the class, it builds
the engine on its own terms, and an integration that receives your
sheets one at a time will add them the same way: an `addSheet` and a
`setSheetContent` call per sheet, each recalculating the loaded cells
that depend on the sheet it fills. Building the instance yourself with
`buildFromSheets` and passing that instead helps only if the library
then reads the sheets from that instance. A library that writes each
sheet's data into the engine again, for example when each of its grids
is created with its own data, recalculates every loaded cell that
depends on each sheet it rewrites. On top of the build, that can cost
more than adding the sheets one at a time in dependency order.

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

## Parser cache size

HyperFormula reuses parsed formulas to avoid repeating parsing work. The
[`maxParserCacheSize`](../api/interfaces/configparams.md#maxparsercachesize)
option limits this cache to 10,000 entries by default. Once full, the cache
discards the least recently used entries as new formulas are parsed.

For long-running instances that process many distinct formulas, a smaller limit
can reduce memory retained by the cache at the cost of more parsing work. The
cache also lets cells share parts of parsed formulas. If many cells reuse the
same formulas, reducing the limit can increase total memory use by retaining
more separate syntax trees. If a workbook repeats more distinct formulas than the
limit, for example the same layout on several sheets, raise the limit above that
number. Measure with a representative workbook before tuning the
limit. Set it to `0` to disable parser caching, or to `Number.MAX_SAFE_INTEGER`
to keep every entry. Formula calculation, undo/redo, and clipboard operations
continue to work with any supported cache limit.

The limit counts cache entries, not bytes or cells. Formulas still needed by
the workbook, undo/redo history, or clipboard remain in memory independently
of the cache. Use [`undoLimit`](../api/interfaces/configparams.md#undolimit)
to control the length of undo history separately.

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
