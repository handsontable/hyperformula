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
  ['Greg Black', '100'],
  ['Anne Carpenter', '=SUM(100,100)'],
  ['Natalie Dem', '500'],
  ['John Sieg', '50'],
  ['Chris Aklips', '20'],
  ['Bart Hoopoe', '700'],
  ['Chris Site', '80'],
  ['Agnes Whitey', '90'],
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

/**
 * Sort the HF's dataset.
 *
 * @param {boolean} ascending `true` if sorting in ascending order, `false` otherwise.
 * @param {Function} callback The callback function.
 */
function sort(ascending, callback) {
  const rowCount = hf.getSheetDimensions(sheetId).height;
  const colValues = [];
  let newOrder = null;
  const newOrderMapping = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    colValues.push({
      rowIndex,
      value: hf.getCellValue({
        sheet: sheetId,
        col: 1,
        row: rowIndex,
      }),
    });
  }

  colValues.sort((objA, objB) => {
    const delta = objA.value - objB.value;

    return ascending ? delta : -delta;
  });
  newOrder = colValues.map((el) => el.rowIndex);
  newOrder.forEach((orderIndex, arrIndex) => {
    newOrderMapping[orderIndex] = arrIndex;
  });
  hf.setRowOrder(sheetId, newOrderMapping);
  callback();
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

const doSortASC = () => {
  sort(true, () => {
    renderTable(true);
  });
};

const doSortDESC = () => {
  sort(false, () => {
    renderTable(true);
  });
};

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const ascSort = document.querySelector('.example #asc');
  const descSort = document.querySelector('.example #desc');

  ascSort.addEventListener('click', () => {
    doSortASC();
  });
  descSort.addEventListener('click', () => {
    doSortDESC();
  });
}

const ANIMATION_ENABLED = true;

// Bind the button events.
bindEvents();
// Render the table.
renderTable();
