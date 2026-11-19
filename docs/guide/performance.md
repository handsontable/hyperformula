---
title: "Performance"
tags:
  - speed
  - slow
  - memory
  - optimize
  - recalculate
  - useColumnIndex
  - chooseAddressMappingPolicy
  - maxPendingLazyTransformations
  - maxParserCacheSize
  - openEndedRangeMinRows
  - openEndedRangeMinColumns
---

We implemented various techniques to boost the performance of
HyperFormula. In some cases, turning them on or off might increase
the performance of your app. Below we provide a number of tips on
how to speed it up.

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

## Open-ended ranges

A formula often refers to a column from some row down to the last row of
the sheet, for example `=SUM(A2:A1048576)`. By default, HyperFormula keeps
a cell for every row of such a range, empty or not, so a single range can
add a million cells to the memory the engine uses. A whole-column range such
as `A:A` does not have this cost, but it cannot start below the first row.

The [`openEndedRangeMinRows`](../api/interfaces/configparams.md#openendedrangeminrows)
and [`openEndedRangeMinColumns`](../api/interfaces/configparams.md#openendedrangemincolumns)
options make a tall or a wide range behave like a whole-column or a
whole-row range. A range with at least that many rows, or at least that
many columns, is open-ended: it holds cells only as far as its sheet holds
cells, and it takes in the cells you set past them later. Both options are
`Number.MAX_SAFE_INTEGER` by default, which makes no range open-ended.

```javascript
const hf = HyperFormula.buildFromArray([
  ['=SUM(A2:A1048576)'],
  [10],
  [20],
], {
  licenseKey: 'gpl-v3',
  maxRows: 1048576,
  openEndedRangeMinRows: 32768,
})

// the sheet holds 3 rows, not 1,048,576
console.log(hf.getSheetDimensions(0)) // { width: 1, height: 3 }

// a cell set below the data is still a part of the range
hf.setCellContents({ sheet: 0, col: 0, row: 4999 }, 30)
console.log(hf.getCellValue({ sheet: 0, col: 0, row: 0 })) // 60
```

Choose values larger than the ranges your formulas use for ordinary data,
so that only ranges meant to run to the edge of a sheet are open-ended.
A range that reaches the last row of the sheet must fit within
[`maxRows`](../api/interfaces/configparams.md#maxrows) and
[`maxColumns`](../api/interfaces/configparams.md#maxcolumns), like any
other range.

`ROWS`, `COLUMNS`, `INDEX`, `COUNTBLANK`, and the criterion functions
(`COUNTIF`, `SUMIFS`, and similar) use the full size of an open-ended
range. A few results differ from those of an ordinary range. See the
[known limitations](known-limitations.md#open-ended-ranges).

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
