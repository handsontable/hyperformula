---
tags:
  - ExcelJS
  - SheetJS
  - PapaParse
  - CSV parser
  - read Excel file
---

# File import

Import XLSX and CSV files into HyperFormula.

## Overview

HyperFormula has no built-in file import functionality. But its [factory methods](../api/classes/hyperformula.md#factories) use standard JavaScript data types, for easy integration with any way of importing data.

## Import CSV files

To import CSV files, use a third-party [CSV parser](https://www.npmjs.com/search?q=csv) (e.g., [PapaParse](https://www.npmjs.com/package/papaparse) or [csv-parse](https://www.npmjs.com/package/csv-parse)). Then pass the result to HyperFormula as a JavaScript array.

## Import XLSX files

To import XLSX files, use a third-party [XLSX parser](https://www.npmjs.com/search?q=xlsx) (e.g., [ExcelJS](https://www.npmjs.com/package/exceljs) or [xlsx](https://www.npmjs.com/package/xlsx)). Then pass the result to HyperFormula as a JavaScript array.

### Excel's internal function prefixes

Excel stores some function names with an internal prefix. It marks every function added after Excel 2007 this way, so a file can contain `_xlfn.IFS(...)` where the user typed `IFS(...)`. The prefixes are an artifact of how Excel saves the file, not part of the function name.

Which prefixes reach your code depends on the parser you use. ExcelJS passes them through. SheetJS removes `_xlfn.` but keeps `_xlws.`.

HyperFormula ignores these prefixes, so you can pass the formula straight to the engine:

| Prefix | Example |
| --- | --- |
| `_xlfn.` | `=_xlfn.IFS(A1>B1,"Pass","Fail")` |
| `_xlfn._xlws.` | `=_xlfn._xlws.FILTER(A1:A9,B1:B9>1)` |
| `_xlws.` | `=_xlws.SORT(A1:A9)` |
| `_xludf.` | `=_xludf.MY_FUNCTION()` |

The `_xlpm.` prefix marks a `LAMBDA`/`LET` parameter name. HyperFormula does not support `LAMBDA` or `LET`, so a formula containing one returns `#NAME?` whether or not the prefix is present.

[`getCellFormula()`](../api/classes/hyperformula.md#getcellformula) returns the formula without the prefix, so `=_xlfn.IFS(A1>B1,"Pass","Fail")` reads back as `=IFS(A1>B1,"Pass","Fail")`.

A prefix does not add a function. If HyperFormula does not support the function itself, the cell holds a `#NAME?` error. See the [list of supported functions](built-in-functions.md).

### Example: Import XLSX files in Node

This example uses [ExcelJS](https://www.npmjs.com/package/exceljs) to import XLSX files into HyperFormula.

See full example on [GitHub](https://github.com/handsontable/hyperformula-demos/tree/3.4.x/read-excel-file).

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
    const sheetDimensions = worksheet.dimensions
    const sheetData = [];

    for (let rowNum = sheetDimensions.top; rowNum <= sheetDimensions.bottom; rowNum++) {
      const rowData = [];

      for (let colNum = sheetDimensions.left; colNum <= sheetDimensions.right; colNum++) {
        const cell = worksheet.getCell(rowNum, colNum)

        const cellData = cell.formula ? `=${cell.formula}` : cell.value;
        rowData.push(cellData);
      }

      sheetData.push(rowData);
    }

    workbookData[worksheet.name] = sheetData;
  })

  return workbookData;
}

run('sample_file.xlsx');
```
