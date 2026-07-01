---
title: "Batch operations"
---


HyperFormula offers a built-in feature for doing batch operations.
It allows you to combine multiple data modification actions into a single operation.

In some cases, batch operations can result in better performance,
especially when your app requires doing a large number of operations.

## How to batch

### Using the [`batch`](/docs/api/classes/hyperformula#batch) method

You can use the [`batch`](/docs/api/classes/hyperformula#batch) method to batch operations. This method accepts
just one parameter: a callback function that stacks the selected
operations into one. It performs the cumulative operation at the end.

This method returns a list of cells whose values were affected by this
operation together with their absolute addresses and new values.

```javascript
const hfInstance = HyperFormula.buildFromSheets({
  MySheet1: [ ['1'] ],
  MySheet2: [ ['10'] ],
});

// multiple operations in a single callback will trigger evaluation only once
// and only one set of changes will be returned as a combined result of all
// the operations that were triggered within the callback
const changes = hfInstance.batch(() => {
  hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=B1']]);
  hfInstance.setCellContents({ col: 4, row: 0, sheet: 0 }, [['=A1']]);
  
  // and numerous others
});
```

### Using the [`suspendEvaluation`](/docs/api/classes/hyperformula#suspendevaluation) and [`resumeEvaluation`](/docs/api/classes/hyperformula#resumeevaluation) methods

The same result can be achieved by suspending and resuming the
evaluation.

To do that you need to explicitly suspend the evaluation, then do the
operations one by one, and then resume the evaluation.

This method returns a list of cells which values were affected by the
operation together with their absolute addresses and new values.

```javascript
const hfInstance = HyperFormula.buildFromSheets({
  MySheet1: [ ['1'] ],
  MySheet2: [ ['10'] ],
});

// suspend the evaluation
hfInstance.suspendEvaluation();

// perform operations
hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=B1']]);
hfInstance.setSheetContent(1, [['50'], ['60']]);

// resume the evaluation
const changes = hfInstance.resumeEvaluation();
```

You can resume the evaluation by calling the [`resumeEvaluation`](/docs/api/classes/hyperformula#resumeevaluation) method
which triggers the recalculation. Just like in the case of the [`batch`](/docs/api/classes/hyperformula#batch)
method, it returns a list of cells which values changed after the
operation, together with their absolute addresses, and new values.

### Checking the evaluation suspension state

When you need to check if the evaluation is suspended you can
call the [`isEvaluationSuspended`](/docs/api/classes/hyperformula#isevaluationsuspended) method.

```javascript
const hfInstance = HyperFormula.buildEmpty();

// suspend the evaluation
hfInstance.suspendEvaluation();

// check if the evaluation is suspended
// this method returns a simple boolean value
const isEvaluationSuspended = hfInstance.isEvaluationSuspended();

// resume evaluation if needed
hfInstance.resumeEvaluation();
```

## When to batch

You can batch operations anytime you want to stack several actions into
one. However, if you want to see the most amazing benefits of this
feature, use batch operations when there are a lot of heavy methods.
This will result in better performance. The best candidates to
batch in this situation are the following methods:

* `clearSheet`
* `setSheetContent`
* `setCellContents`
* `addNamedExpression`
* `changeNamedExpression`
* `removeNamedExpression`

These operations have an impact on calculation results and may affect
the performance.

Batching can be useful when there is a need for multiple memory-consuming
operations. In this case, you should consider using it to achieve
better performance in the application you develop; it will result
in faster calculation across the whole HyperFormula instance.

Batching can also be useful when you decide to use HyperFormula
on the [server-side](server-side-installation). Several operations
can be sent as a single one.

## What you can't batch

You can't batch read operations.

Methods such as [`getCellValue`](/docs/api/classes/hyperformula#getcellvalue), [`getSheetSerialized`](/docs/api/classes/hyperformula#getsheetserialized), or [`getFillRangeData`](/docs/api/classes/hyperformula#getfillrangedata) will result in an error when called inside a [batch callback](#using-the-batch-method) or when the evaluation is [suspended](#using-the-suspendevaluation-and-resumeevaluation-methods).

The [paste](/docs/api/classes/hyperformula#paste) method also can't be called when batching as it reads the contents of the copied cells.

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
<div class="hf-example__preview" data-example-js="/examples/batch-operations/example1.js">
<div class="example container">
  <div>
    <div>
      <button id="run" class="button run">
        Run batch operation
      </button>
      <button id="reset" class="button button-outline reset">
        Reset
      </button>
    </div>
  </div>
  <div>
    <div style="display: flex; align-items: center;">
      <input id="isCalculated" type="checkbox" style="margin: .1em"/>
      <label for="isCalculated">Calculated</label>
    </div>
  </div>
  <div>
    <table>
      <colgroup>
        <col style="width:25%" />
        <col style="width:15%" />
        <col style="width:20%" />
        <col style="width:20%" />
        <col style="width:20%" />
      </colgroup>
      <thead>
      <tr>
        <th>Name</th>
        <th>Year_1</th>
        <th>Year_2</th>
        <th>Average</th>
        <th>Sum</th>
      </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
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
  ['Greg Black', 4.66, '=B1*1.3', '=AVERAGE(B1:C1)', '=SUM(B1:C1)'],
  ['Anne Carpenter', 5.25, '=$B$2*30%', '=AVERAGE(B2:C2)', '=SUM(B2:C2)'],
  ['Natalie Dem', 3.59, '=B3*2.7+2+1', '=AVERAGE(B3:C3)', '=SUM(B3:C3)'],
  ['John Sieg', 12.51, '=B4*(1.22+1)', '=AVERAGE(B4:C4)', '=SUM(B4:C4)'],
  [
    'Chris Aklips',
    7.63,
    '=B5*1.1*SUM(10,20)+1',
    '=AVERAGE(B5:C5)',
    '=SUM(B5:C5)',
  ],
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
// Add named expressions for the "TOTAL" row.
hf.addNamedExpression('Year_1', '=SUM(main!$B$1:main!$B$5)');
hf.addNamedExpression('Year_2', '=SUM(main!$C$1:main!$C$5)');

const ANIMATION_ENABLED = true;

/**
 * Fill the HTML table with data.
 *
 * @param {boolean} calculated `true` if it should render calculated values, `false` otherwise.
 */
function renderTable(calculated = false) {
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const totals = ['=SUM(Year_1)', '=SUM(Year_2)'];
  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';
  let totalRowsHTML = '';

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
      const showFormula = calculated || !cellHasFormula;
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress) && showFormula) {
        cellValue = hf.getCellValue(cellAddress);

        if (!isNaN(cellValue)) {
          cellValue = cellValue.toFixed(2);
        }
      } else {
        cellValue = hf.getCellFormula(cellAddress);
      }

      newTbodyHTML += `<td class="${cellHasFormula ? updatedCellClass : ''}"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  totalRowsHTML = `<tr class="summary">
  <td>TOTAL</td>
  <td class="${updatedCellClass}">
    <span>${
      calculated
        ? hf.calculateFormula(totals[0], sheetId).toFixed(2)
        : totals[0]
    }</span>
  </td>
  <td class="${updatedCellClass}">
    <span>${
      calculated
        ? hf.calculateFormula(totals[1], sheetId).toFixed(2)
        : totals[1]
    }</span>
  </td>
  <td colspan="2"></td>
  </tr>`;
  newTbodyHTML += totalRowsHTML;
  tbodyDOM.innerHTML = newTbodyHTML;
}

let IS_CALCULATED = false;

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const runButton = document.querySelector('.example #run');
  const resetButton = document.querySelector('.example #reset');
  const calculatedCheckbox = document.querySelector('.example #isCalculated');

  runButton.addEventListener('click', () => {
    runBatchOperations();
  });
  resetButton.addEventListener('click', () => {
    resetTableData();
  });
  calculatedCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      renderTable(true);
    } else {
      renderTable();
    }

    IS_CALCULATED = e.target.checked;
  });
}

/**
 * Reset the data for the table.
 */
function resetTableData() {
  hf.setSheetContent(sheetId, tableData);
  renderTable(IS_CALCULATED);
}

/**
 * Run batch operations.
 */
function runBatchOperations() {
  hf.batch(() => {
    hf.setCellContents({ col: 1, row: 0, sheet: sheetId }, [['=B4']]);
    hf.setCellContents({ col: 1, row: 1, sheet: sheetId }, [['=B4']]);
    hf.setCellContents({ col: 1, row: 2, sheet: sheetId }, [['=B4']]);
    hf.setCellContents({ col: 1, row: 4, sheet: sheetId }, [['=B4']]);
  });
  renderTable(IS_CALCULATED);
}

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
```

</details>
