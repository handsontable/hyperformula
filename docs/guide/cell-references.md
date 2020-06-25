# Cell references

A formula can refer to one or more cells and automatically update its
contents whenever any of the referenced cells change. The values from
other cells can be obtained using an A1 notation which is a flexible
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
      <td style="text-align:left">=A1:C10</td>
      <td style="text-align:left">=Sheet2!A1:C10</td>
    </tr>
  </tbody>
</table>

### Referring to named expressions

It is a special case in HyperFormula. Upon creation you define the
scope of the expression:

```javascript
// define for a global scope
// sheet name not passed passed
hfInstance.addNamedExpression('MyGlobal', '=SUM(100+10)');

// define for a local scope
// sheet name passed
hfInstance.addNamedExpression('MyLocal', '=Sheet2!$A$1+100', 'Sheet2');
```

And now you can use 'MyGlobal' and 'MyLocal' names.

HyperFormula is more limited than
typical spreadsheet software when it comes to referring to named ranges.
For more information about how
HyperFormula handles the named ranges,
see [this section](named-ranges.md).

## Relative references

Relative and absolute references play a huge role in
[copy and paste](clipboard-operations.md), autofill, and CRUD
operations like moving cells or columns.

By default, all references are relative which means that when you
copy them to other cells, the references are updated based on the
new coordinates. There are two main exceptions though: move
operation which uses absolute references, and named expressions
that do not support relative references. HyperFormula provides
`copy` , `cut` and `paste` methods that allow handling the
clipboard operations.

**Cut and paste** will behave similarly to the move operation so
if in the cell B1 there is a formula '=A1' it will stay '=A1'
after being placed into B2.

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
const changes = hfInstance.moveCells(source, 1, 1, destination);

// you can see the changes inside the console
console.log(changes);
```

## Absolute reference

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

## Circular reference

Since HyperFormula does not embed any UI it will allow to input
circular reference into a cell. Compared to popular spreadsheets,
HyperFormula does not impose any specific interaction with the user
(i.e. displaying a warning ) when circular reference happens.

When circular reference happens, HyperFormula returns #CYCLE as
the value of the cell where circular reference occurred. After
some CRUD operation, the error might disappear when is no longer
a cyclic dependency. No matter what the outcome, other cells are
calculated normally and the dependency graph is updated. It
is **non-blocking**.

## The #REF! error

By deleting the cell that is referenced in a formula you make the
entire formula no longer valid. As a result, you will get the
#REF! error which indicates that there is an invalid address
used in a cell.

Consider the following example:

| Formula in C1 | Action | Result in B1 |
| :--- | :--- | :--- |
| =A1+B1+20 | Delete column A | #REF! |

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

* When the VLOOKUP is told to look up for values in a column which
index is out of the scope.
* When the INDEX function is told to return values from rows or
columns that are out of the scope.