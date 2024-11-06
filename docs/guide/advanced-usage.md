# Advanced usage

::: tip
By default, cells are identified using a `SimpleCellAddress` which
consists of a sheet ID, column ID, and row ID, like
this: `{ sheet: 0, col: 0, row: 0 }`

Alternatively, you can work with the **A1 notation** known from
spreadsheets like Excel or Google Sheets. The API provides the helper
function `simpleCellAddressFromString` which you can use to
retrieve the `SimpleCellAddress` .
:::

The following example shows how to use formulas to find out which of
the two Teams (A or B) is the winning one. You will do that by
comparing the average scores of players in each team.

The initial steps are the same as in the
[basic example](basic-usage.md). First, import HyperFormula and choose
the configuration options:

```javascript
import { HyperFormula } from 'hyperformula';

const options = {
    licenseKey: 'gpl-v3'
};
```

This time you will use the `buildFromEmpty` static method to
initialize the engine:

```javascript
// initiate the engine with no data
const hfInstance = HyperFormula.buildEmpty(options);
```

Now, let's prepare some data. The first column will be players'
IDs and the second column will be their scores. Then, you will
define the formulas responsible for calculating the average scores.

```javascript
// first column represents players' IDs
// second column represents players' scores
const playersA = [
    ['1', '2'],
    ['2', '3'],
    ['3', '5'],
    ['4', '7'],
    ['5', '13'],
    ['6', '17']
];

const playersB = [
    ['7', '19'],
    ['8', '31'],
    ['9', '61'],
    ['10', '89'],
    ['11', '107'],
    ['12', '127']
];

// in cell A1 a formula checks which team is the winning one
// in cells A2 and A3 formulas calculate the average score of players
const formulas = [
    ['=IF(Formulas!A2>Formulas!A3,"TeamA","TeamB")'],
    ['=AVERAGE(TeamA!B1:B6)'],
    ['=AVERAGE(TeamB!B1:B6)']
];
```

Now prepare sheets and insert the data into them:

```javascript
// add 'TeamA' sheet
const sheetNameA = hfInstance.addSheet('TeamA');
// get the new sheet ID for further API calls
const sheetIdA = hfInstance.getSheetId(sheetNameA);
// insert playersA content into targeted 'TeamA' sheet
hfInstance.setSheetContent(sheetIdA, playersA);

// add 'TeamB' sheet
const sheetNameB = hfInstance.addSheet('TeamB');
// get the new sheet ID for further API calls
const sheetIdB = hfInstance.getSheetId(sheetNameB);
// insert playersB content into targeted 'TeamB' sheet
hfInstance.setSheetContent(sheetIdB, playersB);

// check the content in the console output
console.log(hfInstance.getAllSheetsValues());
```

After setting everything up, you can add formulas:

```javascript
// add a sheet named 'Formulas'
const sheetNameC = hfInstance.addSheet('Formulas');
// get the new sheet ID for further API calls
const sheetIdC = hfInstance.getSheetId(sheetNameC);
// add formulas to that sheet
hfInstance.setSheetContent(sheetIdC, formulas);
```

Almost done! Now, you can use the `getSheetValues` method to get all
values including the calculated ones. Alternatively, you can use
`getCellValue`to get the value from a specific cell.

```javascript
// get all sheet values 
const sheetValues = hfInstance.getSheetValues(sheetIdC);

// get the simple cell address of 'A1' from that sheet
const simpleCellAddress = hfInstance.simpleCellAddressFromString('A1', sheetIdC);

// check the winning team 🎉
const winningTeam = hfInstance.getCellValue(simpleCellAddress);

// print the result to the console
console.log(winningTeam)
```

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/advanced-usage/example1.html)

@[code](@/docs/examples/advanced-usage/example1.css)

@[code](@/docs/examples/advanced-usage/example1.js)

@[code](@/docs/examples/advanced-usage/example1.ts)

:::
