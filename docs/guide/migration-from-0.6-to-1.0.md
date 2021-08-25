# Migrating from 0.6 to 1.0

To upgrade your HyperFormula version from 0.6.x to 1.0.x, follow this guide.

## Step 1: Change your license key

If you use the AGPLv3 license, or the free non-commercial license, you need to change your license key.

If you use a commercial license, you don't need to make any changes.

### Open-source license

If you use the open-source version of HyperFormula, in your configuration options, pass the `gpl-v3` string instead of the `agpl-v3` string:

Before:
```js
const options = {
  licenseKey: 'agpl-v3',
}
```

After:
```js
const options = {
  // use `gpl-v3` instead of `agpl-v3`
  licenseKey: 'gpl-v3',
}
```

### Free non-commercial license

If you use the free non-commercial license, switch to the GPLv3 license or purchase a commercial license.

For more details on HyperFormula license keys, go [here](license-key.md).

## Step 2: Change `sheetName` to `sheetId`

Most sheet-related methods now take the `sheetID` number parameter instead of the `sheetName` string parameter.

For example, use the `clearSheet()` method in this way:

Before:
```js
const hfInstance = HyperFormula.buildFromSheets({
 MySheet1: [ ['=SUM(MySheet2!A1:A2)'] ],
 MySheet2: [ ['10'] ],
});

const changes = hfInstance.clearSheet('MySheet2');
```

After:
```js
const hfInstance = HyperFormula.buildFromSheets({
 MySheet1: [ ['=SUM(MySheet2!A1:A2)'] ],
 MySheet2: [ ['10'] ],
});

// use `sheetId` instead of `sheetName`
const changes = hfInstance.clearSheet(1);
```

The only methods still accepting the `sheetName` string parameter are now:
- `addSheet()`: needs `sheetName` to give a name to  the new sheet. Generates the new sheet's `sheetId`
- `isItPossibleToAddSheet()`: needs `sheetName` to check if it's possible to add a new sheet with that name
- `doesSheetExist()`: needs `sheetName` to check if a sheet with that name exists
- `getSheetId()`: needs `sheetName` to get the sheet's `sheetId`

Also, these methods still accept the `newName` string parameter:
- `renameSheet()`: needs `newName` to give a new name to an existing sheet
- `isItPossibleToRenameSheet()`: needs `newName` to check if it's possible to give that new name to an existing sheet

## Step 3: Adapt to the `matrix`->`array` name changes

Adapt to the following changes in configuration option names, API method names and exception names:

### Configuration option names

| Before                  | After                    |
|-------------------------|--------------------------|
| `matrixColumnSeparator` | `arrayColumnSeparator`   |
| `matrixRowSeparator`    | `arrayRowSeparator`      |

### API method names

| Before               | After               |
|----------------------|---------------------|
| `matrixMapping`      | `arrrayMapping`     |
| `isCellPartOfMatrix` | `isCellPartOfArray` |

### Exception names

| Before                         | After                         |
|--------------------------------|-------------------------------|
| `SourceLocationHasMatrixError` | `SourceLocationHasArrayError` |
| `TargetLocationHasMatrixError` | `TargetLocationHasArrayError` |


## Step 4: Drop the matrix formula notation

Switch from the matrix formula notation to the array formula notation.

For more information on the array formula notation, go [here](arrays.md).

Before:
```js
={ISEVEN(A2:A5*10)}
```

Now, if the `useArrayArithmetic` configuration option is set to `false`, use the `ARRAYFORMULA` function to [enable the array arithmetic mode locally](arrays.md#enabling-the-array-arithmetic-mode-locally):
```js
=ARRAYFORMULA(ISEVEN(A2:A5*10))
```

But when the `useArrayArithmetic` configuration option is set to `true`, you don't need to use the `ARRAYFORMULA` function, as the array arithmetic mode is [enabled globally](arrays.md#enabling-the-array-arithmetic-mode-globally):
```js
=ISEVEN(A2:A5*10)
```

## Step 5: Drop the `matrixDetection` and `matrixDetectionThreshold` options

Remove the `matrixDetection` and `matrixDetectionThreshold` options from your HyperFormula configuration.

Before:
```js
// define options 
const options = {
    licenseKey: 'gpl-v3',
    matrixDetection: true,
    matrixDetectionThreshold: 150
};
```

After:
```js
// define options 
const options = {
    licenseKey: 'gpl-v3'
    // remove `matrixDetection` and `matrixDetectionThreshold`
};
```

## Step 6: Switch to the `SimpleCellRange` type argument

If you use any of the following methods, update your code to take the `SimpleCellRange` type argument:

- `copy()`
- `cut()`
- `getCellDependents()`
- `getCellPrecedents()`
- `getFillRangeData()`
- `getRangeFormulas()`
- `getRangeSerialized()`
- `getRangeValues()`
- `isItPossibleToMoveCells()`
- `isItPossibleToSetCellContents()`
- `moveCells()`

Before:
```js
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// takes `simpleCellAddress`, `width`, and `height`
// returns: [ [ 2 ] ]
const clipboardContent = hfInstance.copy({ sheet: 0, col: 1, row: 0 }, 1, 1);
```

After:
```js
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// takes `simpleCellRange`
// returns: [ [ 2 ] ]
const clipboardContent = hfInstance.copy({ start: { sheet: 0, col: 1, row: 0 }, end: { sheet: 0, col: 1, row: 0 } });
```

## Step 7: Adapt to the array changes

If you use any of the following methods, adjust your application to the changes in their behavior:

### `setCellContents()`
The `setCellContents()` method now can override space occupied by spilled arrays.

### `addRows()` and `removeRows()`
The `addRows()` method now can add rows across a spilled array, without changing the array size.

The `removeRows()` method now can remove rows from across a spilled array, without changing the array size.

### `addColumns()` and `removeColumns()`
The `addColumns()` method now can add columns across a spilled array, without changing the array size.

The `removeColumns()` method now can remove columns from across a spilled array, without changing the array size.
