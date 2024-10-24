/* start:skip-in-compilation */
import HyperFormula from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold'
);
/* end:skip-in-compilation */

const ANIMATION_ENABLED = true;

/**
 * Return sample data for the provided number of rows and columns.
 *
 * @param {number} rows Amount of rows to create.
 * @param {number} columns Amount of columns to create.
 * @returns {string[][]}
 */
function getSampleData(rows, columns) {
  const data = [];

  for (let r = 0; r < rows; r++) {
    data.push([]);

    for (let c = 0; c < columns; c++) {
      data[r].push(`${Math.floor(Math.random() * 999) + 1}`);
    }
  }

  return data;
}

/**
 * A simple state object for the demo.
 *
 * @type {object}
 */
const state = {
  currentSheet: null,
};

/**
 * Input configuration and definition.
 *
 * @type {object}
 */
const inputConfig = {
  'add-sheet': {
    inputs: [
      {
        type: 'text',
        placeholder: 'Sheet name',
      },
    ],
    buttonText: 'Add Sheet',
    disclaimer:
      'For the sake of this demo, the new sheets will be filled with random data.',
  },
  'remove-sheet': {
    inputs: [
      {
        type: 'text',
        placeholder: 'Sheet name',
      },
    ],
    buttonText: 'Remove Sheet',
  },
  'add-rows': {
    inputs: [
      {
        type: 'number',
        placeholder: 'Index',
      },
      {
        type: 'number',
        placeholder: 'Amount',
      },
    ],
    buttonText: 'Add Rows',
  },
  'add-columns': {
    inputs: [
      {
        type: 'number',
        placeholder: 'Index',
      },
      {
        type: 'number',
        placeholder: 'Amount',
      },
    ],
    buttonText: 'Add Columns',
  },
  'remove-rows': {
    inputs: [
      {
        type: 'number',
        placeholder: 'Index',
      },
      {
        type: 'number',
        placeholder: 'Amount',
      },
    ],
    buttonText: 'Remove Rows',
  },
  'remove-columns': {
    inputs: [
      {
        type: 'number',
        placeholder: 'Index',
      },
      {
        type: 'number',
        placeholder: 'Amount',
      },
    ],
    buttonText: 'Remove Columns',
  },
  'get-value': {
    inputs: [
      {
        type: 'text',
        placeholder: 'Cell Address',
      },
      {
        type: 'text',
        disabled: 'disabled',
        placeholder: '',
      },
    ],
    disclaimer: 'Cell addresses format examples: A1, B4, C6.',
    buttonText: 'Get Value',
  },
  'set-value': {
    inputs: [
      {
        type: 'text',
        placeholder: 'Cell Address',
      },
      {
        type: 'text',
        placeholder: 'Value',
      },
    ],
    disclaimer: 'Cell addresses format examples: A1, B4, C6.',
    buttonText: 'Set Value',
  },
};

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

// Add a new sheet and get its id.
state.currentSheet = 'InitialSheet';

const sheetName = hf.addSheet(state.currentSheet);
const sheetId = hf.getSheetId(sheetName);

// Fill the HyperFormula sheet with data.
hf.setSheetContent(sheetId, getSampleData(5, 5));

/**
 * Fill the HTML table with data.
 */
