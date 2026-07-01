---
title: "Sorting data"
---


In HyperFormula, you can sort data by reordering rows and columns.

## Sorting data in HyperFormula

To sort data in HyperFormula, you reorder rows (or columns), by providing your preferred permutation of row (or column) indexes.

You can implement any sorting algorithm that returns an array of row or column indexes.

## Sorting rows

To sort rows, use the [`isItPossibleToSetRowOrder`](/docs/api/classes/hyperformula#isitpossibletosetroworder) and [`setRowOrder`](/docs/api/classes/hyperformula#setroworder) methods.

### Step 1: Choose a new row order
Choose your required permutation of row indexes. 

For example, if you want to swap the first row with the third row, set the order to `[2, 1, 0]` instead of `[0, 1, 2]`:

```js
// a HyperFormula instance with example data
const hfInstance = HyperFormula.buildFromArray([
 [1],
 [2],
 [4, 5],
]);

// we'll set the row order to [2, 1, 0] in the next steps
```

:::tip
The [`setRowOrder`](/docs/api/classes/hyperformula#setroworder) method accepts an array of numbers, so you can implement any function that returns an array with your required row order.
:::

### Step 2: Check if the new row order can be applied

Before you change the row order, check if your specified row number permutation can actually be applied.

Thanks to the [`isItPossibleTo*` methods](/docs/guide/basic-operations#isitpossibleto-methods), you can check if an operation is allowed, and display an error message if it's not.

Use the [`isItPossibleToSetRowOrder`](/docs/api/classes/hyperformula#isitpossibletosetroworder) method:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1],
 [2],
 [4, 5],
]);

// a variable to carry the user message
let messageUsedInUI;

// check if your permutation can be applied
const isRowOrderOk = hfInstance.isItPossibleToSetRowOrder(0, [2, 1, 0]);

// display an error message
if (!isRowOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort rows in this way.'
}
```

### Step 3: Set the new row order

If your specified row number permutation is valid, change the row order:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1],
 [2],
 [4, 5],
]);

let messageUsedInUI;

const isRowOrderOk = hfInstance.isItPossibleToSetRowOrder(0, [2, 1, 0]);

if (!isRowOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort rows in this way.'
} else {
  // set the new row order
  setRowOrder(0, [2, 1, 0]);
}
// rows 0 and 2 swap places

// returns:
// [{
//   address: { sheet: 0, col: 0, row: 2 },
//   newValue: 1,
// },
// {
//   address: { sheet: 0, col: 1, row: 2 },
//   newValue: null,
// },
// {
//   address: { sheet: 0, col: 0, row: 0 },
//   newValue: 4,
// },
// {
//   address: { sheet: 0, col: 1, row: 0 },
//   newValue: 5,
// }]
```

## Sorting columns

To sort columns, use the [`isItPossibleToSetColumnOrder`](/docs/api/classes/hyperformula#isitpossibletosetcolumnorder) and [`setColumnOrder`](/docs/api/classes/hyperformula#setcolumnorder) methods.

### Step 1: Choose a new column order
Choose your required permutation of column indexes.

For example, if you want to swap the first column with the third column, set the order to `[2, 1, 0]` instead of `[0, 1, 2]`:

```js
// a HyperFormula instance with example data
const hfInstance = HyperFormula.buildFromArray([
 [1, 2, 4],
 [5]
]);

// we'll set the column order to [2, 1, 0] in the next steps
```

:::tip
The [`setColumnOrder`](/docs/api/classes/hyperformula#setcolumnorder) method accepts an array of numbers, so you can implement any function that returns an array with your required column order.
:::

### Step 2: Check if the new column order can be applied

Before you change the column order, check if your specified column number permutation can actually be applied.

Thanks to the [`isItPossibleTo*` methods](/docs/guide/basic-operations#isitpossibleto-methods), you can check if an operation is allowed, and display an error message if it's not.

Use the [`isItPossibleToSetColumnOrder`](/docs/api/classes/hyperformula#isitpossibletosetcolumnorder) method:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1, 2, 4],
 [5]
]);

// a variable to carry the user message
let messageUsedInUI;

// check if your permutation can be applied
const isColumnOrderOk = hfInstance.isItPossibleToSetColumnOrder(0, [2, 1, 0]);

// display an error message
if (!isColumnOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort columns in this way.'
}
```

### Step 3: Set the new column order

If your specified column number permutation is valid, change the column order:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1, 2, 4],
 [5]
]);

let messageUsedInUI;

const isColumnOrderOk = hfInstance.isItPossibleToSetColumnOrder(0, [2, 1, 0]);

if (!isColumnOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort columns in this way.'
} else {
  // set the new column order
  setColumnOrder(0, [2, 1, 0]);
}
// columns 0 and 2 swap places

//returns:
// [{
//   address: { sheet: 0, col: 2, row: 0 },
//   newValue: 1,
// },
// {
//   address: { sheet: 0, col: 2, row: 1 },
//   newValue: 5,
// },
// {
//   address: { sheet: 0, col: 0, row: 0 },
//   newValue: 4,
// },
// {
//   address: { sheet: 0, col: 0, row: 1 },
//   newValue: null,
// }]
```

## Data sorting demo

The demo below shows how to sort rows in ascending and descending order, based on the results (calculated values) of the cells in the second column.

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
<div class="hf-example__preview" data-example-js="/examples/sorting-data/example1.js">
<div class="example">
  <table>
    <colgroup>
      <col style="width:50%" />
      <col style="width:50%" />
    </colgroup>
    <thead>
    <tr>
      <th>Name</th>
      <th>
        Score <button id="asc" class="button arrow" style="width: 20px; height: 20px; line-height: 0; padding: 10px 6px;">&uarr;</button>
        <button id="desc" class="button arrow" style="width: 20px; height: 20px; line-height: 0; padding: 10px 6px;">&darr;</button>
      </th>
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
  ['Greg Black', '100'],
  ['Anne Carpenter', '=SUM(100,100)'],
  ['Natalie Dem', '500'],
  ['John Sieg', '50'],
  ['Chris Aklips', '20'],
  ['Bart Hoopoe', '700'],
  ['Chris Site', '80'],
  ['Agnes Whitey', '90'],
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

/**
 * Sort the HF's dataset.
 *
 * @param {boolean} ascending `true` if sorting in ascending order, `false` otherwise.
 * @param {Function} callback The callback function.
 */
function sort(ascending, callback) {
  const rowCount = hf.getSheetDimensions(sheetId).height;
  const colValues = [];
  let newOrder = null;
  const newOrderMapping = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    colValues.push({
      rowIndex,
      value: hf.getCellValue({
        sheet: sheetId,
        col: 1,
        row: rowIndex,
      }),
    });
  }

  colValues.sort((objA, objB) => {
    const delta = objA.value - objB.value;

    return ascending ? delta : -delta;
  });
  newOrder = colValues.map((el) => el.rowIndex);
  newOrder.forEach((orderIndex, arrIndex) => {
    newOrderMapping[orderIndex] = arrIndex;
  });
  hf.setRowOrder(sheetId, newOrderMapping);
  callback();
}

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

const doSortASC = () => {
  sort(true, () => {
    renderTable(true);
  });
};

const doSortDESC = () => {
  sort(false, () => {
    renderTable(true);
  });
};

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const ascSort = document.querySelector('.example #asc');
  const descSort = document.querySelector('.example #desc');

  ascSort.addEventListener('click', () => {
    doSortASC();
  });
  descSort.addEventListener('click', () => {
    doSortDESC();
  });
}

const ANIMATION_ENABLED = true;

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
```

</details>
