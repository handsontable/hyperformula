/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';
import moment from 'moment';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);

/* end:skip-in-compilation */
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
  tableData
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

      newTbodyHTML += `<td class="${
        cellHasFormula ? updatedCellClass : ''
      }"><span>
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
