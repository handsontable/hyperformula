---
title: "Clipboard operations"
---


Through a set of dedicated methods, HyperFormula supports clipboard operations, such as copying, cutting,
and pasting. This lets you integrate the functionality
of interacting with the clipboard.

The copied or cut data is stored as a memory reference, not directly in the system clipboard.

## Copy

To copy the contents of a cell or range, use the [`copy()`](/docs/api/classes/hyperformula#copy) method. Pass arguments of type [`SimpleCellRange`](/docs/api/interfaces/simplecellrange).

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// copy [ [ 2 ] ]
const clipboardContent = hfInstance.copy({
  start: { sheet: 0, col: 1, row: 0 }, 
  end: { sheet: 0, col: 1, row: 0 },
});
```

## Cut

To cut the contents of a cell or range, use the [`cut()`](/docs/api/classes/hyperformula#cut) method. Pass arguments of type [`SimpleCellRange`](/docs/api/interfaces/simplecellrange).

:::tip
Any CRUD operation called after the [`cut()`](/docs/api/classes/hyperformula#cut) method aborts the cut operation.
:::

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// returns the values that were cut: [ [ 1 ] ]
const clipboardContent = hfInstance.cut({
  start: { sheet: 0, col: 0, row: 0 },
  end: { sheet: 0, col: 0, row: 0 },
});
```

## Paste

To paste the contents of a cell or range, use the [`paste()`](/docs/api/classes/hyperformula#paste) method.

[`paste()`](/docs/api/classes/hyperformula#paste) requires only one parameter: the top left corner of the target range.

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// [ [ 2 ] ] was copied
const clipboardContent = hfInstance.copy({
  start: { sheet: 0, col: 1, row: 0 },
  end: { sheet: 0, col: 1, row: 0 },
});

// returns a list of modified cells: their absolute addresses and new values
const changes = hfInstance.paste({ sheet: 0, col: 1, row: 0 });
```

If the clipboard is empty, the [`paste()`](/docs/api/classes/hyperformula#paste) method doesn't do anything.

### Copy and paste

When called after [`copy()`](/docs/api/classes/hyperformula#copy), the [`paste()`](/docs/api/classes/hyperformula#paste) method:
- Pastes the copied data into the target range.
- Triggers a recalculation of all affected formulas.

:::tip
If a formula `=A1` is copied from cell B1 into B2, the B2 formula becomes `=A2`.
:::

### Cut and paste

When called after [`cut()`](/docs/api/classes/hyperformula#cut), the [`paste()`](/docs/api/classes/hyperformula#paste) method:
- Moves the cut data into the target range, by calling the [`moveCells()`](/docs/api/classes/hyperformula#movecells) method.
- Removes the cut data from the source range.
- Triggers a recalculation of all affected formulas.

:::tip
If a formula `=A1` is cut from cell B1 into B2, the B2 formula becomes `=A1`.
:::

#### Pasting named expressions

If a copied or cut formula contains a [named expression](/docs/guide/named-expressions) defined for a local scope, and the formula is pasted to a sheet that is out of scope for that expression, the expression's scope changes to global.

If the copied or cut named expression's scope is the same as the target's, the expression's local scope remains the same.

## Clear the clipboard

To clear the clipboard, use the [`clearClipboard()`](/docs/api/classes/hyperformula#clearclipboard)
method.

To check if the clipboard holds any data, use the [`isClipboardEmpty()`](/docs/api/classes/hyperformula#isclipboardempty) method.

## Data storage

The copied or cut data is stored as a memory reference, not directly in the system clipboard.

Depending on what was cut, the data is stored as:
* An array of arrays
* A number
* A string
* A boolean
* An empty value

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
<div class="hf-example__preview" data-example-js="/examples/clipboard-operations/example1.js">
<div class="example container">
  <div>
    <div>
      <button id="copy" class="button run">
        Copy
      </button>
      <button id="paste" class="button button-outline reset">
        Paste
      </button>
      <button id="reset" class="button button-outline reset">
        Reset
      </button>
    </div>
  </div>
  <div>
    <div>
      <span id="copyInfo"></span>
    </div>
  </div>
  <table>
    <colgroup>
      <col style="width:30%" />
      <col style="width:30%" />
      <col style="width:30%" />
    </colgroup>
    <thead>
    <tr>
      <th>Name</th>
      <th>Surname</th>
      <th>Both</th>
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
/* start:skip-in-sandbox */
const NothingToPasteError = HyperFormula.NothingToPasteError;
/* end:skip-in-sandbox */
/**
 * Initial table data.
 */
const tableData = [
  ['Greg', 'Black', '=CONCATENATE(A1, " ",B1)'],
  ['Anne', 'Carpenter', '=CONCATENATE(A2, " ", B2)'],
  ['Chris', 'Aklips', '=CONCATENATE(A3, " ",B3)'],
];

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

// Add a new sheet and get its id.
const sheetName = hf.addSheet('main');
const sheetId = hf.getSheetId(sheetName);

/**
 * Reinitialize the HF data.
 */
function reinitializeData() {
  hf.setCellContents(
    {
      row: 0,
      col: 0,
      sheet: sheetId,
    },
    tableData,
  );
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const copyButton = document.querySelector('.example #copy');
  const pasteButton = document.querySelector('.example #paste');
  const resetButton = document.querySelector('.example #reset');

  copyButton.addEventListener('click', () => {
    copy();
    updateCopyInfo('Second row copied');
  });
  pasteButton.addEventListener('click', () => {
    paste();
  });
  resetButton.addEventListener('click', () => {
    reinitializeData();
    updateCopyInfo('');
    renderTable();
  });
}

/**
 * Copy the second row.
 */
function copy() {
  return hf.copy({
    start: { sheet: 0, col: 0, row: 1 },
    end: { sheet: 0, col: 2, row: 1 },
  });
}

/**
 * Paste the HF clipboard into the first row.
 */
function paste() {
  try {
    hf.paste({ sheet: 0, col: 0, row: 0 });
    updateCopyInfo('Pasted into the first row');
    renderTable();
  } catch (error) {
    if (error instanceof NothingToPasteError) {
      updateCopyInfo('There is nothing to paste');
    } else {
      throw error;
    }
  }
}

const ANIMATION_ENABLED = true;

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
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress)) {
        cellValue = hf.getCellValue(cellAddress);
      }

      newTbodyHTML += `<td class="${updatedCellClass}"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Update the information about the copy/paste action.
 *
 * @param {string} message Message to display.
 */
function updateCopyInfo(message) {
  const copyInfoDOM = document.querySelector('.example #copyInfo');

  copyInfoDOM.innerText = message;
}

// Fill the HyperFormula sheet with data.
reinitializeData();
// Bind the button events.
bindEvents();
// Render the table.
renderTable();
```

</details>