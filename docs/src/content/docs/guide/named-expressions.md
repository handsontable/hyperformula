---
title: "Named expressions"
---


An expression can be assigned a human-friendly name. Thanks to this you can
refer to that name anywhere across the workbook. Names are especially useful
when you use some references repeatedly. In this case, names simplify the
formulas and reduce the risk of making a mistake. Such a worksheet is also
easier to maintain.

You can name a formula, string, number, or any other type of data.

By default, references in named expressions are absolute. Most people use
absolute references in spreadsheet software like Excel without even knowing
about it. Very few know that references can be relative too. Unfortunately,
HyperFormula doesn't support relative references inside named expressions at the
moment.

Dynamic ranges are supported through functions such as INDEX and OFFSET.

Named ranges can overlap each other, e.g., it is possible to define the names as
follows:

- rangeOne: Sheet1!$A$1:$D$10
- rangeTwo: Sheet1!$A$1:$E$1

## Examples

| Type                    | Custom name | Example expression        |
|:------------------------|:------------|:--------------------------|
| Named cell              | myCell      | =Sheet1!$A$1              |
| Named range of cells    | myRange     | =Sheet1!$A$1:$D$10        |
| Named constant (number) | myNumber    | =10                       |
| Named constant (string) | myText      | ="One Small Step for Man" |
| Named formula           | myFormula   | =SUM(Sheet1!$A$1:$D$10)   |

## Naming rules

Expression names are case-insensitive, and they:

- Must start with a Unicode letter or with an underscore (`_`).
- Can contain only Unicode letters, numbers, underscores, and periods (`.`).
- Can't be the same as any possible reference in the A1 notation (for example,
  `Q4` or `YEAR2023`).
- Can't be the same as any possible reference in the R1C1 notation (for example,
  `R4C5`, `RC` or `R0C`).
- Must be unique within a given scope.

:::tip
Expression names must be unique within a given scope, but you can override a
global named-expression with a local one. For example:

```javascript
// `MyRevenue` has to be unique within the global scope
hfInstance.addNamedExpression('MyRevenue', '=SUM(100+10)');

// but you can still use `MyRevenue` within the local scope of Sheet2 (sheetId = 1)
hfInstance.addNamedExpression('MyRevenue', '=Sheet2!$A$1+100', 1);
```
:::

For examples of valid and invalid expression names, see the following table:

| Name        | Validity |
|:------------|:---------|
| my Revenue  | Invalid  |
| myRevenue   | Valid    |
| quarter1    | Invalid  |
| quarter_1   | Valid    |
| 1stQuarter  | Invalid  |
| _1stQuarter | Valid    |
| .NET        | Invalid  |
| ASP.NET     | Valid    |
| A1          | Invalid  |
| $A$1        | Invalid  |
| RC          | Invalid  |

## Using named expressions in formulas

Named expressions can be used in any formula by referencing their names. Use them anywhere you would normally use a cell reference, range, or constant value.

```javascript
// Define named expressions
hfInstance.addNamedExpression('TaxRate', '=0.08');
hfInstance.addNamedExpression('SalesData', '=Sheet1!$A$1:$A$10');

// Use them in formulas
hfInstance.setCellContents({sheet: 0, col: 2, row: 0}, [['=SUM(SalesData)']]);
hfInstance.setCellContents({sheet: 0, col: 2, row: 1}, [['=SUM(SalesData) * TaxRate']]);
```

## Available methods

These are the basic methods that can be used to add and manipulate named
expressions, including the creation and handling of named ranges. The full list
of methods is available in the [API reference](/docs/api).

### Adding a named expression

You can add a named expression in two ways:

**During engine initialization**: You can provide named expressions as a parameter when creating a HyperFormula instance using the factory methods `buildEmpty`, `buildFromArray`, or `buildFromSheets`. This is the most efficient way to add multiple named expressions at once.

```javascript
// Define named expressions during initialization
const namedExpressions = [
  {
    name: 'prettyName',
    expression: '=Sheet1!$A$1+100',
    scope: 0 // optional: local scope for 'Sheet1'
  },
  {
    name: 'globalConstant', 
    expression: '=42'
    // no scope specified = global scope
  }
];

// Create engine with named expressions
const hfInstance = HyperFormula.buildEmpty({}, namedExpressions);
// or
const hfInstance = HyperFormula.buildFromArray(sheetData, {}, namedExpressions);
// or  
const hfInstance = HyperFormula.buildFromSheets(sheetsData, {}, namedExpressions);
```

