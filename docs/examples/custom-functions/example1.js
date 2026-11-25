/* start:skip-in-compilation */
import HyperFormula, {
  ArraySize,
  CellError,
  FunctionArgumentType,
  FunctionPlugin,
  SimpleRangeValue,
} from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold',
);

/* end:skip-in-compilation */
/* start:skip-in-source */
const {
  ArraySize,
  CellError,
  FunctionArgumentType,
  FunctionPlugin,
  SimpleRangeValue,
} = HyperFormula;

/* end:skip-in-source */
/**
 * Custom function plugin.
 */
class MyCustomPlugin extends FunctionPlugin {
  greet(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('GREET'),
      (firstName) => {
        return `👋 Hello, ${firstName}!`;
      },
    );
  }
  doubleRange(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('DOUBLE_RANGE'),
      (range) => {
        const rangeData = range.data;
        const dataAsNumbers = rangeData.map((row) =>
          row.map((val) => this.internalScalarValueToNumber(val)),
        );

        if (dataAsNumbers.some((row) => row.some((val) => val === undefined))) {
          return new CellError(
            'VALUE',
            'Function DOUBLE_RANGE operates only on numbers.',
          );
        }

        const doubledData = dataAsNumbers.map((row) =>
          row.map((val) => val * 2),
        );

        return SimpleRangeValue.onlyValues(doubledData);
      },
    );
  }
  internalScalarValueToNumber(value) {
    const rawValue = value.val ?? value;

    return typeof rawValue === 'number' ? rawValue : undefined;
  }
  doubleRangeResultArraySize(ast, state) {
    const arg = ast?.args?.[0];

    if (arg?.start == null || arg?.end == null) {
      return ArraySize.scalar();
    }

    const width = arg.end.col - arg.start.col + 1;
    const height = arg.end.row - arg.start.row + 1;

    return new ArraySize(width, height);
  }
}
// Static property with the custom functions definitions
MyCustomPlugin.implementedFunctions = {
  GREET: {
    method: 'greet',
    parameters: [{ argumentType: FunctionArgumentType.STRING }],
  },
  DOUBLE_RANGE: {
    method: 'doubleRange',
    sizeOfResultArrayMethod: 'doubleRangeResultArraySize',
    parameters: [{ argumentType: FunctionArgumentType.RANGE }],
  },
};

// Custom functions translations
const MyCustomPluginTranslations = {
  enGB: {
    GREET: 'GREET',
    DOUBLE_RANGE: 'DOUBLE_RANGE',
  },
  enUS: {
    GREET: 'GREET',
    DOUBLE_RANGE: 'MAKE_TWICE',
  },
};

// Register the custom function plugin, before you create the HyperFormula instance
HyperFormula.registerFunctionPlugin(MyCustomPlugin, MyCustomPluginTranslations);

/**
 * Initial table data.
 */
const tableData = [
  ['Anthony', '=GREET(A1)'],
  ['Barbara', '=GREET(A2)'],
  ['Charles', '=GREET(A3)'],
  ['David', '=GREET(A4)'],
  ['-', '-'],
  [1, '=DOUBLE_RANGE(A6:A9)'],
  [2],
  [3],
  [4],
];

// Create an empty HyperFormula instance.
const hf = HyperFormula.buildEmpty({
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/?tab=hyperformula
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
  tableData,
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
      let cellValue = '';

      if (!hf.isCellEmpty(cellAddress) && showFormula) {
        cellValue = hf.getCellValue(cellAddress);
      } else {
        cellValue = hf.getCellFormula(cellAddress);
      }

      newTbodyHTML += `<td class="${cellHasFormula ? updatedCellClass : ''}"><span>
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
