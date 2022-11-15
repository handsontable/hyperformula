# Importing XLSX/CSV files into HyperFormula

Use HyperFormula to calculate the formulas exported from other spreadsheets.

## Overview

HyperFormula itself has no file import functionality. Rather, the static method [`buildFromArray`](../api/classes/hyperformula.md#buildfromarray) uses only the standard JavaScript data types for easy integration with any data importing solution.

If you want to work with XLSX or CSV files, you can decide to use one of the [file parsing libraries](https://www.npmjs.com/search?q=xlsx) and then pass the result to HyperFormula as a JavaScript array.

## Node script importing XLSX files into HyperFormula

This example code uses [ExcelJS](https://www.npmjs.com/package/exceljs) library, but the same feature can be implemented with any other XLSX parsing library.

::: tip
[ExcelJS](https://www.npmjs.com/package/exceljs) library can also read CSV files.
:::

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
