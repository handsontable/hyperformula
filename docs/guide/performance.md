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

## Numeric matrix detection

HyperFormula is able to optimize underlying data structures when it
detects consistent areas of numerical data. It is especially useful
when dealing with calculations on huge numerical data sets. You may
consider disabling this option completely by setting `matrixDetection`
to false or adjusting the `matrixDetectionThreshold` option to customize
the size of the numerical areas to better fit your use case.

It is worth mentioning that some of the CRUD operations, like
inserting non-numerical data, may lead to disabling optimization
for affected areas.

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

Some formulas, e.g. MMULT, MAXPOOL, MEDIANPOOL, benefit from
GPU acceleration. Thanks to the cores running thousands of threads
at once, they calculate the input data sets up to 9x faster than
when using the CPU. According to our observations the bigger the data set is,
the bigger the performance gain.

**For small data sets, the difference between the CPU and GPU is
non-significant.**

[See how to enable GPU acceleration &#8594;](enabling-gpu-acceleration.md)

## Benchmarks

HyperFormula's performance has been tested on different devices,
operating systems, and browsers. The table below presents the result
of tests in which the engine multiplies two matrices of
2000 cells, each using the MMULT formula. The main objective of this
benchmark is to show a significant difference in performance between the
CPU and GPU.

The tests were run on three different physical machines with the
following specifications:

* **MacBook Pro (2015)** - 2.7 GHz Intel Core i5, 16 GB 1867 MHz DDR3,
Intel Iris Graphics 6100 1536 MB, macOS Mojave, Chrome.
* **Lenovo ThinkBook (2019)** - Intel Core i5 8gen 8265U 1.6 - 3.9 GHz,
8 GB RAM DDR4 2400 MHz, Intel UHD Graphics 620, Windows 10 Pro, Firefox.
* **Huawei Mate 20 (2018)** - Octa-core (2x2.6 GHz 2x Cortex-A76
& 4x1.8 GHz Cortex-A55), 4 GB RAM HiSilicon Kirin 980, Mali-G76 MP10,
Android Pie (9), Chrome.

The resulting times are returned in seconds.

|   | **GPU** | **CPU** |
| :--- | :--- | :--- |
| Number of rows | 2000 |  2000 |
| Number of columns | 2000 | 2000  |
| Number of cells | 4 million |  4 million |
| Number of repeats | 100 |  100 |
|   |   |   |
| **MacBook Pro** |   |   |
| Average total time | 2.921 | 18.570 |
| Standard deviation | 0.117 | 1.981 |
|   |   |   |
| **Lenovo ThinkBook** |   |   |
| Average total time | 3.041 | 10.543 |
| Standard deviation | 0.138 | 0.045 |
|   |   |   |
| **Huawei Mate 20** |   |   |
| Average total time | 6.611 | 40.166 |
| Standard deviation | 0.394 | 0.594 |
