---
title: "Advanced usage"
---


:::tip
By default, cells are identified using a `SimpleCellAddress` which
consists of a sheet ID, column ID, and row ID, like
this: `{ sheet: 0, col: 0, row: 0 }`

Alternatively, you can work with the **A1 notation** known from
spreadsheets like Excel or Google Sheets. The API provides the helper
function `simpleCellAddressFromString` which you can use to
retrieve the `SimpleCellAddress` .
:::

The following example shows how to use formulas to find out which of
the two Teams (A or B) is the winning one. You will do that by
comparing the average scores of players in each team.

The initial steps are the same as in the
[basic example](/docs/guide/basic-usage). First, import HyperFormula and choose
the configuration options:

```javascript
import { HyperFormula } from 'hyperformula';

const options = {
    licenseKey: 'gpl-v3'
};
```

This time you will use the `buildFromEmpty` static method to
initialize the engine:

```javascript
// initiate the engine with no data
const hfInstance = HyperFormula.buildEmpty(options);
```

Now, let's prepare some data. The first column will be players'
IDs and the second column will be their scores. Then, you will
define the formulas responsible for calculating the average scores.

```javascript
// first column represents players' IDs
// second column represents players' scores
const playersA = [
    ['1', '2'],
    ['2', '3'],
    ['3', '5'],
    ['4', '7'],
    ['5', '13'],
    ['6', '17']
];

const playersB = [
    ['7', '19'],
    ['8', '31'],
    ['9', '61'],
    ['10', '89'],
    ['11', '107'],
    ['12', '127']
];

// in cell A1 a formula checks which team is the winning one
// in cells A2 and A3 formulas calculate the average score of players
const formulas = [
    ['=IF(Formulas!A2>Formulas!A3,"TeamA","TeamB")'],
    ['=AVERAGE(TeamA!B1:B6)'],
    ['=AVERAGE(TeamB!B1:B6)']
];
```

Now prepare sheets and insert the data into them:

```javascript
// add 'TeamA' sheet
const sheetNameA = hfInstance.addSheet('TeamA');
// get the new sheet ID for further API calls
const sheetIdA = hfInstance.getSheetId(sheetNameA);
// insert playersA content into targeted 'TeamA' sheet
hfInstance.setSheetContent(sheetIdA, playersA);

// add 'TeamB' sheet
const sheetNameB = hfInstance.addSheet('TeamB');
// get the new sheet ID for further API calls
const sheetIdB = hfInstance.getSheetId(sheetNameB);
// insert playersB content into targeted 'TeamB' sheet
hfInstance.setSheetContent(sheetIdB, playersB);

// check the content in the console output
console.log(hfInstance.getAllSheetsValues());
```

After setting everything up, you can add formulas:

```javascript
// add a sheet named 'Formulas'
const sheetNameC = hfInstance.addSheet('Formulas');
// get the new sheet ID for further API calls
const sheetIdC = hfInstance.getSheetId(sheetNameC);
// add formulas to that sheet
hfInstance.setSheetContent(sheetIdC, formulas);
```

Almost done! Now, you can use the `getSheetValues` method to get all
values including the calculated ones. Alternatively, you can use
`getCellValue`to get the value from a specific cell.

