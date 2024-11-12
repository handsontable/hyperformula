/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);

/* end:skip-in-compilation */
const tableData = [
  ['Greg Black', 4.66, '=B1*1.3', '=AVERAGE(B1:C1)', '=SUM(B1:C1)'],
  ['Anne Carpenter', 5.25, '=$B$2*30%', '=AVERAGE(B2:C2)', '=SUM(B2:C2)'],
  ['Natalie Dem', 3.59, '=B3*2.7+2+1', '=AVERAGE(B3:C3)', '=SUM(B3:C3)'],
  ['John Sieg', 12.51, '=B4*(1.22+1)', '=AVERAGE(B4:C4)', '=SUM(B4:C4)'],
  [
    'Chris Aklips',
    7.63,
    '=B5*1.1*SUM(10,20)+1',
    '=AVERAGE(B5:C5)',
    '=SUM(B5:C5)',
  ],
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
  tableData
);
// Add named expressions for the "TOTAL" row.
hf.addNamedExpression('Year_1', '=SUM(main!$B$1:main!$B$5)');
hf.addNamedExpression('Year_2', '=SUM(main!$C$1:main!$C$5)');

// Bind the events to the buttons.
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

/**
 * Fill the HTML table with data.
 *
 * @param {boolean} calculated `true` if it should render calculated values, `false` otherwise.
 */
function renderTable(calculated = false) {
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const totals = ['=SUM(Year_1)', '=SUM(Year_2)'];
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

      newTbodyHTML += `<td class="${
        cellHasFormula ? updatedCellClass : ''
      }"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  totalRowsHTML = `<tr class="summary">
<td>TOTAL</td>
<td class="${updatedCellClass}">
  <span>${
    calculated ? hf.calculateFormula(totals[0], sheetId).toFixed(2) : totals[0]
  }</span>
</td>
<td class="${updatedCellClass}">
  <span>${
    calculated ? hf.calculateFormula(totals[1], sheetId).toFixed(2) : totals[1]
  }</span>
</td>
<td colspan="2"></td>
</tr>`;
  newTbodyHTML += totalRowsHTML;
  tbodyDOM.innerHTML = newTbodyHTML;
}

// Replace formulas with their results.
function runCalculations() {
  renderTable(true);
}

// Replace the values in the table with initial data.
function resetTable() {
  renderTable();
}

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
