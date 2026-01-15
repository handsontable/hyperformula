/* start:skip-in-compilation */
import HyperFormula, { RoundingMode } from 'hyperformula';

console.log(
  `%c Using HyperFormula ${HyperFormula.version}`,
  'color: blue; font-weight: bold',
);
/* end:skip-in-compilation */

// Financial data with decimal prices (as strings to preserve precision)
const invoiceData = [
  ['Item', 'Quantity', 'Unit Price', 'Total'],
  ['Widget A', '100', '19.99', '=B2*C2'],
  ['Widget B', '250', '7.49', '=B3*C3'],
  ['Widget C', '50', '149.99', '=B4*C4'],
  ['Service Fee', '1', '0.01', '=B5*C5'],  // Small amount to test precision
  ['', '', 'Subtotal', '=SUM(D2:D5)'],
  ['', '', 'Tax (8.25%)', '=D6*0.0825'],
  ['', '', 'Grand Total', '=D6+D7'],
];

// Problematic IEEE-754 calculations
const precisionTestData = [
  ['Description', 'Formula', 'Result'],
  ['0.1 + 0.2', '=0.1+0.2', ''],
  ['0.3 - 0.1 - 0.2', '=0.3-0.1-0.2', ''],
  ['1.1 + 2.2', '=1.1+2.2', ''],
  ['0.1 * 3', '=0.1*3', ''],
  ['0.3 / 3', '=0.3/3', ''],
];

// Create a precise HyperFormula instance (default)
const hfPrecise = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  numericImplementation: 'precise',
  numericDigits: 34,
  numericRounding: RoundingMode.ROUND_HALF_EVEN,  // Banker's rounding
});

// Create a native HyperFormula instance for comparison
const hfNative = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  numericImplementation: 'native',
});

// Add sheets to both instances
hfPrecise.addSheet('Invoice');
hfPrecise.setSheetContent(hfPrecise.getSheetId('Invoice'), invoiceData);
hfPrecise.addSheet('PrecisionTests');
hfPrecise.setSheetContent(hfPrecise.getSheetId('PrecisionTests'), precisionTestData);

hfNative.addSheet('Invoice');
hfNative.setSheetContent(hfNative.getSheetId('Invoice'), invoiceData);
hfNative.addSheet('PrecisionTests');
hfNative.setSheetContent(hfNative.getSheetId('PrecisionTests'), precisionTestData);

/**
 * Render the invoice table.
 */
function renderInvoiceTable(hf: typeof hfPrecise, containerId: string, usePrecision: boolean) {
  const sheetId = hf.getSheetId('Invoice');
  const tbodyDOM = document.querySelector(`.example #${containerId} tbody`);
  
  if (!tbodyDOM) return;

  const { height, width } = hf.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 0; row < height; row++) {
    newTbodyHTML += '<tr>';
    for (let col = 0; col < width; col++) {
      const cellAddress = { sheet: sheetId, col, row };
      let cellValue: string | number | boolean | null = '';

      if (!hf.isCellEmpty(cellAddress)) {
        if (usePrecision && hf.doesCellHaveFormula(cellAddress)) {
          // Use precise string representation for formula results
          cellValue = hf.getCellValueWithPrecision(cellAddress);
        } else {
          cellValue = hf.getCellValue(cellAddress);
        }
      }

      // Format currency columns
      if (col === 2 || col === 3) {
        if (typeof cellValue === 'number' || (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue)))) {
          const numVal = typeof cellValue === 'number' ? cellValue : parseFloat(cellValue);
          if (row > 0) {
            cellValue = `$${numVal.toFixed(2)}`;
          }
        }
      }

      newTbodyHTML += `<td>${cellValue}</td>`;
    }
    newTbodyHTML += '</tr>';
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

/**
 * Render the precision test results.
 */
function renderPrecisionTests() {
  const tbodyDOM = document.querySelector('.example #precision-tests tbody');
  
  if (!tbodyDOM) return;

  const sheetId = hfPrecise.getSheetId('PrecisionTests');
  const { height } = hfPrecise.getSheetDimensions(sheetId);
  let newTbodyHTML = '';

  for (let row = 1; row < height; row++) {
    const description = hfPrecise.getCellValue({ sheet: sheetId, col: 0, row });
    const preciseResult = hfPrecise.getCellValueWithPrecision({ sheet: sheetId, col: 1, row });
    const nativeResult = hfNative.getCellValue({ sheet: hfNative.getSheetId('PrecisionTests'), col: 1, row });
    
    const isCorrect = preciseResult === description.toString().split(' ')[0] || 
                      preciseResult === description.toString().split(' ')[2];

    newTbodyHTML += `<tr>
      <td>${description}</td>
      <td class="native">${nativeResult}</td>
      <td class="precise ${isCorrect ? 'correct' : ''}">${preciseResult}</td>
    </tr>`;
  }

  tbodyDOM.innerHTML = newTbodyHTML;
}

// Render the tables
renderInvoiceTable(hfNative, 'invoice-native', false);
renderInvoiceTable(hfPrecise, 'invoice-precise', true);
renderPrecisionTests();
