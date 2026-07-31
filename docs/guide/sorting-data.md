# Sorting data

In HyperFormula, you can sort data by reordering rows and columns.

## Sorting data in HyperFormula

To sort data in HyperFormula, you reorder rows (or columns), by providing your preferred permutation of row (or column) indexes.

The permutation array has the form `[ newPositionForRow0, newPositionForRow1, newPositionForRow2, ... ]`. The value at index `i` is the new position for the row that is currently at index `i`.

You can implement any sorting algorithm that returns such an array of row or column indexes.

## Sorting rows

To sort rows, use the [`isItPossibleToSetRowOrder`](../api/classes/hyperformula.md#isitpossibletosetroworder) and [`setRowOrder`](../api/classes/hyperformula.md#setroworder) methods.

### Step 1: Choose a new row order
Choose your required permutation of row indexes.

For example, if you want to move the bottom row to the top of a 3-row sheet, set the order to `[1, 2, 0]` instead of `[0, 1, 2]`. This moves the row at index 0 to position 1, the row at index 1 to position 2, and the row at index 2 to position 0:

```js
// a HyperFormula instance with example data
const hfInstance = HyperFormula.buildFromArray([
 ['A'],
 ['B'],
 ['C'],
]);

// we'll set the row order to [1, 2, 0] in the next steps
// the resulting sheet will be: [['C'], ['A'], ['B']]
```

::: tip
The [`setRowOrder`](../api/classes/hyperformula.md#setroworder) method accepts an array of numbers, so you can implement any function that returns an array with your required row order.
:::

::: warning
The permutation array maps **current positions** to **new positions**, not the other way around. The value at index `i` tells HyperFormula where to move the row currently at index `i`, *not* which row should end up at index `i`.

For example, `[1, 2, 0]` means "move row 0 to position 1, row 1 to position 2, row 2 to position 0". It does **not** mean "the new row 0 comes from position 1, the new row 1 comes from position 2, ...".
:::

### Step 2: Check if the new row order can be applied

Before you change the row order, check if your specified row number permutation can actually be applied.

Thanks to the [`isItPossibleTo*` methods](basic-operations.md#isitpossibleto-methods), you can check if an operation is allowed, and display an error message if it's not.

Use the [`isItPossibleToSetRowOrder`](../api/classes/hyperformula.md#isitpossibletosetroworder) method:

```js
const hfInstance = HyperFormula.buildFromArray([
 ['A'],
 ['B'],
 ['C'],
]);

// a variable to carry the user message
let messageUsedInUI;

// check if your permutation can be applied
const isRowOrderOk = hfInstance.isItPossibleToSetRowOrder(0, [1, 2, 0]);

// display an error message
if (!isRowOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort rows in this way.'
}
```

### Step 3: Set the new row order

If your specified row number permutation is valid, change the row order:

```js
const hfInstance = HyperFormula.buildFromArray([
 ['A'],
 ['B'],
 ['C'],
]);

let messageUsedInUI;

const isRowOrderOk = hfInstance.isItPossibleToSetRowOrder(0, [1, 2, 0]);

if (!isRowOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort rows in this way.'
} else {
  // set the new row order
  hfInstance.setRowOrder(0, [1, 2, 0]);
}
// the resulting sheet is: [['C'], ['A'], ['B']]

// the method returns an array of cells whose values changed:
// [{
//   address: { sheet: 0, col: 0, row: 1 },
//   newValue: 'A',
// },
// {
//   address: { sheet: 0, col: 0, row: 2 },
//   newValue: 'B',
// },
// {
//   address: { sheet: 0, col: 0, row: 0 },
//   newValue: 'C',
// }]
```

## Sorting columns

To sort columns, use the [`isItPossibleToSetColumnOrder`](../api/classes/hyperformula.md#isitpossibletosetcolumnorder) and [`setColumnOrder`](../api/classes/hyperformula.md#setcolumnorder) methods.

The permutation array has the same shape as for rows: `[ newPositionForColumn0, newPositionForColumn1, newPositionForColumn2, ... ]`. The value at index `i` is the new position for the column that is currently at index `i`.

### Step 1: Choose a new column order
Choose your required permutation of column indexes.

For example, if you want to move the last column to the front of a 3-column sheet, set the order to `[1, 2, 0]` instead of `[0, 1, 2]`. This moves the column at index 0 to position 1, the column at index 1 to position 2, and the column at index 2 to position 0:

```js
// a HyperFormula instance with example data
const hfInstance = HyperFormula.buildFromArray([
 ['A', 'B', 'C']
]);

// we'll set the column order to [1, 2, 0] in the next steps
// the resulting sheet will be: [['C', 'A', 'B']]
```

::: tip
The [`setColumnOrder`](../api/classes/hyperformula.md#setcolumnorder) method accepts an array of numbers, so you can implement any function that returns an array with your required column order.
:::

::: warning
The permutation array maps **current positions** to **new positions**, not the other way around. The value at index `i` tells HyperFormula where to move the column currently at index `i`, *not* which column should end up at index `i`.
:::

### Step 2: Check if the new column order can be applied

Before you change the column order, check if your specified column number permutation can actually be applied.

Thanks to the [`isItPossibleTo*` methods](basic-operations.md#isitpossibleto-methods), you can check if an operation is allowed, and display an error message if it's not.

Use the [`isItPossibleToSetColumnOrder`](../api/classes/hyperformula.md#isitpossibletosetcolumnorder) method:

```js
const hfInstance = HyperFormula.buildFromArray([
 ['A', 'B', 'C']
]);

// a variable to carry the user message
let messageUsedInUI;

// check if your permutation can be applied
const isColumnOrderOk = hfInstance.isItPossibleToSetColumnOrder(0, [1, 2, 0]);

// display an error message
if (!isColumnOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort columns in this way.'
}
```

### Step 3: Set the new column order

If your specified column number permutation is valid, change the column order:

```js
const hfInstance = HyperFormula.buildFromArray([
 ['A', 'B', 'C']
]);

let messageUsedInUI;

const isColumnOrderOk = hfInstance.isItPossibleToSetColumnOrder(0, [1, 2, 0]);

if (!isColumnOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort columns in this way.'
} else {
  // set the new column order
  hfInstance.setColumnOrder(0, [1, 2, 0]);
}
// the resulting sheet is: [['C', 'A', 'B']]

// the method returns an array of cells whose values changed:
// [{
//   address: { sheet: 0, col: 1, row: 0 },
//   newValue: 'A',
// },
// {
//   address: { sheet: 0, col: 2, row: 0 },
//   newValue: 'B',
// },
// {
//   address: { sheet: 0, col: 0, row: 0 },
//   newValue: 'C',
// }]
```

## Data sorting demo

The demo below shows how to sort rows in ascending and descending order, based on the results (calculated values) of the cells in the second column.

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/sorting-data/example1.html)

@[code](@/docs/examples/sorting-data/example1.css)

@[code](@/docs/examples/sorting-data/example1.js)

@[code](@/docs/examples/sorting-data/example1.ts)

:::