function renderTable() {
  const sheetId = hf.getSheetId(state.currentSheet);
  const tbodyDOM = document.querySelector('.example tbody');
  const updatedCellClass = ANIMATION_ENABLED ? 'updated-cell' : '';
  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      const isEmpty = hf.isCellEmpty(cellAddress);
      const cellHasFormula = hf.doesCellHaveFormula(cellAddress);
      const showFormula = cellHasFormula;
      let cellValue = '';

      if (isEmpty) {
        cellValue = '';
      } else if (!showFormula) {
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
 * Updates the sheet dropdown.
 */
function updateSheetDropdown() {
  const sheetNames = hf.getSheetNames();
  const sheetDropdownDOM = document.querySelector('.example #sheet-select');
  let dropdownContent = '';

  sheetDropdownDOM.innerHTML = '';

  sheetNames.forEach((sheetName) => {
    const isCurrent = sheetName === state.currentSheet;

    dropdownContent += `<option value="${sheetName}" ${
      isCurrent ? 'selected' : ''
    }>${sheetName}</option>`;
  });

  sheetDropdownDOM.innerHTML = dropdownContent;
}

/**
 * Update the form to the provided action.
 *
 * @param {string} action Action chosen from the dropdown.
 */
function updateForm(action) {
  const inputsDOM = document.querySelector('.example #inputs');
  const submitButtonDOM = document.querySelector('.example #inputs button');
  const allInputsDOM = document.querySelectorAll('.example #inputs input');
  const disclaimerDOM = document.querySelector('.example #disclaimer');

  // Hide all inputs
  allInputsDOM.forEach((input) => {
    input.style.display = 'none';
    input.value = '';
    input.disabled = false;
  });

  inputConfig[action].inputs.forEach((inputCfg, index) => {
    const inputDOM = document.querySelector(`.example #input-${index + 1}`);

    // Show only those needed
    inputDOM.style.display = 'block';

    for (const [attribute, value] of Object.entries(inputCfg)) {
      inputDOM.setAttribute(attribute, value);
    }
  });

  submitButtonDOM.innerText = inputConfig[action].buttonText;

  if (inputConfig[action].disclaimer) {
    disclaimerDOM.innerHTML = inputConfig[action].disclaimer;
    disclaimerDOM.parentElement.style.display = 'block';
  } else {
    disclaimerDOM.innerHTML = '&nbsp;';
  }

  inputsDOM.style.display = 'block';
}

/**
 * Add the error overlay.
 *
 * @param {string} message Error message.
 */
function renderError(message) {
  const inputsDOM = document.querySelector('.example #inputs');
  const errorDOM = document.querySelector('.example #error-message');

  if (inputsDOM.className.indexOf('error') === -1) {
    inputsDOM.className += ' error';
  }

  errorDOM.innerText = message;
  errorDOM.parentElement.style.display = 'block';
}

/**
 * Clear the error overlay.
 */
function clearError() {
  const inputsDOM = document.querySelector('.example #inputs');
  const errorDOM = document.querySelector('.example #error-message');

  inputsDOM.className = inputsDOM.className.replace(' error', '');

  errorDOM.innerText = '';
  errorDOM.parentElement.style.display = 'none';
}

/**
 * Bind the events to the buttons.
 */
function bindEvents() {
  const sheetDropdown = document.querySelector('.example #sheet-select');
  const actionDropdown = document.querySelector('.example #action-select');
  const submitButton = document.querySelector('.example #inputs button');

  sheetDropdown.addEventListener('change', (event) => {
    state.currentSheet = event.target.value;

    clearError();

    renderTable();
  });

  actionDropdown.addEventListener('change', (event) => {
    clearError();

    updateForm(event.target.value);
  });

  submitButton.addEventListener('click', (event) => {
    const action = document.querySelector('.example #action-select').value;

    doAction(action);
  });
}

/**
 * Perform the wanted action.
 *
 * @param {string} action Action to perform.
 */
function doAction(action) {
  let cellAddress = null;
  const inputValues = [
    document.querySelector('.example #input-1').value || void 0,
    document.querySelector('.example #input-2').value || void 0,
  ];

  clearError();

  switch (action) {
    case 'add-sheet':
      state.currentSheet = hf.addSheet(inputValues[0]);

      handleError(() => {
        hf.setSheetContent(
          hf.getSheetId(state.currentSheet),
          getSampleData(5, 5)
        );
      });

      updateSheetDropdown();
      renderTable();

      break;
    case 'remove-sheet':
      handleError(() => {
        hf.removeSheet(hf.getSheetId(inputValues[0]));
      });

      if (state.currentSheet === inputValues[0]) {
        state.currentSheet = hf.getSheetNames()[0];

        renderTable();
      }

      updateSheetDropdown();

      break;
    case 'add-rows':
      handleError(() => {
        hf.addRows(hf.getSheetId(state.currentSheet), [
          parseInt(inputValues[0], 10),
          parseInt(inputValues[1], 10),
        ]);
      });

      renderTable();

      break;
    case 'add-columns':
      handleError(() => {
        hf.addColumns(hf.getSheetId(state.currentSheet), [
          parseInt(inputValues[0], 10),
          parseInt(inputValues[1], 10),
        ]);
      });

      renderTable();

      break;
    case 'remove-rows':
      handleError(() => {
        hf.removeRows(hf.getSheetId(state.currentSheet), [
          parseInt(inputValues[0], 10),
          parseInt(inputValues[1], 10),
        ]);
      });

      renderTable();

      break;
    case 'remove-columns':
      handleError(() => {
        hf.removeColumns(hf.getSheetId(state.currentSheet), [
          parseInt(inputValues[0], 10),
          parseInt(inputValues[1], 10),
        ]);
      });

      renderTable();

      break;
    case 'get-value':
      const resultDOM = document.querySelector('.example #input-2');

      cellAddress = handleError(() => {
        return hf.simpleCellAddressFromString(
          inputValues[0],
          hf.getSheetId(state.currentSheet)
        );
      }, 'Invalid cell address format.');

      if (cellAddress !== null) {
        resultDOM.value = handleError(() => {
          return hf.getCellValue(cellAddress);
        });
      }

      break;
    case 'set-value':
      cellAddress = handleError(() => {
        return hf.simpleCellAddressFromString(
          inputValues[0],
          hf.getSheetId(state.currentSheet)
        );
      }, 'Invalid cell address format.');

      if (cellAddress !== null) {
        handleError(() => {
          hf.setCellContents(cellAddress, inputValues[1]);
        });
      }

      renderTable();

      break;
    default:
  }
}

/**
 * Handle the HF errors.
 *
 * @param {Function} tryFunc Function to handle.
 * @param {string} [message] Optional forced error message.
 */
function handleError(tryFunc, message = null) {
  let result = null;

  try {
    result = tryFunc();
  } catch (e) {
    if (e instanceof Error) {
      renderError(message || e.message);
    } else {
      renderError('Something went wrong');
    }
  }

  return result;
}

// // Bind the UI events.
bindEvents();

// Render the table.
renderTable();

// Refresh the sheet dropdown list
updateSheetDropdown();

document.querySelector('.example .message-box').style.display = 'block';
