---
title: "Date and time handling"
---


The formats for the default date and time parsing functions can be set using configuration options:
- [`dateFormats`](/docs/api/interfaces/configparams#dateformats),
- [`timeFormats`](/docs/api/interfaces/configparams#timeformats),
- [`nullYear`](/docs/api/interfaces/configparams#nullyear).

The API reference of [`dateFormats`](/docs/api/interfaces/configparams#dateformats) and [`timeFormats`](/docs/api/interfaces/configparams#timeformats) describes the supported date and time formats in detail.

## Example

By default, HyperFormula uses the European date and time formats.

```javascript
dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'], // set by default
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
```

To use the US date and time formats, set:

```javascript
dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'], // US date formats
timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
```

## Custom date and time handling

If date and time formats supported by the [`dateFormats`](/docs/api/interfaces/configparams#dateformats) and [`timeFormats`](/docs/api/interfaces/configparams#timeformats) parameters are not enough, you can extend them by providing the following options:

- [`parseDateTime`](/docs/api/interfaces/configparams#parsedatetime), which allows to provide a function that accepts
a string representing date/time and parses it into an actual date/time format
- [`stringifyDateTime`](/docs/api/interfaces/configparams#stringifydatetime), which allows to provide a function that
takes the date/time and prints it as a string
- [`stringifyDuration`](/docs/api/interfaces/configparams#stringifyduration), which allows to provide a function that
takes time duration and prints it as a string

To extend the number of possible date formats, you will need to
configure [`parseDateTime`](/docs/api/interfaces/configparams#parsedatetime) . This functionality is based on callbacks,
and you can customize the formats by integrating a third-party
library like [Moment.js](https://momentjs.com/), or by writing your
own custom function that returns a [`DateTime`](/docs/api/globals#datetime) object.

The configuration of date formats and stringify options may impact some built-in functions.
For instance, the `VALUE` function transforms strings
into numbers, which means it uses [`parseDateTime`](/docs/api/interfaces/configparams#parsedatetime). The `TEXT` function
works the other way round - it accepts a number and returns a string,
so it uses `stringifyDateTime`. Any change here might give you
different results. Criteria-based functions (`SUMIF`, `AVERAGEIF`, etc.) perform comparisons, so they also need to
work on strings, dates, etc.

## Moment.js integration

In this example, you will add the possibility to parse dates in the
`"Do MMM YY"` custom format.

To do so, you first need to write a function using
[Moment.js API](https://momentjs.com/docs/):

```javascript
import moment from "moment";

// write a custom function for parsing dates
export const customParseDate = (dateString, dateFormat) => {
  const momentDate = moment(dateString, dateFormat, true);
  // check validity of a date with moment.js method
  if (momentDate.isValid()) {
    return {
      year: momentDate.year(),
      month: momentDate.month() + 1,
      day: momentDate.date()
    };
  }
  // if the string was not recognized as
  // a valid date return nothing
  return undefined;
};
```

Then, use it inside the
[configuration options](/docs/guide/configuration-options) like so:

```javascript
const options = {
    parseDateTime: customParseDate,
    // you can add more formats
    dateFormats: ["Do MMM YY"]
};
```

After that, you should be able to add a dataset with dates in
your custom format:

```javascript
const data = [["31st Jan 00", "2nd Jun 01", "=B1-A1"]];
```

And now, HyperFormula recognizes these values as valid dates and can operate on them.

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
<div class="hf-example__preview" data-example-js="/examples/date-time/example1.js">
<div class="example">
  <button id="run" class="button run">
    Run calculations
  </button>
  <button id="reset" class="button button-outline reset">
    Reset
  </button>
  <table>
    <colgroup>
      <col style="width:20%" />
      <col style="width:20%" />
      <col style="width:30%" />
    </colgroup>
    <thead>
    <tr>
      <th>Release 1.0.0</th>
      <th>Release 4.3.1</th>
      <th>Number of days between</th>
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
 * Function defining the way HF should handle the provided date string.
 *
 * @param {string} dateString The date string.
 * @param {string} dateFormat The date format.
 * @returns {{month: *, year: *, day: *}} Object with date-related information.
 */
const customParseDate = (dateString, dateFormat) => {
  const momentDate = moment(dateString, dateFormat, true);

  if (momentDate.isValid()) {
    return {
      year: momentDate.year(),
      month: momentDate.month() + 1,
      day: momentDate.date(),
    };
  }
};

/**
 * Date formatting function.
 *
 * @param {{month: *, year: *, day: *}} dateObject Object with date-related information.
 * @returns {string} Formatted date string.
 */
const getFormattedDate = (dateObject) => {
  dateObject.month -= 1;

  return moment(dateObject).format('MMM D YY');
};

/**
 * Initial table data.
 */
const tableData = [['Jan 31 00', 'Jun 2 01', '=B1-A1']];
// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  parseDateTime: customParseDate,
  dateFormats: ['MMM D YY'],
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
      const cellValue = displayValue(cellAddress, showFormula);

      newTbodyHTML += `<td class="${cellHasFormula ? updatedCellClass : ''}"><span>
      ${cellValue}
      </span></td>`;
    }
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Force the table to display either the formula, the value or a raw source data value.
 *
 * @param {SimpleCellAddress} cellAddress Cell address.
 * @param {boolean} showFormula `true` if the formula should be visible.
 */
function displayValue(cellAddress, showFormula) {
  // Declare which columns should display the raw source data, instead of the data from HyperFormula.
  const sourceColumns = [0, 1];
  let cellValue = '';

  if (sourceColumns.includes(cellAddress.col)) {
    cellValue = getFormattedDate(hf.numberToDate(hf.getCellValue(cellAddress)));
  } else {
    if (!hf.isCellEmpty(cellAddress) && showFormula) {
      cellValue = hf.getCellValue(cellAddress);
    } else {
      cellValue = hf.getCellFormula(cellAddress);
    }
  }

  return cellValue;
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
