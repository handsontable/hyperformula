# Clipboard operations

HyperFormula supports clipboard operations such as **copy, cut,
and paste**. These methods allow you to integrate the functionality
of interacting with the clipboard.

::: tip
The methods provided below store cut or copied data in a reference inside
the memory, not directly in the system clipboard.
:::

## [Copy](../api/classes/clipboardoperations#copy)

You can copy cell content by using the [copy](../api/classes/clipboardoperations#copy) method, which accepts an argument of type [SimpleCellRange](../api/interfaces/simplecellrange).

```javascript
const hfInstance = HyperFormula.buildFromArray([
  ['1', '2'],
]);

// it copies [ [ 2 ] ]
const clipboardContent = hfInstance.copy({
  start: { sheet: 0, col: 1, row: 0 }, 
  end: { sheet: 0, col: 1, row: 0 },
});
```

Depending on what was copied, the data is stored as:

* an array of arrays
* a number
* a string
* a boolean
* an empty value

If a copied source formula contains named expressions which were
defined for a local scope and it is pasted to a sheet which is
out of scope for these expressions, their scope will switch to global.
If a copied named expression's scope is the same as the target's,
the local scope will remain the same.

## [Cut](../api/classes/clipboardoperations#cut)

You can cut cell content by using the [cut](../api/classes/clipboardoperations#cut) method, which also accepts an argument of type [SimpleCellRange](../api/interfaces/simplecellrange).

**Any CRUD operation called after this method will abort the cut operation.**

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

## [Paste](../api/classes/clipboardoperations#paste)

You can paste cell content by using the [paste](../api/classes/clipboardoperations#paste) method.
This method requires only one parameter - the top left corner of the range, into which the content will be pasted.

If the `paste` method is called after `copy` , it will paste
copied values and formulas into a block of cells. If it is called
after `cut` , it will perform the `moveCells` operation into the
block of cells. The `paste` method does nothing if the clipboard
is empty.

The `paste` method triggers recalculation of the formulas
affected by this operation. When it is called after `cut`, it
will remove the content that was cut. This may have an impact
on many related cells in the workbook.

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

**Cut and paste** behaves similarly to the `move` operation, so if the formula
'=A1' is in cell B1 it will stay '=A1' after being placed into B2.

**Copy and paste** behaves a bit differently. If '=A1' is copied from
cell B1 into B2 it will become '=A2'.

## Clear the clipboard

You can clear the clipboard on demand by using the [clearClipboard](../api/classes/clipboardoperations#clearclipboard)
method. There is also a method for checking if there is any content
inside the clipboard: [isClipboardEmpty](../api/classes/clipboardoperations#isclipboardempty).

## Demo

<iframe src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.0.x/clipboard-operations?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" title="handsontable/hyperformula-demos: clipboard-operations" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
