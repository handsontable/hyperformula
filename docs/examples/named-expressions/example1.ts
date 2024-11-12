/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);
/* end:skip-in-compilation */

/**
 * Initial table data.
 */
const tableData = [
  [10, 20, 20, 30],
  [50, 60, 70, 80],
  [90, 100, 110, 120],
  ['=myOneCell', '=myTwoCells', '=myOneColumn', '=myTwoColumns'],
  ['=myFormula+myNumber+34', '=myText', '=myOneRow', '=myTwoRows'],
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

// Add named expressions
hf.addNamedExpression('myOneCell', '=main!$A$1');
hf.addNamedExpression('myTwoCells', '=SUM(main!$A$1, main!$A$2)');
hf.addNamedExpression('myOneColumn', '=SUM(main!$A$1:main!$A$3)');
hf.addNamedExpression('myTwoColumns', '=SUM(main!$A$1:main!$B$3)');
hf.addNamedExpression('myOneRow', '=SUM(main!$A$1:main!$D$1)');
hf.addNamedExpression('myTwoRows', '=SUM(main!$A$1:main!$D$2)');
hf.addNamedExpression('myFormula', '=SUM(0, 1, 1, 2, 3, 5, 8, 13)');
hf.addNamedExpression('myNumber', '=21');
hf.addNamedExpression('myText', 'Apollo 11');

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
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress) && showFormula) {
        cellValue = hf.getCellValue(cellAddress);
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
