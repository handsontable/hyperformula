/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);
/* end:skip-in-compilation */

const tableData = [['10', '20', '=SUM(A1,B1)']];

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  precisionRounding: 10,
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