**After engine creation**: You can add a named expression by using the `addNamedExpression` method. It accepts name for the expression, the expression as a raw cell content, and optionally the scope. If you do not define the scope it will be set to global, meaning the expression name will be valid for the whole workbook. If you want to add many of them, it is advised to do so in a [batch](/docs/guide/batch-operations). This method returns [an array of changed cells](/docs/guide/basic-operations#changes-array).

```javascript
// add 'prettyName' expression to the local scope of 'Sheet1' (sheetId = 0)
const changes = hfInstance.addNamedExpression(
  'prettyName',
  '=Sheet1!$A$1+100',
  0
);
```

### Changing a named expression

You can change a named expression by using the `changeNamedExpression` method.
Select the name of an expression to change and pass it as the first parameter,
then define the new expression as raw cell content and optionally add the scope.
If you do not define the scope it will be set to global, meaning the expression
will be valid for the whole workbook. If you want to change many of them, it is
advised to do so in a [batch](/docs/guide/batch-operations).
This method returns [an array of changed cells](/docs/guide/basic-operations#changes-array).

```javascript
// change the named expression
const changes = hfInstance.changeNamedExpression(
  'prettyName',
  '=Sheet1!$A$1+200'
);
```

### Removing a named expression

You can remove a named expression by using the `removeNamedExpression` method.
Select the name of an expression to remove and pass it as the first parameter
and optionally define the scope. If you do not define the scope it will be
understood as global, meaning, the whole workbook.
This method returns [an array of changed cells](/docs/guide/basic-operations#changes-array).

```javascript
// remove 'prettyName' expression from 'Sheet1' (sheetId=0)
const changes = hfInstance.removeNamedExpression('prettyName', 0);
```

### Listing all named expressions

You can retrieve a whole list of named expressions by using the
`listNamedExpressions` method. It requires no parameters and returns all named
expressions as an array of strings.

```javascript
// get all named-expression names
const listOfExpressions = hfInstance.listNamedExpressions();
```

## Handling errors

Operations on named expressions throw errors when something goes wrong. These
errors can be [handled](/docs/guide/basic-operations#handling-an-error) to provide a good
user experience in the application. It is also possible to check the
availability of operations using `isItPossibleTo*` methods, which are also
described in [that section](/docs/guide/basic-operations#isitpossibleto-methods).

## Demo

<div class="hf-example not-content">
<style>
/* general */
.example {
  color: #606c76;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: .01em;
  line-height: 1.6;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}
.example *,
.example *::before,
.example *::after {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}
/* buttons */
.example button {
  border: 0.1em solid #1c49e4;
  border-radius: .3em;
  color: #fff;
  cursor: pointer;
  display: inline-block;
  font-size: .85em;
  font-family: inherit;
  font-weight: 700;
  height: 3em;
  letter-spacing: .1em;
  line-height: 3em;
  padding: 0 3em;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  margin-bottom: 20px;
  background-color: #1c49e4;
}
.example button:hover {
  background-color: #2350ea;
}
.example button.outline {
  background-color: transparent;
  color: #1c49e4;
}
/* labels */
.example label {
  display: inline-block;
  margin-left: 5px;
}
/* inputs */
.example input:not([type='checkbox']), .example select, .example textarea, .example fieldset {
  margin-bottom: 1.5em;
  border: 0.1em solid #d1d1d1;
  border-radius: .4em;
  height: 3.8em;
  width: 12em;
  padding: 0 .5em;
}
.example input:focus,
.example select:focus {
  outline: none;
  border-color: #1c49e4;
}
/* message */
.example .message-box {
  border: 1px solid #1c49e433;
  background-color: #1c49e405;
  border-radius: 0.2em;
  padding: 10px;
}
.example .message-box span {
  animation-name: cell-appear;
  animation-duration: 0.2s;
  margin: 0;
}
/* table */
.example table {
  table-layout: fixed;
  border-spacing: 0;
  overflow-x: auto;
  text-align: left;
  width: 100%;
  counter-reset: row-counter col-counter;
}
.example table tr:nth-child(2n) {
  background-color: #f6f8fa;
}
.example table tr td,
.example table tr th {
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 0.1em solid #e1e1e1;
  padding: 0 1em;
  height: 3.5em;
}
/* table: header row */
.example table thead tr th span::before {
  display: inline-block;
  width: 20px;
}
.example table.spreadsheet thead tr th span::before {
  content: counter(col-counter, upper-alpha);
}
.example table.spreadsheet thead tr th {
  counter-increment: col-counter;
}
/* table: first column */
.example table tbody tr td:first-child {
  text-align: center;
  padding: 0;
}
.example table thead tr th:first-child {
  padding-left: 40px;
}
.example table tbody tr td:first-child span {
  width: 100%;
  display: inline-block;
  text-align: left;
  padding-left: 15px;
  margin-left: 0;
}
.example table tbody tr td:first-child span::before {
  content: counter(row-counter);
  display: inline-block;
  width: 20px;
  position: relative;
  left: -10px;
}
.example table tbody tr {
  counter-increment: row-counter;
}
/* table: summary row */
.example table tbody tr.summary {
  font-weight: 600;
}
/* updated-cell animation */
.example table tr td.updated-cell span {
  animation-name: cell-appear;
  animation-duration: 0.6s;
}
@keyframes cell-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
<div class="hf-example__preview" data-example-js="/examples/named-expressions/example1.js">
<div class="example">
  <button id="run" class="button run">
    Run calculations
  </button>
  <button id="reset" class="button button-outline reset">
    Reset
  </button>
  <table>
    <thead>
    <tr>
      <th>A</th>
      <th>B</th>
      <th>C</th>
      <th>D</th>
    </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
</div>
</div>

<details class="hf-example__source">
<summary>Source code</summary>

```js
/**
 * Initial table data.
 */
const tableData = [
  [10, 20, 20, 30],
  [50, 60, 70, 80],
  [90, 100, 110, 120],
  ['=myOneCell', '=myTwoCells', '=myOneColumn', '=myTwoColumns'],
  ['=myFormula+myNumber+34', '=myText', '=myOneRow', '=myTwoRows'],
];

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

// Add a new sheet and get its id.
const sheetName = hf.addSheet('main');
const sheetId = hf.getSheetId(sheetName);

// Fill the HyperFormula sheet with data.
hf.setCellContents(
  {
    row: 0,
    col: 0,
    sheet: sheetId,
  },
  tableData,
);
// Add named expressions
hf.addNamedExpression('myOneCell', '=main!$A$1');
hf.addNamedExpression('myTwoCells', '=SUM(main!$A$1, main!$A$2)');
hf.addNamedExpression('myOneColumn', '=SUM(main!$A$1:main!$A$3)');
hf.addNamedExpression('myTwoColumns', '=SUM(main!$A$1:main!$B$3)');
hf.addNamedExpression('myOneRow', '=SUM(main!$A$1:main!$D$1)');
hf.addNamedExpression('myTwoRows', '=SUM(main!$A$1:main!$D$2)');
hf.addNamedExpression('myFormula', '=SUM(0, 1, 1, 2, 3, 5, 8, 13)');
hf.addNamedExpression('myNumber', '=21');
hf.addNamedExpression('myText', 'Apollo 11');

/**
 * Fill the HTML table with data.
 *
 * @param {boolean} calculated `true` if it should render calculated values, `false` otherwise.
 */
function renderTable(calculated = false) {
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
      const showFormula = calculated || !cellHasFormula;
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress) && showFormula) {
        cellValue = hf.getCellValue(cellAddress);
      } else {
        cellValue = hf.getCellFormula(cellAddress);
      }

      newTbodyHTML += `<td class="${cellHasFormula ? updatedCellClass : ''}"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Replace formulas with their results.
 */
function runCalculations() {
  renderTable(true);
}

/**
 * Replace the values in the table with initial data.
 */
function resetTable() {
  renderTable();
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const runButton = document.querySelector('.example #run');
  const resetButton = document.querySelector('.example #reset');

  runButton.addEventListener('click', () => {
    runCalculations();
  });
  resetButton.addEventListener('click', () => {
    resetTable();
  });
}

const ANIMATION_ENABLED = true;

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
```

</details>
