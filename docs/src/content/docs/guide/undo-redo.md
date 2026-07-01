---
title: "Undo-redo"
---


HyperFormula supports undo-redo for CRUD and move operations.
By default, you can **undo 20 actions.** The `undoLimit` can be changed
inside the [configuration options](/docs/guide/configuration-options) so you
can adapt that number to your needs. Be careful when setting
`undoLimit` to large numbers. It may result in performance issues.

Undo and redo work together as a synced pair, so each time you
**undo** some action it is put onto a **redo** stack.

**Named expressions** behave just like any other
[CRUD operation](basic-operations).

## isThereSomething* methods

There are two methods which can be used to check the actual state
of the undo-redo stack:`isThereSomethingToUndo` and
`isThereSomethingToRedo`.

## Batch operations

When you [batch several operations](/docs/guide/batch-operations) remember
that undo-redo will recognize them as a single cumulative operation.

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
<div class="hf-example__preview" data-example-js="/examples/undo-redo/example1.js">
<div class="example">
  <button id="remove-row" class="button run">
    Remove the second row
  </button>
  <button id="undo" class="button button-outline undo">
    Undo
  </button>
  <p id="info-box" style="margin: 0 0 -16px 0">&nbsp;</p>
  <table>
    <colgroup>
      <col style="width:40%" />
      <col style="width:60%" />
    </colgroup>
    <thead>
    <tr>
      <th>Name</th>
      <th>Value</th>
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
  ['Greg', '2'],
  ['Chris', '4'],
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
// Clear the undo stack to prevent undoing the initialization steps.
hf.clearUndoStack();

/**
 * Fill the HTML table with data.
 */
function renderTable() {
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const cellValue = hf.getCellValue(cellAddress);

      newTbodyHTML += `<td class="${updatedCellClass}"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Clear the existing information.
 */
function clearInfo() {
  const infoBoxDOM = document.querySelector('.example #info-box');

  infoBoxDOM.innerHTML = '&nbsp;';
}

/**
 * Display the provided message in the info box.
 *
 * @param {string} message Message to display.
 */
function displayInfo(message) {
  const infoBoxDOM = document.querySelector('.example #info-box');

  infoBoxDOM.innerText = message;
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const removeRowButton = document.querySelector('.example #remove-row');
  const undoButton = document.querySelector('.example #undo');

  removeRowButton.addEventListener('click', () => {
    removeSecondRow();
  });
  undoButton.addEventListener('click', () => {
    undo();
  });
}

/**
 * Remove the second row from the table.
 */
function removeSecondRow() {
  const filledRowCount = hf.getSheetDimensions(sheetId).height;

  clearInfo();

  if (filledRowCount < 2) {
    displayInfo("There's not enough filled rows to perform this action.");

    return;
  }

  hf.removeRows(sheetId, [1, 1]);
  renderTable();
}

/**
 * Run the HF undo action.
 */
function undo() {
  clearInfo();

  if (!hf.isThereSomethingToUndo()) {
    displayInfo("There's nothing to undo.");

    return;
  }

  hf.undo();
  renderTable();
}

const ANIMATION_ENABLED = true;

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
```

</details>
