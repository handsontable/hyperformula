# Clipboard operations

Through a set of dedicated methods, HyperFormula supports clipboard operations, such as copying, cutting,
and pasting. This lets you integrate the functionality
of interacting with the clipboard.

The copied or cut data is stored as a memory reference, not directly in the system clipboard.

## Copy

To copy the contents of a cell or range, use the [`copy()`](../api/classes/hyperformula.md#copy) method. Pass arguments of type [`SimpleCellRange`](../api/interfaces/simplecellrange).

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// copy [ [ 2 ] ]
const clipboardContent = hfInstance.copy({
  start: { sheet: 0, col: 1, row: 0 }, 
  end: { sheet: 0, col: 1, row: 0 },
});
```

## Cut

To cut the contents of a cell or range, use the [`cut()`](../api/classes/hyperformula.md#cut) method. Pass arguments of type [`SimpleCellRange`](../api/interfaces/simplecellrange).

::: tip
Any CRUD operation called after the [`cut()`](../api/classes/hyperformula.md#cut) method aborts the cut operation.
:::

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// returns the values that were cut: [ [ 1 ] ]
const clipboardContent = hfInstance.cut({
  start: { sheet: 0, col: 0, row: 0 },
  end: { sheet: 0, col: 0, row: 0 },
});
```

## Paste

To paste the contents of a cell or range, use the [`paste()`](../api/classes/hyperformula.md#paste) method.

[`paste()`](../api/classes/hyperformula.md#paste) requires only one parameter: the top left corner of the target range.

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// [ [ 2 ] ] was copied
const clipboardContent = hfInstance.copy({
  start: { sheet: 0, col: 1, row: 0 },
  end: { sheet: 0, col: 1, row: 0 },
});

// returns a list of modified cells: their absolute addresses and new values
const changes = hfInstance.paste({ sheet: 0, col: 1, row: 0 });
```

If the clipboard is empty, the [`paste()`](../api/classes/hyperformula.md#paste) method doesn't do anything.

### Copy and paste

When called after [`copy()`](../api/classes/hyperformula.md#copy), the [`paste()`](../api/classes/hyperformula.md#paste) method:
- Pastes the copied data into the target range.
- Triggers a recalculation of all affected formulas.

::: tip
If a formula `=A1` is copied from cell B1 into B2, the B2 formula becomes `=A2`.
:::

### Cut and paste

When called after [`cut()`](../api/classes/hyperformula.md#cut), the [`paste()`](../api/classes/hyperformula.md#paste) method:
- Moves the cut data into the target range, by calling the [`moveCells()`](../api/classes/hyperformula.md#movecells) method.
- Removes the cut data from the source range.
- Triggers a recalculation of all affected formulas.

::: tip
If a formula `=A1` is cut from cell B1 into B2, the B2 formula becomes `=A1`.
:::

#### Pasting named expressions

If a copied or cut formula contains a [named expression](named-expressions.md) defined for a local scope, and the formula is pasted to a sheet that is out of scope for that expression, the expression's scope changes to global.

If the copied or cut named expression's scope is the same as the target's, the expression's local scope remains the same.

## Clear the clipboard

To clear the clipboard, use the [`clearClipboard()`](../api/classes/hyperformula.md#clearclipboard)
method.

To check if the clipboard holds any data, use the [`isClipboardEmpty()`](../api/classes/hyperformula.md#isclipboardempty) method.

## Data storage

The copied or cut data is stored as a memory reference, not directly in the system clipboard.

Depending on what was cut, the data is stored as:
* An array of arrays
* A number
* A string
* A boolean
* An empty value

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/clipboard-operations/example1.html)

@[code](@/docs/examples/clipboard-operations/example1.css)

@[code](@/docs/examples/clipboard-operations/example1.js)

@[code](@/docs/examples/clipboard-operations/example1.ts)

:::