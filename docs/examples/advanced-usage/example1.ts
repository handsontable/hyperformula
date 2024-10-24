/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);
/* end:skip-in-compilation */

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
    `.example #${sheetName}-container tbody`
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
    hf.getSheetId(sheetInfo.formulas.sheetName)
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
