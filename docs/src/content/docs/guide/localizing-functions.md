---
title: "Localizing functions"
---


You can localize a function's ID and error
messages. Currently, HyperFormula supports 18 languages, with British English
as the default.

To change the language all you need to do is import and
register the language like so:

```javascript
// import the French language pack
import frFR from 'hyperformula/i18n/languages/frFR';

// register the language
HyperFormula.registerLanguage('frFR', frFR);
```

:::tip
To import the language packs, use the module-system-specific dedicated bundles at:
* **ES**: `hyperformula/i18n/languages/`
* **CommonJS**: `hyperformula/i18n/languages/`
* **UMD**: `hyperformula/dist/languages/`

For the UMD build, the languages are accessible through `HyperFormula.languages`, e.g., `HyperFormula.languages.frFR`.
:::

Then set it inside it the [configuration options](/docs/guide/configuration-options):

```javascript
// configure the instance
const options = {
  language: 'frFR'
};
```

Language pack names should be passed as strings. They follow a
naming convention that incorporates two standards: ISO-639 and
ISO-3166-1. The pattern is `languageCOUNTRY`, for
example `enUS`, `enGB`, `frFR`,  etc.

You can freely use the localized names: `SUM` can be written as
`SOMME` and the functionality of the function will remain the same.

Here are some example functions and their translations in French:

```javascript
// localized functions
functions: {
  MATCH: 'EQUIV',
  CORREL: 'COEFFICIENT.CORRELATION',
  AVERAGE: 'MOYENNE'
},
```

Same goes for the [errors](/docs/guide/types-of-errors) displayed inside
cells when something goes wrong:

```javascript
// localized errors
errors: {
  CYCLE: '#CYCLE!',
  DIV_BY_ZERO: '#DIV/0!',
  ERROR: '#ERROR!',
  NA: '#N/A',
  NAME: '#NOM?',
  NUM: '#NOMBRE!',
  REF: '#REF!',
  VALUE: '#VALEUR!',
}
```

## Creating a custom language pack

If your desired language is not in the list of supported languages, you can create a custom language pack:

```javascript
// Create a language pack object
const spanish = {
  errors: {
    NAME: '#¿NOMBRE?',
    // ...
  },
  functions: {
    SUM: 'SUMA',
    IF: 'SI',
    // ...
  },
  langCode: 'es', // Your custom language code
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
};

// Register your language
HyperFormula.registerLanguage('es', spanish);

// Use it in your configuration
const hf = HyperFormula.buildEmpty({
  language: 'es'
});
```

:::tip
You can use an existing language pack as a template. Check the [language files in the repository](https://github.com/handsontable/hyperformula/tree/master/src/i18n/languages) to see complete examples with all available functions.
:::

## Localizing custom functions

You can localize your custom functions as well. For details, see the [Custom functions](/docs/guide/custom-functions#function-name-translations) guide.

### List of supported languages
| Language name    | Language code |
|:-----------------|:--------------|
| British English  | enGB          |
| American English | enUS          |
| Czech            | csCZ          |
| Danish           | daDK          |
| Dutch            | nlNL          |
| Finnish          | fiFI          |
| French           | frFR          |
| German           | deDE          |
| Hungarian        | huHU          |
| Italian          | itIT          |
| Norwegian        | nbNO          |
| Polish           | plPL          |
| Portuguese       | ptPT          |
| Russian          | ruRU          |
| Spanish          | esES          |
| Swedish          | svSE          |
| Turkish          | trTR          |
| Indonesian       | idID          |

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
<div class="hf-example__preview" data-example-js="/examples/localizing-functions/example1.js">
<div class="example">
  <button id="run" class="button run">
    Run calculations
  </button>
  <button id="reset" class="button button-outline reset">
    Reset
  </button>
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

<details class="hf-example__source">
<summary>Source code</summary>

```js
/* start:skip-in-sandbox */
const frFR = HyperFormula.languages.frFR;
/* end:skip-in-sandbox */
/**
 * Initial table data.
 */
const tableData = [
  ['Greg Black', 4.66, '=B1*1.3', '=MOYENNE(B1:C1)', '=SOMME(B1:C1)'],
  ['Anne Carpenter', 5.25, '=$B$2*30%', '=MOYENNE(B2:C2)', '=SOMME(B2:C2)'],
  ['Natalie Dem', 3.59, '=B3*2.7+2+1', '=MOYENNE(B3:C3)', '=SOMME(B3:C3)'],
  ['John Sieg', 12.51, '=B4*(1.22+1)', '=MOYENNE(B4:C4)', '=SOMME(B4:C4)'],
  [
    'Chris Aklips',
    7.63,
    '=B5*1.1*SUM(10,20)+1',
    '=MOYENNE(B5:C5)',
    '=SOMME(B5:C5)',
  ],
];

// register language
if (!HyperFormula.getRegisteredLanguagesCodes().includes('frFR')) {
  HyperFormula.registerLanguage('frFR', frFR);
}

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  language: 'frFR',
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
hf.addNamedExpression('Year_1', '=SOMME(main!$B$1:main!$B$5)');
hf.addNamedExpression('Year_2', '=SOMME(main!$C$1:main!$C$5)');

/**
 * Fill the HTML table with data.
 *
 * @param {boolean} calculated `true` if it should render calculated values, `false` otherwise.
 */
function renderTable(calculated = false) {
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const totals = ['=SOMME(Year_1)', '=SOMME(Year_2)'];
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
  <span>${calculated ? hf.calculateFormula(totals[0], sheetId).toFixed(2) : totals[0]}</span>
</td>
<td class="${updatedCellClass}">
  <span>${calculated ? hf.calculateFormula(totals[1], sheetId).toFixed(2) : totals[1]}</span>
</td>
<td colspan="2"></td>
</tr>`;
  newTbodyHTML += totalRowsHTML;
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
