/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';
/* end:skip-in-compilation */

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);

/**
 * Initial table data.
 */
const tableData = [
  ['Greg', '2'],
  ['Chris', '4'],
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

// Clear the undo stack to prevent undoing the initialization steps.
hf.clearUndoStack();

/**
 * Fill the HTML table with data.
 */
function renderTable() {
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const cellValue = hf.getCellValue(cellAddress);

      newTbodyHTML += `<td class="${updatedCellClass}"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Clear the existing information.
 */
function clearInfo() {
  const infoBoxDOM = document.querySelector('.example #info-box');

  infoBoxDOM.innerHTML = '&nbsp;';
}

/**
 * Display the provided message in the info box.
 *
 * @param {string} message Message to display.
 */
function displayInfo(message) {
  const infoBoxDOM = document.querySelector('.example #info-box');

  infoBoxDOM.innerText = message;
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const removeRowButton = document.querySelector('.example #remove-row');
  const undoButton = document.querySelector('.example #undo');

  removeRowButton.addEventListener('click', () => {
    removeSecondRow();
  });

  undoButton.addEventListener('click', () => {
    undo();
  });
}

/**
 * Remove the second row from the table.
 */
function removeSecondRow() {
  const filledRowCount = hf.getSheetDimensions(sheetId).height;

  clearInfo();

  if (filledRowCount < 2) {
    displayInfo("There's not enough filled rows to perform this action.");

    return;
  }

  hf.removeRows(sheetId, [1, 1]);
  renderTable();
}

/**
 * Run the HF undo action.
 */
function undo() {
  clearInfo();

  if (!hf.isThereSomethingToUndo()) {
    displayInfo("There's nothing to undo.");

    return;
  }

  hf.undo();
  renderTable();
}

const ANIMATION_ENABLED = true;

// Bind the button events.
bindEvents();

// Render the table.
renderTable();
