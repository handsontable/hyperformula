# Cell references

A formula can refer to one or more cells and automatically update its
contents whenever any of the referenced cells change. The values from
other cells can be obtained using A1 notation which is a flexible
way of pointing at different sources of data for the formulas.

The table below summarizes the most popular methods of referring to
different cells in the workbook.

<table>
  <thead>
    <tr>
      <th style="text-align:left">Type</th>
      <th style="text-align:left">Current sheet</th>
      <th style="text-align:left">Different sheet</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">Relative</td>
      <td style="text-align:left">=A1</td>
      <td style="text-align:left">=Sheet2!A1</td>
    </tr>
    <tr>
      <td style="text-align:left">Absolute</td>
      <td style="text-align:left">=$A$1</td>
      <td style="text-align:left">=Sheet2!$A$1</td>
    </tr>
    <tr>
      <td style="text-align:left">Mixed</td>
      <td style="text-align:left">=$A1</td>
      <td style="text-align:left">=Sheet2!$A1</td>
    </tr>
    <tr>
      <td style="text-align:left">Circular (example)</td>
      <td style="text-align:left">
        <p>A1=B1</p>
        <p><em>whereas</em>
        </p>
        <p>B1=A1</p>
      </td>
      <td style="text-align:left">
        <p>Sheet1!A1=Sheet2!A1</p>
        <p><em>whereas</em>
        </p>
        <p>Sheet2!A1=Sheet1!A1</p>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">Range</td>
      <td style="text-align:left">=A1:B2</td>
      <td style="text-align:left">=Sheet2!A1:B2</td>
    </tr>
  </tbody>
</table>

### Referring to named expressions

This is a special case in HyperFormula. Upon creation you define the
scope of the expression:

```javascript
// define for a global scope
// sheet id not passed
hfInstance.addNamedExpression('MyGlobal', '=SUM(100+10)');

// define for a local scope
// sheet id passed
hfInstance.addNamedExpression('MyLocal', '=Sheet2!$A$1+100', 1);
```

And now you can use 'MyGlobal' and 'MyLocal' names.

HyperFormula is more limited than
typical spreadsheet software when it comes to referring to named ranges.
For more information about how
HyperFormula handles named ranges,
see [this section](named-expressions.md).

## Relative references

Relative and absolute references play a huge role in
[copy and paste](clipboard-operations.md), autofill, and CRUD
operations like moving cells or columns.

By default, all references are relative which means that when you
copy them to other cells, the references are updated based on the
new coordinates. There are two main exceptions though: the move operation and named expressions, both of which use absolute references. HyperFormula provides
`copy` , `cut` and `paste` methods that allow for handling clipboard operations.

**Cut and paste** behaves a bit differently. If '=A1' is copied from cell B1 into B2 it will stay after being placed into B2.

**Copy and paste** will behave a bit different in a relative mean
- if '=A1' will be copied from B1 into B2 cell it will be '=A2'.

<table>
  <thead>
    <tr>
      <th style="text-align:left">Formula in A1</th>
      <th style="text-align:left">Action</th>
      <th style="text-align:left">Result in A2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">=B1+1</td>
      <td style="text-align:left">
        <p>Copy A1</p>
        <p>Paste to A2</p>
      </td>
      <td style="text-align:left">=B2+1</td>
    </tr>
  </tbody>
</table>

This example shows the change after the move operation was done:

```javascript
// build with a simple dataset
const hfInstance = HyperFormula.buildFromArray([
 ['=B2', '=A1', ''],
]);

// these are the coordinates for a move operation
const source = { sheet: 0, col: 1, row: 0 };
const destination = { sheet: 0, col: 2, row: 0 };

// move B1
const changes = hfInstance.moveCells({ start: source, end: source }, destination);

// you can see the changes inside the console
console.log(changes);
```

## Absolute references

A reference to a column (a letter) or a row (a number) may be
preceded with a dollar sign `$` to remain intact when the cell is
copied between different places.

