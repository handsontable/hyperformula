# Key concepts

### High-level design diagram

![](/assets/hf-high-lvl-diagram.svg)

The data processing consists of three phases.

### **Phase 1. Parsing and construction of ASTs** 

Formulas need to be parsed and represented as a so-called [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) \(AST\). For example, the AST for `7*3-SIN(A5)` looks will look similar to this graph:

![](/assets/ast.png)

### \*\*\*\*

### **Phase 2. Construction of the dependency graph**

HyperFormula needs to understand the relationship between cells and find the right order of processing them. For example, for a sample formula `C1=A1+B1`, it needs to process first `A1` and `B1` and then `C1`. Such an order of processing cells - also known as [topological order](https://en.wikipedia.org/wiki/Topological_sorting) - exists if and only if there is no cycle in the dependency graph. 

There can be many such orders, like so:

![](/assets/topsort.png)

### \*\*\*\*

### **Phase 3. Evaluation**

It is crucial to evaluate cells efficiently. For simple expressions**,** there is not much room for maneuver, but spreadsheet-like data sets definitely need more attention.

![](/assets/sample-sheet.png)

### Grammar

For this parsing purposes, the library uses the [Chevrotain](http://sap.github.io/chevrotain/docs/) parser, which turns out to be more efficient than popular [Jison](https://zaa.ch/jison/). The language of acceptable formulas is described with a LL\(k\) grammar using Chevrotain Domain Specific Language. See details of the grammar in the [FormulaParser](https://github.com/handsontable/hyperformula/blob/develop/src/parser/FormulaParser.ts) file.

### Repetitive ASTs

A first natural optimization could concern cells in a spreadsheet which store exactly the same formulas. For such cells, there is no point in constructing and storing two ASTs which would be the same in the end. Instead, HyperFormula can look up the particular formula that has already been parsed and reuse the constructed AST.

A scenario with repeating formulas is somewhat idealized; in practice, most formulas will be distinct. Fortunately, formulas in spreadsheets usually have a defined structure and share some patterns. Especially, after filling cells using a fill handle \(that little square in the bottom right corner of a visual cell representation\), neighboring cells contain similar formulas, for example:

* `B2=A2-C2+B1`
* `B3=A3-C3+B2`
* `B4=A4-C4+B3`
* `B5=A5-C5+B4` and so on...

Although the exact ASTs for these formulas are different, they share a pattern. A very useful approach here is to rewrite a formula using relative addressing of cells.

### **Relative addressing**

HyperFormula stores the offset to the referenced formula, for example `B2=B5+C1` can be rewritten to `B2=[B+0][2+3]+[B+1][2-1]` or in short `B2=[0][+3] + [+1][-1]`. Then, the above example with `B2,B3` and `B4` can be rewritten as `B2=B3=B4=[-1][0]-[1][0]+[0][-1]` and now the three cells have exactly the same formulas.

By using relative addressing HyperFormula unifies formulas from many cells. Thanks to that, there is no need to parse them all over and over again. Also, with this approach, the engine doesn't lose any information because, knowing the absolute address of a cell and its formula with relative addresses, it can easily retrieve the absolute addresses and compute the value of the cell.

### **Laziness of CRUD operations**

After each CRUD operation, like adding a row or column or moving cells, references inside formulas may need to be changed. For example, after adding a row, we need to shift all references in the formulas below like so:

![](https://lh4.googleusercontent.com/f5iIxRW8A_FIrZa8dcSayIvdVeuxznaZ7y8zzb5I3hRN2TvzeKKoFiV1rDmdLmXY2AjxToSZJVmya9drrcmvjRhEbKFr4jmQ9d14B0_2XGwKftbnMisly2gmxvxbvhrzr2U_FwvC)

In more complex sheets this can lead to similar transformations in many formulas at once. On the other hand, such operations do not require an immediate transformation of all the affected formulas. 

Instead of transforming all of them at once, HyperFormula remembers the history of the operations and postpones the transformations until the formula needs to be displayed or recalculated.

### Handling ranges

In many applications, you may want to use formulas that depend on a large range of cells. For example, the formula `SUM(A1:A100)+B5` depends on 101 cells and it needs to be represented in the graph of cell dependencies accordingly.

An interesting optimization challenge arises when the are multiple cells that depend on large ranges. For example, consider the following use-case:

* `B1=SUM(A1:A1)`
* `B2=SUM(A1:A2)`
* `B3=SUM(A1:A3)`
* ...
* `B100=SUM(A1:A100)`

The problem is that there are `1+2+3+...+100 = 5050` dependencies for such a simple situation. In general, for `n` such rows, the engine would need to add `n*(n+1)/2 ≈ n²` arcs in the graph. This value grows much faster than the size of data, meaning the engine would not be able to handle large data sets efficiently.

A solution to this problem comes from the observation that there is a way to rewrite the above formulas to equivalent ones, which will be more compact to represent. Specifically, the following formulas would compute the same values as the ones provided previously:

* `B1=A1`
* `B2=B1+A2`
* `B3=B2+A3`
* ...
* `B100=B99+A100`

Whereas this example is too specialized to provide a useful rule for optimization, it shows the main idea behind efficient handling of multiple ranges: **to represent a range as a composition of smaller ranges.**

In the adopted implementation, every time the engine encounters a range, say `B5:D20`, it checks if it has already considered the range which is one row shorter. In this example, it would be `B5:D19`. If so, then it represents `B5:D20` as the composition of a range `B5:D19` and three cells in the last row: `B20`,`C20` and `D20`.

![](/assets/ranges.png)

More generally, the result of any associative operation is obtained as the result of operations for these small rows. There are many examples of such associative functions: `SUM`, `MAX`, `COUNT`, etc. As one range can be used in different formulas, we can reuse its node and avoid duplicating the work during computation.  


