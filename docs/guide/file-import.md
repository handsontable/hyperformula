# File import and export

Import and export XLSX files, and import CSV files, with HyperFormula.

## Overview

HyperFormula can import and export `.xlsx` files out of the box, using the
[ExcelJS](https://www.npmjs.com/package/exceljs) library under the hood. Import
with the [`buildFromFile`](../api/classes/hyperformula.md#buildfromfile) factory
method and export with the [`toFile`](../api/classes/hyperformula.md#tofile)
method.

For any other format (for example CSV), HyperFormula's
[factory methods](../api/classes/hyperformula.md#factories) accept standard
JavaScript arrays, so you can plug in any third-party parser.

::: tip
Only **cell values and formulas** are imported and exported. Cell styling,
number formats, merged cells, charts, images, data validation, and other
Excel-specific features are **not** preserved &mdash; HyperFormula stores only
values and formulas. Formula import assumes the English (`en`) function dialect.
:::

## Import XLSX files

Pass the file's bytes (an `ArrayBuffer` or `Uint8Array`) to the asynchronous
[`buildFromFile`](../api/classes/hyperformula.md#buildfromfile) factory method.
Reading the file itself is left to your environment, so the same API works in
both Node.js and the browser.

### In Node.js

```js
const fs = require('fs');
const { HyperFormula } = require('hyperformula');

async function importXlsx(filePath) {
  const data = fs.readFileSync(filePath); // a Buffer (a Uint8Array)
  const hf = await HyperFormula.buildFromFile(data, { licenseKey: 'gpl-v3' });

  console.log('Formulas:', hf.getSheetSerialized(0));
  console.log('Values:  ', hf.getSheetValues(0));

  return hf;
}
```

### In the browser

```js
import { HyperFormula } from 'hyperformula';

// `file` is a File obtained from an <input type="file"> element.
async function importXlsx(file) {
  const data = await file.arrayBuffer(); // an ArrayBuffer
  const hf = await HyperFormula.buildFromFile(data, { licenseKey: 'gpl-v3' });

  return hf;
}
```

If the bytes cannot be read as an `.xlsx` file, `buildFromFile` rejects with an
[`UnsupportedFileError`](../api/classes/unsupportedfileerror.md).

## Export XLSX files

The asynchronous [`toFile`](../api/classes/hyperformula.md#tofile) method returns
the workbook's bytes as a `Uint8Array`. Writing those bytes is left to your
environment.

### In Node.js

```js
const fs = require('fs');

async function exportXlsx(hf, filePath) {
  const bytes = await hf.toFile();
  fs.writeFileSync(filePath, bytes);
}
```

### In the browser

```js
async function downloadXlsx(hf, fileName) {
  const bytes = await hf.toFile();
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
```

## Import CSV files

HyperFormula has no built-in CSV parser. Use a third-party
[CSV parser](https://www.npmjs.com/search?q=csv) (e.g.,
[PapaParse](https://www.npmjs.com/package/papaparse) or
[csv-parse](https://www.npmjs.com/package/csv-parse)), then pass the resulting
array to [`buildFromArray`](../api/classes/hyperformula.md#buildfromarray).

## Advanced: custom XLSX handling

If you need control over how the workbook is read or written (for example, to
read cached values instead of formulas, or to handle Excel features outside
HyperFormula's value-and-formula model), parse the file yourself with a
third-party [XLSX parser](https://www.npmjs.com/search?q=xlsx) such as
[ExcelJS](https://www.npmjs.com/package/exceljs) or
[xlsx](https://www.npmjs.com/package/xlsx), convert the result to JavaScript
arrays, and pass them to
[`buildFromSheets`](../api/classes/hyperformula.md#buildfromsheets). See a full
example on [GitHub](https://github.com/handsontable/hyperformula-demos/tree/3.4.x/read-excel-file).
