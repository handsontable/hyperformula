---
title: "Basic usage"
---


:::tip
The instance can be created with three static methods:
[`buildFromArray`](/docs/api/classes/hyperformula#buildfromarray),
`buildFromSheets` or `buildEmpty`. You can check all of their
descriptions in our [API reference](/docs/api).
:::

If you've already installed the library, it's time to start writing the
first simple application.

First, if you used NPM or Yarn to install the package, make sure you
have properly imported HyperFormula as shown below:

```javascript
import { HyperFormula } from 'hyperformula';
```

If you embed HyperFormula in the `<script>` tag using CDN, then it will
be accessible as global variable `HyperFormula` and ready to use.
  
Now you can use the [available options](/docs/guide/configuration-options) to
configure the instance of HyperFormula according to your needs, like
this:

```javascript
const options = {
    licenseKey: 'gpl-v3'
};
```

Then, prepare some data to be used by your app. In this case, the data
set will contain numbers and just one formula `=SUM(A1,B1)`. Use the
`buildFromArray` method to create the instance:

```javascript
// define the data
const data = [['10', '20', '3.14159265359', '=SUM(A1:C1)']];

// build an instance with defined options and data 
const hfInstance = HyperFormula.buildFromArray(data, options);
```

Alright, now it's time to do some calculations. Let's use the
`getCellValue` method to retrieve the results of a formula included
in the `data` .

```javascript
// call getCellValue to get the calculation results
const mySum = hfInstance.getCellValue({ col: 3, row: 0, sheet: 0 });
```

You can check the output in the console:

```javascript
// this outputs the result in the browser's console
console.log(mySum);
```

That's it! You've grasped a basic idea of how the HyperFormula engine
works. It's time to move on to a more
[advanced example.](/docs/guide/advanced-usage)

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
<div class="hf-example__preview" data-example-js="/examples/basic-usage/example1.js">
<div class="example">
  <button id="calculate" class="button run">
    Calculate
  </button>
  <div class="message-box">
    <span><span id="address-output"></span> result: <strong id="result-output"></strong></span>
  </div>
  <table class="spreadsheet">
    <colgroup>
      <col style="width:30%"/>
      <col style="width:30%"/>
      <col style="width:30%"/>
    </colgroup>
    <thead></thead>
    <tbody></tbody>
  </table>
</div>
</div>
</div>

<details class="hf-example__source">
<summary>Source code</summary>

```js
const tableData = [['10', '20', '=SUM(A1,B1)']];
// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  precisionRounding: 9,
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
 * Fill the HTML table with data.
 */
function renderTable() {
  const theadDOM = document.querySelector('.example thead');
  const tbodyDOM = document.querySelector('.example tbody');
  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTheadHTML = '';
  let newTbodyHTML = '';

  for (let row = -1; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (row === -1) {
        newTheadHTML += `<th><span></span></th>`;

        continue;
      }

      const cellAddress = { sheet: sheetId, col, row };
      const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress) && !cellHasFormula) {
        cellValue = hf.getCellValue(cellAddress);
      } else {
        cellValue = hf.getCellFormula(cellAddress);
      }

      newTbodyHTML += `<td><span>
      ${cellValue}
      </span></td>`;
    }
  }

  tbodyDOM.innerHTML = `<tr>${newTbodyHTML}</tr>`;
  theadDOM.innerHTML = newTheadHTML;
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const calculateButton = document.querySelector('.example #calculate');
  const formulaPreview = document.querySelector('.example #address-output');
  const calculationResult = document.querySelector('.example #result-output');
  const cellAddress = { sheet: sheetId, row: 0, col: 2 };

  formulaPreview.innerText = hf.simpleCellAddressToString(cellAddress, sheetId);
  calculateButton.addEventListener('click', () => {
    calculationResult.innerText = hf.getCellValue(cellAddress);
  });
}

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
```

</details>
