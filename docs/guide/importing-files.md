# Importing XLSX/CSV files into HyperFormula

Use HyperFormula to calculate the formulas exported from other spreadsheets.

## Overview

HyperFormula itself has no file import functionality. If you want to work with XLSX or CSV file, you need to use one of the [file parsing libraries](https://www.npmjs.com/search?q=xlsx) and then pass its result to HyperFormula as a javascript array.

## Node script importing XLSX files into HyperFormula

This example code uses [ExcelJS](https://www.npmjs.com/package/exceljs) library, but the same feature can be implemented with any other XLSX parsing library.

::: tip
[ExcelJS](https://www.npmjs.com/package/exceljs) library can also be used to read CSV files.
:::

```js
const ExcelJS = require('exceljs');
const { HyperFormula } = require('hyperformula');

async function run(filename) {
  const xlsxWorkbook = await readXlsxWorkbookFromFile(filename);
  const sheetsAsJavascriptArrays = convertXlsxWorkbookToJavascriptArrays(xlsxWorkbook)
  const hfInstance = HyperFormula.buildFromSheets(sheetsAsJavascriptArrays, { licenseKey: 'gpl-v3' });

  console.log('Formulas:', hfInstance.getSheetSerialized(0));
  console.log('Values:  ', hfInstance.getSheetValues(0));
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