```javascript
// get all sheet values 
const sheetValues = hfInstance.getSheetValues(sheetIdC);

// get the simple cell address of 'A1' from that sheet
const simpleCellAddress = hfInstance.simpleCellAddressFromString('A1', sheetIdC);

// check the winning team 🎉
const winningTeam = hfInstance.getCellValue(simpleCellAddress);

// print the result to the console
console.log(winningTeam)
```

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
<div class="hf-example__preview" data-example-js="/examples/advanced-usage/example1.js">
<div class="example">
  <button id="run" class="run">
    Who won?
  </button>
  <div class="message">
    <span style="margin: 0 10px">&#127942;</span>
    <span id="output"></span>
  </div>
  <div id="data-preview" class="container" style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: space-between;">
      <div id="TeamA-container" style="width: 300px">
        <h3>Team A</h3>
        <table>
          <colgroup>
            <col style="width:50%" />
            <col style="width:50%" />
          </colgroup>
          <thead>
          <tr>
            <th>ID</th>
            <th>Score</th>
          </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div id="TeamB-container" style="width: 300px">
        <h3>Team B</h3>
        <table>
          <colgroup>
            <col style="width:50%" />
            <col style="width:50%" />
          </colgroup>
          <thead>
          <tr>
            <th>ID</th>
            <th>Score</th>
          </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div id="Formulas-container" style="max-width: 300px">
        <h3>Formulas</h3>
        <table>
          <tbody></tbody>
        </table>
      </div>
  </div>
</div>
</div>
</div>

<details class="hf-example__source">
<summary>Source code</summary>

```js
// first column represents players' IDs
// second column represents players' scores
const playersAData = [
  ['1', '2'],
  ['2', '3'],
  ['3', '5'],
  ['4', '7'],
  ['5', '13'],
  ['6', '17'],
];

const playersBData = [
  ['7', '19'],
  ['8', '31'],
  ['9', '61'],
  ['10', '89'],
  ['11', '107'],
  ['12', '127'],
];

// in a cell A1 a formula checks which team is a winning one
// in cells A2 and A3 formulas calculate the average score of players
const formulasData = [
  ['=IF(Formulas!A2>Formulas!A3,"TeamA","TeamB")'],
  ['=AVERAGE(TeamA!B1:B6)'],
  ['=AVERAGE(TeamB!B1:B6)'],
];

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

const sheetInfo = {
  teamA: { sheetName: 'TeamA' },
  teamB: { sheetName: 'TeamB' },
  formulas: { sheetName: 'Formulas' },
};

// add 'TeamA' sheet
hf.addSheet(sheetInfo.teamA.sheetName);
// insert playersA content into targeted 'TeamA' sheet
hf.setSheetContent(hf.getSheetId(sheetInfo.teamA.sheetName), playersAData);
// add 'TeamB' sheet
hf.addSheet(sheetInfo.teamB.sheetName);
// insert playersB content into targeted 'TeamB' sheet
hf.setSheetContent(hf.getSheetId(sheetInfo.teamB.sheetName), playersBData);
// add a sheet named 'Formulas'
hf.addSheet(sheetInfo.formulas.sheetName);
// add formulas to that sheet
hf.setSheetContent(hf.getSheetId(sheetInfo.formulas.sheetName), formulasData);

/**
 * Fill the HTML table with data.
 *
 * @param {string} sheetName Sheet name.
 */
function renderTable(sheetName) {
  const sheetId = hf.getSheetId(sheetName);
  const tbodyDOM = document.querySelector(
    `.example #${sheetName}-container tbody`,
  );

  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress) && !cellHasFormula) {
        cellValue = hf.getCellValue(cellAddress);
      } else {
        cellValue = hf.getCellFormula(cellAddress);
      }

      newTbodyHTML += `<td><span>${cellValue}</span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Render the result block
 */
function renderResult() {
  const resultOutputDOM = document.querySelector('.example #output');
  const cellAddress = hf.simpleCellAddressFromString(
    `${sheetInfo.formulas.sheetName}!A1`,
    hf.getSheetId(sheetInfo.formulas.sheetName),
  );

  resultOutputDOM.innerHTML = `<span>
  <strong>${hf.getCellValue(cellAddress)}</strong> won!
  </span>`;
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const runButton = document.querySelector('.example #run');

  runButton.addEventListener('click', () => {
    renderResult();
  });
}

// Bind the button events.
bindEvents();

// Render the preview tables.
for (const [_, tableInfo] of Object.entries(sheetInfo)) {
  renderTable(tableInfo.sheetName);
}
```

</details>
