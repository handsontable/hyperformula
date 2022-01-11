# Performance

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
However, binary search will not be used if the size of the data being
searched is below a given threshold, which can be customized using the
`binarySearchThreshold` option in the configuration.

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

## Suspending automatic recalculations

By default, HyperFormula recalculates formulas after every change.
However, due to the fact that we store the graph of dependencies
between cells in the sheet, we recalculate only the cells affected
by the update.

Sometimes, a simple change can cause recalculation of a large part
of the sheet, e.g. when the modified cell is at the very beginning
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

## GPU acceleration

You can speed up HyperFormula's [matrix functions](built-in-functions.md#matrix-functions) ([MMULT](built-in-functions.md#matrix-functions), [MAXPOOL](built-in-functions.md#matrix-functions), [MEDIANPOOL](built-in-functions.md#matrix-functions), and [TRANSPOSE](built-in-functions.md#matrix-functions)) with GPU acceleration.

With GPU acceleration (thanks to cores running thousands of threads
at once) the matrix functions calculate input data sets up to 9x faster than
when using the CPU. From our observation, the bigger the data set,
the bigger the performance gain.

**For small data sets, the difference between the CPU and GPU is
non-significant.**

[See how to enable GPU acceleration &#8594;](enabling-gpu-acceleration.md)