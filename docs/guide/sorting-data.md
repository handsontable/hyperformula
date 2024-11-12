# Sorting data

In HyperFormula, you can sort data by reordering rows and columns.

## Sorting data in HyperFormula

To sort data in HyperFormula, you reorder rows (or columns), by providing your preferred permutation of row (or column) indexes.

You can implement any sorting algorithm that returns an array of row or column indexes.

## Sorting rows

To sort rows, use the [`isItPossibleToSetRowOrder`](../api/classes/hyperformula.md#isitpossibletosetroworder) and [`setRowOrder`](../api/classes/hyperformula.md#setroworder) methods.

### Step 1: Choose a new row order
Choose your required permutation of row indexes. 

For example, if you want to swap the first row with the third row, set the order to `[2, 1, 0]` instead of `[0, 1, 2]`:

```js
// a HyperFormula instance with example data
const hfInstance = HyperFormula.buildFromArray([
 [1],
 [2],
 [4, 5],
]);

// we'll set the row order to [2, 1, 0] in the next steps
```

::: tip
The [`setRowOrder`](../api/classes/hyperformula.md#setroworder) method accepts an array of numbers, so you can implement any function that returns an array with your required row order.
:::

### Step 2: Check if the new row order can be applied

Before you change the row order, check if your specified row number permutation can actually be applied.

Thanks to the [`isItPossibleTo*` methods](basic-operations.md#isitpossibleto-methods), you can check if an operation is allowed, and display an error message if it's not.

Use the [`isItPossibleToSetRowOrder`](../api/classes/hyperformula.md#isitpossibletosetroworder) method:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1],
 [2],
 [4, 5],
]);

// a variable to carry the user message
let messageUsedInUI;

// check if your permutation can be applied
const isRowOrderOk = hfInstance.isItPossibleToSetRowOrder(0, [2, 1, 0]);

// display an error message
if (!isRowOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort rows in this way.'
}
```

### Step 3: Set the new row order

If your specified row number permutation is valid, change the row order:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1],
 [2],
 [4, 5],
]);

let messageUsedInUI;

const isRowOrderOk = hfInstance.isItPossibleToSetRowOrder(0, [2, 1, 0]);

if (!isRowOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort rows in this way.'
} else {
  // set the new row order
  setRowOrder(0, [2, 1, 0]);
}
// rows 0 and 2 swap places

// returns:
// [{
//   address: { sheet: 0, col: 0, row: 2 },
//   newValue: 1,
// },
// {
//   address: { sheet: 0, col: 1, row: 2 },
//   newValue: null,
// },
// {
//   address: { sheet: 0, col: 0, row: 0 },
//   newValue: 4,
// },
// {
//   address: { sheet: 0, col: 1, row: 0 },
//   newValue: 5,
// }]
```

## Sorting columns

To sort columns, use the [`isItPossibleToSetColumnOrder`](../api/classes/hyperformula.md#isitpossibletosetcolumnorder) and [`setColumnOrder`](../api/classes/hyperformula.md#setcolumnorder) methods.

### Step 1: Choose a new column order
Choose your required permutation of column indexes.

For example, if you want to swap the first column with the third column, set the order to `[2, 1, 0]` instead of `[0, 1, 2]`:

```js
// a HyperFormula instance with example data
const hfInstance = HyperFormula.buildFromArray([
 [1, 2, 4],
 [5]
]);

// we'll set the column order to [2, 1, 0] in the next steps
```

::: tip
The [`setColumnOrder`](../api/classes/hyperformula.md#setcolumnorder) method accepts an array of numbers, so you can implement any function that returns an array with your required column order.
:::

### Step 2: Check if the new column order can be applied

Before you change the column order, check if your specified column number permutation can actually be applied.

Thanks to the [`isItPossibleTo*` methods](basic-operations.md#isitpossibleto-methods), you can check if an operation is allowed, and display an error message if it's not.

Use the [`isItPossibleToSetColumnOrder`](../api/classes/hyperformula.md#isitpossibletosetcolumnorder) method:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1, 2, 4],
 [5]
]);

// a variable to carry the user message
let messageUsedInUI;

// check if your permutation can be applied
const isColumnOrderOk = hfInstance.isItPossibleToSetColumnOrder(0, [2, 1, 0]);

// display an error message
if (!isColumnOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort columns in this way.'
}
```

### Step 3: Set the new column order

If your specified column number permutation is valid, change the column order:

```js
const hfInstance = HyperFormula.buildFromArray([
 [1, 2, 4],
 [5]
]);

let messageUsedInUI;

const isColumnOrderOk = hfInstance.isItPossibleToSetColumnOrder(0, [2, 1, 0]);

if (!isColumnOrderOk) {
  messageUsedInUI = 'Sorry, you cannot sort columns in this way.'
} else {
  // set the new column order
  setColumnOrder(0, [2, 1, 0]);
}
// columns 0 and 2 swap places

//returns:
// [{
//   address: { sheet: 0, col: 2, row: 0 },
//   newValue: 1,
// },
// {
//   address: { sheet: 0, col: 2, row: 1 },
//   newValue: 5,
// },
// {
//   address: { sheet: 0, col: 0, row: 0 },
//   newValue: 4,
// },
// {
//   address: { sheet: 0, col: 0, row: 1 },
//   newValue: null,
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
