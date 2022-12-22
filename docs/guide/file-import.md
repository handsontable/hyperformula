# File import

Import XLSX and CSV files into HyperFormula.

## Overview

HyperFormula has no built-in file import functionality. But its [factory methods](../api/classes/hyperformula.md#factories) use standard JavaScript data types, for easy integration with any way of importing data.

## Import CSV files

To import CSV files, use a third-party [CSV parser](https://www.npmjs.com/search?q=csv) (e.g., [PapaParse](https://www.npmjs.com/package/papaparse) or [csv-parse](https://www.npmjs.com/package/csv-parse)). Then pass the result to HyperFormula as a JavaScript array.

## Import XLSX files

To import XLSX files, use a third-party [XLSX parser](https://www.npmjs.com/search?q=xlsx) (e.g., [ExcelJS](https://www.npmjs.com/package/exceljs) or [xlsx](https://www.npmjs.com/package/xlsx)). Then pass the result to HyperFormula as a JavaScript array.

### Example: Import XLSX files in Node

This example uses [ExcelJS](https://www.npmjs.com/package/exceljs) to import XLSX files into HyperFormula. 

See full example on [GitHub](https://github.com/handsontable/hyperformula-demos/tree/2.3.x/read-excel-file).

```js
const ExcelJS = require('exceljs');
const { HyperFormula } = require('hyperformula');

async function run(filename) {
  const xlsxWorkbook = await readXlsxWorkbookFromFile(filename);
  const sheetsAsJavascriptArrays = convertXlsxWorkbookToJavascriptArrays(xlsxWorkbook)
  const hf = HyperFormula.buildFromSheets(sheetsAsJavascriptArrays, { licenseKey: 'gpl-v3' });

  console.log('Formulas:', hf.getSheetSerialized(0));
  console.log('Values:  ', hf.getSheetValues(0));
}

async function readXlsxWorkbookFromFile(filename) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  return workbook;
}

function convertXlsxWorkbookToJavascriptArrays(workbook) {
  const workbookData = {};

  workbook.eachSheet((worksheet) => {
    const sheetData = [];

    worksheet.eachRow((row) => {
      const rowData = [];

      row.eachCell((cell) => {
        const cellData = cell.value.formula ? `=${cell.value.formula}` : cell.value;
        rowData.push(cellData);
      });

      sheetData.push(rowData);
    });

    workbookData[worksheet.name] = sheetData;
  })

  return workbookData;
}

run('sample_file.xlsx');
```
