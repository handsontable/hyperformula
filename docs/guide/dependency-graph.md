# Dependency graph

HyperFormula needs to understand the relationship between cells and
find the right order of processing them. For example, for a sample
formula `C1=A1+B1`, `A1` and `B1` need to be evaluated before `C1`.

To find the order of processing the cells, HyperFormula builds a [directed graph](https://en.wikipedia.org/wiki/Directed_graph) (called **dependency graph**).
In the basic version of the graph, each node represents a spreadsheet cell.
Nodes X and Y are connected by a directed edge if and only if formula in the cell X contains the address of the cell Y. 

## Ranges in the dependency graph

In the actual dependency graph, ranges are also included as separate nodes.
Range nodes may be connected to cell nodes or to other range nodes. 

<img :src="$withBase('/ranges.png')">

### Optimizations for large ranges

In many applications, you may want to use formulas that depend on a
large range of cells. For example, the formula `SUM(A1:A100)+B5`
depends on 101 cells, and it needs to be represented in the dependency graph accordingly.

An interesting optimization challenge arises when there are multiple
cells that depend on large ranges. For example, consider the following
use-case:

* `B1=SUM(A1:A1)`
* `B2=SUM(A1:A2)`
* `B3=SUM(A1:A3)`
* ...
* `B100=SUM(A1:A100)`

The problem is that there are `1+2+3+...+100 = 5050` dependencies
for such a simple situation. In general, for `n` such rows, the
engine would need to add `n*(n+1)/2 ≈ n²` arcs in the graph. This
value grows much faster than the size of data, meaning the engine
would not be able to handle large data sets efficiently.

A solution to this problem comes from the observation that there is
a way to rewrite the above formulas to equivalent ones, which will
be more compact to represent. Specifically, the following formulas
would compute the same values as the ones provided previously:

* `B1=A1`
* `B2=B1+A2`
* `B3=B2+A3`
* ...
* `B100=B99+A100`

Whereas this example is too specialized to provide a useful rule
for optimization, it shows the main idea behind efficient handling
of multiple ranges: **to represent a range as a composition of
smaller ranges.**

In the adopted implementation, every time the engine encounters a
range, say `B5:D20`, it checks if it has already considered the
range which is one row shorter. In this example, it would be `B5:D19`.
If so, then it represents `B5:D20` as the composition of a range
`B5:D19` and three cells in the last row: `B20`,`C20` and `D20`.

<img :src="$withBase('/ranges.png')">

More generally, the result of any associative operation is obtained
as the result of operations for these small rows. There are many
examples of such associative functions: `SUM`, `MAX`, `COUNT`, etc.
As one range can be used in different formulas, we can reuse its
node and avoid duplicating the work during computation.

## Getting the graph neighbors of a cell

HyperFormula API includes methods that reveal parts of the dependency graph. In particular, they return the graph neighbors of a given cell.
- [getCellPrecedents](../api/classes/hyperformula.html#getcellprecedents) for getting the in-neighbors
- [getCellDependents](../api/classes/hyperformula.html#getcelldependents) for getting the out-neighbors

## Getting all precedents or dependents of a cell

Some applications may require processing all the precedents or dependents of a specified cell (not only immediate). In terms of graph theory, this problem can be stated as finding all the nodes reachable from the source node.

Methods `getCellPrecedents` and `getCellDependents` return only the immediate precedents and dependents of a cell respectively, but they can be used to implement the algorithm for the reachability problem applying the [BFS](https://en.wikipedia.org/wiki/Breadth-first_search) -like approach:

```
 1      AllCellPrecedents={start}
 2      let Q be an empty queue
 4      Q.enqueue(start)
 5      while Q is not empty do
 6          cell := Q.dequeue()
 7          S := getCellPrecedents(cell)
 9          for all cells c in S do:
10              if c is not in AllCellPrecedents then:
11                  insert w to AllCellPrecedents
12                  Q.enqueue(c)
```

`AllCellDependents` algorithm can be obtained by changing `getCellPrecedents` usage to `getCellDependents` in the pseudocode above.
