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
  ['Greg', 'Black', '=CONCATENATE(A1, " ",B1)'],
  ['Anne', 'Carpenter', '=CONCATENATE(A2, " ", B2)'],
  ['Chris', 'Aklips', '=CONCATENATE(A3, " ",B3)'],
];

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

// Add a new sheet and get its id.
const sheetName = hf.addSheet('main');
const sheetId = hf.getSheetId(sheetName);

/**
 * Reinitialize the HF data.
 */
function reinitializeData() {
  hf.setCellContents(
    {
      row: 0,
      col: 0,
      sheet: sheetId,
    },
    tableData
  );
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const copyButton = document.querySelector('.example #copy');
  const pasteButton = document.querySelector('.example #paste');
  const resetButton = document.querySelector('.example #reset');

  copyButton.addEventListener('click', () => {
    copy();
    updateCopyInfo('Second row copied');
  });
  pasteButton.addEventListener('click', () => {
    paste();
    updateCopyInfo('Pasted into the first row');
  });
  resetButton.addEventListener('click', () => {
    reinitializeData();
    updateCopyInfo('');
    renderTable();
  });
}

/**
 * Copy the second row.
 */
function copy() {
  return hf.copy({
    start: { sheet: 0, col: 0, row: 1 },
    end: { sheet: 0, col: 2, row: 1 },
  });
}

/**
 * Paste the HF clipboard into the first row.
 */
function paste() {
  hf.paste({ sheet: 0, col: 0, row: 0 });
  renderTable();
}

const ANIMATION_ENABLED = true;

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
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress)) {
        cellValue = hf.getCellValue(cellAddress);
      }

      newTbodyHTML += `<td class="${updatedCellClass}"><span>
      ${cellValue}
      </span></td>`;
    }

    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Update the information about the copy/paste action.
 *
 * @param {string} message Message to display.
 */
function updateCopyInfo(message) {
  const copyInfoDOM = document.querySelector('.example #copyInfo');

  copyInfoDOM.innerText = message;
}

// Fill the HyperFormula sheet with data.
reinitializeData();
// Bind the button events.
bindEvents();
// Render the table.
renderTable();
