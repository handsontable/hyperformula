/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';
import moment from 'moment';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);

/* end:skip-in-compilation */
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

HyperFormula.registerLanguage('enUS', enUS);

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
  tableData
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

      newTbodyHTML += `<td class="${
        cellHasFormula ? updatedCellClass : ''
      }"><span>${displayValue}</span></td>`;
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
