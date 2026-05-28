---
title: "Internationalization features"
---


Configure HyperFormula to match the languages and regions of your users.

**Contents:**


## Function names and errors

Each of HyperFormula's [built-in functions](/docs/guide/built-in-functions) and [errors](/docs/guide/types-of-errors) is available in [18 languages](/docs/guide/localizing-functions#list-of-supported-languages).

You can easily [switch between languages](/docs/guide/localizing-functions) ([`language`](/docs/api/interfaces/configparams#language)).

When adding a [custom function](/docs/guide/custom-functions), you can define the function's [name](/docs/guide/custom-functions#3-add-your-function-s-names) in every language that you support.

To support more languages, add a [custom language pack](/docs/guide/localizing-functions).

## Date and time formats

To match a region's calendar conventions, you can set multiple date formats ([`dateFormats`](/docs/api/interfaces/configparams#dateformats)) and time formats ([`timeFormats`](/docs/api/interfaces/configparams#timeformats)).

By default, HyperFormula uses the European date and time formats. [You can easily change them](/docs/guide/date-and-time-handling#example).

You can also add custom ways of [handling dates and times](/docs/guide/date-and-time-handling#custom-date-and-time-handling).

## Number format

To match a region's number format, configure HyperFormula's decimal separator ([`decimalSeparator`](/docs/api/interfaces/configparams#decimalseparator)) and thousands separator ([`thousandSeparator`](/docs/api/interfaces/configparams#thousandseparator)).

By default, HyperFormula uses the European number format (`1000000.00`):

```js
decimalSeparator: '.', // set by default
thousandSeparator: '', // set by default
```

To use the US number format (`1,000,000.00`), set:

```js
decimalSeparator: '.', // set by default
thousandSeparator: ',',
```

:::tip
  In HyperFormula, both [`decimalSeparator`](/docs/api/interfaces/configparams#decimalseparator) and [`thousandSeparator`](/docs/api/interfaces/configparams#thousandseparator) must be different from [`functionArgSeparator`](/docs/api/interfaces/configparams#functionargseparator).
  In some cases it might cause compatibility issues with other spreadsheets, e.g., [Microsoft Excel](/docs/guide/compatibility-with-microsoft-excel#separators) or [Google Sheets](/docs/guide/compatibility-with-google-sheets#separators).
:::

## Currency symbol

To match your users' currency, you can configure multiple currency symbols ([`currencySymbol`](/docs/api/interfaces/configparams#currencysymbol)).

The default currency symbol is `$`. To add `USD` as an alternative, set:

```js
currencySymbol: ['$', 'USD'],
```

## String comparison rules

To make sure that language-sensitive strings are compared in line with your users' language (e.g., `Préservation` vs. `Preservation`), set HyperFormula's [string comparison rules](/docs/guide/types-of-operators#comparing-strings) ([`localeLang`](/docs/api/interfaces/configparams#localelang)).

The value of [`localeLang`](/docs/api/interfaces/configparams#localelang) is processed by [`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator), a JavaScript standard object.

The default setting is:

```js
localeLang: 'en', // set by default
```

To set the `en-US` string comparison rules, set:

```js
localeLang: 'en-US',
```

To further customize string comparison rules, use these options:
- [`caseSensitive`](/docs/api/interfaces/configparams#casesensitive)
- [`accentSensitive`](/docs/api/interfaces/configparams#accentsensitive)
- [`caseFirst`](/docs/api/interfaces/configparams#casefirst)
- [`ignorePunctuation`](/docs/api/interfaces/configparams#ignorepunctuation)

## Compatibility with other spreadsheet software

For information on compatibility with locale-dependent syntax in other spreadsheet software, see:
- [Compatibility with Microsoft Excel](/docs/guide/compatibility-with-microsoft-excel)
- [Compatibility with Google Sheets](/docs/guide/compatibility-with-google-sheets)

## `en-US` configuration

This configuration aligns HyperFormula with the `en-US` locale. Due to the configuration of [separators](#number-format), it might not be fully compatible with formulas coming from other spreadsheet software.

```js
language: 'enUS',
dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
decimalSeparator: '.', // set by default
thousandSeparator: ',',
functionArgSeparator: ';', // might cause incompatibility with other spreadsheets
currencySymbol: ['$', 'USD'],
localeLang: 'en-US',
```

## `en-US` demo

This demo shows HyperFormula configured for the `en-US` locale.

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
<div class="hf-example__preview" data-example-js="/examples/i18n/example1.js">
<div class="example">
  <button id="run" class="button run">
    Run calculations
  </button>
  <button id="reset" class="button button-outline reset">
    Reset
  </button>
  <table>
    <colgroup>
      <col style="width:22%" />
      <col style="width:15%" />
      <col style="width:23%" />
      <col style="width:20%" />
      <col style="width:20%" />
    </colgroup>
    <thead>
    <tr>
      <th>Name</th>
      <th>Lunch time</th>
      <th>Date of Birth</th>
      <th>Age</th>
      <th>Salary</th>
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
const enUS = HyperFormula.languages.enUS;
/* end:skip-in-sandbox */
/**
 * Initial table data.
 */
const tableData = [
  [
    'Greg Black',
    '11:45 AM',
    '05/23/1989',
    '=YEAR(NOW())-YEAR(C1)',
    '$80,000.00',
  ],
  [
    'Anne Carpenter',
    '12:30 PM',
    '01/01/1980',
    '=YEAR(NOW())-YEAR(C2)',
    '$95,000.00',
  ],
  [
    'Natalie Dem',
    '1:30 PM',
    '12/13/1973',
    '=YEAR(NOW())-YEAR(C3)',
    '$78,500.00',
  ],
  [
    'John Sieg',
    '2:00 PM',
    '10/31/1995',
    '=YEAR(NOW())-YEAR(C4)',
    '$114,000.00',
  ],
  [
    'Chris Aklips',
    '11:30 AM',
    '08/18/1987',
    '=YEAR(NOW())-YEAR(C5)',
    '$71,900.00',
  ],
  ['AVERAGE', null, null, '=AVERAGE(D1:D5)', '=AVERAGE(E1:E5)'],
];

const config = {
  language: 'enUS',
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
  decimalSeparator: '.',
  thousandSeparator: ',',
  functionArgSeparator: ';',
  currencySymbol: ['$', 'USD'],
  localeLang: 'en-US',
  licenseKey: 'gpl-v3',
};

if (!HyperFormula.getRegisteredLanguagesCodes().includes('enUS')) {
  HyperFormula.registerLanguage('enUS', enUS);
}

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty(config);
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

const columnTypes = ['string', 'time', 'date', 'number', 'currency'];

/**
 * Display value in human-readable format
 *
 * @param {SimpleCellAddress} cellAddress Cell address.
 */
function formatCellValue(cellAddress) {
  if (hf.isCellEmpty(cellAddress)) {
    return '';
  }

  if (columnTypes[cellAddress.col] === 'time') {
    return formatTime(hf.numberToTime(hf.getCellValue(cellAddress)));
  }

  if (columnTypes[cellAddress.col] === 'date') {
    return formatDate(hf.numberToDate(hf.getCellValue(cellAddress)));
  }

  if (columnTypes[cellAddress.col] === 'currency') {
    return formatCurrency(hf.getCellValue(cellAddress));
  }

  return hf.getCellValue(cellAddress);
}

/**
 * Date formatting function.
 *
 * @param {{month: *, year: *, day: *}} dateObject Object with date-related information.
 */
function formatDate(dateObject) {
  dateObject.month -= 1;

  return moment(dateObject).format('MM/DD/YYYY');
}

/**
 * Time formatting function.
 *
 * @param dateTimeObject Object with date and time information.
 */
function formatTime(dateTimeObject) {
  return moment(dateTimeObject).format('h:mm A');
}

/**
 * Currency formatting function.
 *
 * @param value Number representing the currency value
 */
function formatCurrency(value) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
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
    newTbodyHTML += `<tr class="${row === height - 1 ? 'summary' : ''}">`;

    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
      const showFormula = cellHasFormula && !calculated;
      const displayValue = showFormula
        ? hf.getCellFormula(cellAddress)
        : formatCellValue(cellAddress);

      newTbodyHTML += `<td class="${cellHasFormula ? updatedCellClass : ''}"><span>${displayValue}</span></td>`;
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
