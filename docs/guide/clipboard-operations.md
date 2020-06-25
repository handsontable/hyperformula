# Clipboard operations

HyperFormula supports clipboard operations such as **copy, cut,
and paste**. These methods allow you to integrate the functionality
of interacting with the clipboard.

::: tip
Below provided methods store cut or copied data in a reference inside
the memory, not directly in system clipboard.
:::

## Copy

You can copy the content of the cells by using the `copy` method.
This method requires you to pass the arguments as follows:

* The source left corner of a block of cells to be copied
* Width of the block
* Height of the block 

```javascript
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// it copies [ [ 2 ] ]
const clipboardContent = hfInstance.copy({ sheet: 0, col: 1, row: 0 }, 1, 1);
```

Depending on what was copied, the data is stored as:

* an array of arrays,
* a number,
* a string,
* a boolean,
* an empty value.

If a copied source formula contains named expressions which were
defined for a local scope and will be pasted to a sheet which is
out of scope for these expressions, their scope will switch to global.
If a copied named expression's scope is the same as the target's,
the local scope will remain the same.

## Cut

You can cut the content of the cells by using the `cut` method. This
method requires you to pass the arguments as follows:

* The source left corner of a block of cells to be copied
* Width of the block
* Height of the block

**Any CRUD operation called after this method will abort the cut**
operation.

```javascript
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// return the values that were cut: [ [ 1 ] ]
const clipboardContent = hfInstance.cut({ sheet: 0, col: 0, row: 0 }, 1, 1);
```

## Paste

You can paste the content of the cells by using the `paste` method.
This method requires only one parameter - the target left corner
into the content will be pasted.

If the `paste` method is called after the `copy` , it will paste
copied values and formulas into a block of cells. If it is called
after `cut` , it will perform the `moveCells` operation into the
block of cells. The `paste` method does nothing if the clipboard
is empty.

The `paste` method triggers the recalculation for the formulas
affected by this operation. When it is called after `cut`, it
will remove the content that was cut. This may have an impact
on many related cells in the workbook.

```javascript
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// do a copy; [ [ 2 ] ] was copied
hfInstance.copy({ sheet: 0, col: 0, row: 0 }, 1, 1);

// do a paste; should return a list of cells whose values changed
// after the operation, their absolute addresses, and new values
const changes = hfInstance.paste({ sheet: 0, col: 1, row: 0 });
```

**Cut and paste** behave similarly to the `move` operation so if in
the cell B1 there is a formula '=A1' it will stay '=A1' after being
placed into B2.

**Copy and paste** behave a bit differently. If '=A1' will be copied
from B1 into B2 cell it will become '=A2'.

## Clear the clipboard

You can clear the clipboard on demand by using the `clearClipboard`
method. There is also a method for checking if there is any content
inside the clipboard: `isClipboardEmpty` .

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/0.1.0/clipboard-operations?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: clipboard-operations"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
