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
    licenseKey: 'agpl-v3'
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

// in a cell A1 a formula checks which team is a winning one
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
hfInstance.addSheet('TeamA');
// insert playersA content into targeted 'TeamA' sheet
hfInstance.setSheetContent('TeamA', playersA);

// add 'TeamB' sheet
hfInstance.addSheet('TeamB');
// insert playersB content into targeted 'TeamB' sheet
hfInstance.setSheetContent('TeamB', playersB);

// optionally, check the content in the console output
console.log(hfInstance.getAllSheetsValues());
```

After setting everything up, you can add formulas:

```javascript
// add a sheet named 'Formulas'
hfInstance.addSheet('Formulas');
// add formulas to that sheet
hfInstance.setSheetContent('Formulas', formulas);
```

Almost done! Now, you can use the `getSheetValues` method to get all
values including the calculated ones. Alternatively, you can use
`getCellValue`to get the value from a specific cell.

```javascript
// get sheet values from the Sheet of ID 2
const sheetValues = hfInstance.getSheetValues(2);

// get a simple cell address of 'A1' from that sheet
const simpleCellAddress = hfInstance.simpleCellAddressFromString('A1', 2);

// check the winning team 🎉
const winningTeam = hfInstance.getCellValue(simpleCellAddress);

// print the result to the console
console.log(winningTeam)
```

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/0.1.0/advanced-usage?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: advanced-usage"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