<table>
  <thead>
    <tr>
      <th style="text-align:left">Formula in A1</th>
      <th style="text-align:left">Action</th>
      <th style="text-align:left">Result in A2 and A3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">=$B$1+1</td>
      <td style="text-align:left">
        <p>Copy A1</p>
        <p>Paste to A2</p>
        <p>Paste to A3</p>
      </td>
      <td style="text-align:left">=$B$1+1</td>
    </tr>
  </tbody>
</table>

## Range references

In HyperFormula, a range is a reference to a group of at least two adjacent cells.

### Range definition

Range `<Cell address 1>:<Cell address 2>` is a reference to the smallest possible group of adjacent cells that includes:

- The cell at `<Cell address 1>`
- The cell at `<Cell address 2>`
- If referencing across different sheets (so-called 3D reference): all cells on all sheets between `<Cell address 1>` and `<Cell address 2>`

### Range types

HyperFormula features the following types of ranges:

| Range type   | Description                         | Example                                       |
| ------------ | ----------------------------------- | --------------------------------------------- |
| Cell range   | Has the shape of a finite rectangle | =A1:B2<br>or =A2:B1<br>or =B1:A2<br>or =B2:A1 |
| Column range | Contains entire columns             | =A:B<br>or =B:A                               |
| Row range    | Contains entire rows                | =1:2<br>or =2:1                               |

### Referencing ranges

You can reference ranges:
- Through relative references (=A1:B2)
- Through absolute references (=A$1:$B$2)
- Across different sheets (=Sheet1!A1:Sheet5!B2)<br>If you don't specify a sheet name for the second cell address, the sheet name of the first cell address is used: `=Sheet5!A1:B2` is equivalent to `=Sheet5!A1:Sheet5!B2`.

### Range restraints

The following restraints apply:
- You can't mix two different types of range references together (=A1:B).
- Range expressions can't contain [named expressions](/guide/named-expressions.md).
- At the moment, HyperFormula doesn't support multi-cell range references (=A1:B2:C3).

::: tip
In contrast to Google Sheets or Microsoft Excel, HyperFormula doesn't treat single cells as ranges. Instead, it immediately instantiates references to single cells as their values. Applying a scalar value to a function that takes ranges throws the [`CellRangeExpected`](/api/classes/errormessage.md#cellrangeexpected) error.
:::

### More about ranges
- [Ranges in the dependency graph](/guide/dependency-graph.md#ranges-in-the-dependency-graph)
- [Types of operators: Reference operators](/guide/types-of-operators.md#reference-operators)
- [API reference: Ranges](/api/classes/hyperformula.md#ranges)

## Circular references

Since HyperFormula does not embed any UI, it allows for the input of a circular reference into a cell. Compared to popular spreadsheets,
HyperFormula does not force any specific interaction with the user
(i.e. displaying a warning ) when circular reference happens.

When circular reference happens, HyperFormula returns #CYCLE as
the value of the cell where the circular reference occurred. After
some CRUD operation is performed, the error might disappear when it is no longer
a cyclic dependency. No matter the outcome, other cells are
calculated normally and the dependency graph is updated. It
is **non-blocking**.

## The #REF! error

By deleting the cell that is referenced in a formula you make the
entire formula no longer valid. As a result, you will get the
#REF! error which indicates that there is an invalid address
used in a cell.

Consider the following example:

| Formula in C1 | Action          | Result in B1 |
| :------------ | :-------------- | :----------- |
| =A1+B1+20     | Delete column A | #REF!        |

The #REF! error may also occur in other specific situations:

* When you copy and paste formulas containing relative references,
or example:

<table>
  <thead>
    <tr>
      <th style="text-align:left">Formula in B1</th>
      <th style="text-align:left">Action</th>
      <th style="text-align:left">Result in A1</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">=A1+1</td>
      <td style="text-align:left">
        <p>Cut from B1</p>
        <p>Paste to A1</p>
      </td>
      <td style="text-align:left">#REF!</td>
    </tr>
  </tbody>
</table>

* When the VLOOKUP is told to look up values in a column whose
index is out of the scope.
* When the INDEX function is told to return values from rows or
columns that are out of the scope.