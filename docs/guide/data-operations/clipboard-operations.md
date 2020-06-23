# Clipboard operations

HyperFormula supports clipboard operations such as **copy, cut, and paste**. These methods allow you to integrate the functionality of copy and paste with clipboard inside the operating system. The internal HyperFormula clipboard carries all crucial information to be used along with the native clipboard and still enables spreadsheet-like updates of references. The HyperFormula clipboard **will not interfere with the system clipboard if you do not explicitly make it do so**. All applications around the market integrates with the clipboard up do their needs and HyperFormula also allows to customize this functionality as well

HyperFormula supports clipboard operations such as **copy, cut, and paste**. These methods allow you to integrate the functionality of interacting with the clipboard.

{% hint style="success" %}
The methods below store copied or cut data in a reference inside the memory, not directly in the system clipboard.
{% endhint %}

{% hint style="success" %}
Below methods store cut or copied data in a reference inside the memory, not directly in system clipboard.
{% endhint %}

The clipboard enables spreadsheet-like updates of references inside formulas. 

HyperFormula clipboard **doesn't automatically save the data in the operating system's clipboard.** It exposes methods that allow a developer to do that.

### **Copy**

You can copy cell content by using the `copy` method. This method requires you to pass the source left corner of a block you want to copy, along with the width and height of the block as the second and third parameters, respectively.

You can copy the content of the cells by using the `copy` method. This method requires you to pass the arguments as follows: 

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

Copied data will be stored as an array of arrays of number, string, boolean, or empty value, depending on what was copied.

Copied data will be stored as an array of arrays of  number or string or boolean or empty value, depending on what was copied.

Depending on what was copied, the data is stored as:

* an array of arrays,
* a number,
* a string,
* a boolean,
* an empty value.

If a copied source formula contains named expressions which were defined for a local scope and will be pasted to a sheet which is out of scope for these expressions, their scope will switch to global. If a copied named expression's scope is the same as the target's, the local scope will remain the same.

If a copied source formula contains named expressions that were defined for a local scope and will be pasted to a sheet which is out of scope for these expressions, then these expressions' scope will switch to global. If a copied named expression's scope is the same as the target's then the local scope will remain the same.

### **Cut**

You can cut cell content by using the `cut` method. This method requires you to pass the source left corner of a block you want to cut, along with the width and height of the block as the second and third parameters, respetively.  **Any CRUD operation called after this method will abort the cut operation**. This method returns the values of the cells for use in the external clipboard.

You can cut the content of the cells by using the `cut` method. This method requires you to pass the arguments as follows: 

* The source left corner of a block of cells to be copied
* Width of the block
* Height of the block

**Any CRUD operation called after this method will abort the cut** operation.

```javascript
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// return the values that were cut: [ [ 1 ] ]
const clipboardContent = hfInstance.cut({ sheet: 0, col: 0, row: 0 }, 1, 1);
```

### Paste

You can paste cell content by using `paste` method. This method requires only one parameter: the target left corner in which the content will be pasted. When called after `copy`, it will paste copied values and formulas into a cell block. When called after `cut`, it will perform the `moveCells` operation into the cell block. It does nothing if the clipboard is empty. 

You can paste the content of the cells by using the `paste` method. This method requires only one parameter - the target left corner into the content will be pasted. 

If the `paste` method is called after the `copy` , it will paste copied values and formulas into a block of cells. If it is called after `cut` , it will perform the `moveCells` operation into the block of cells. The `paste` method does nothing if the clipboard is empty.

Paste will also trigger the recalculation of the formulas affected and when called after cut it will remove the content that was cut, which may have an impact on additional cells and formulas related to the change.

The `paste` method triggers the recalculation for the formulas affected by this operation. When it is called after `cut`, it will remove the content that was cut. This may have an impact on many related cells in the workbook.

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

```javascript
const hfInstance = HyperFormula.buildFromArray([
 ['1', '2'],
]);

// do a copy -> [ [ 2 ] ] was copied
hfInstance.copy({ sheet: 0, col: 0, row: 0 }, 1, 1);

// do a paste -> should return a list of cells which values changed
// after the operation, their absolute addresses and new values
const changes = hfInstance.paste({ sheet: 0, col: 1, row: 0 });
```

**Cut and paste** will behave similarly to the move operation, so if in cell B1 there is a formula '=A1' it will stay '=A1' after being placed into B2. 

**Cut and paste** behave similarly to the `move` operation so if in the cell B1 there is a formula '=A1' it will stay '=A1' after being placed into B2. 

**Copy and paste** will behave in a relative manner: if '=A1' is copied from B1 into B2, it will become '=A2'.

**Copy and paste** behave a bit differently. If '=A1' will be copied from B1 into B2 cell it will become '=A2'.

### Clear the clipboard

You can force-clear the clipboard on demand by using the `clearClipboard` method. There is also a method for checking if there is any content inside the clipboard: `isClipboardEmpty` returns `false` when something was cut or copied and `true` otherwise.

You can clear the clipboard on demand by using the `clearClipboard` method. There is also a method for checking if there is any content inside the clipboard: `isClipboardEmpty` .

### Demo

Here is a short example of how copy and paste works. You can try it yourself: 

Here is a short example on how copy and paste works. You can try it yourself: 

<iframe
   src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/develop/clipboard-operations?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview"
   style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
   title="handsontable/hyperformula-demos: basic-usage"
   allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
   sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>



```javascript
// sheet data
const sheetData = {
 'Sheet1': [
   ['Greg', 'Black', '=CONCATENATE(A1 + " " + B1)'],
   ['Anne', 'Carpenter', '=CONCATENATE(A2 + " " + B2)'],
   ['Chris', 'Aklips', '=CONCATENATE(A3 + " " + B3)'],
  ],
};

// build from sheets
const hfInstance = HyperFormula.buildFromSheets(sheetData);

// get cell content of the range of the first two rows
const copiedData = hfInstance.copy({ sheet: 0, col: 0, row: 0 }, 3, 2);

// now paste it into the second sheet
const changes = hfInstance.paste({ sheet: 0, col: 0, row: 0 });
```

```javascript
// sheet data
const sheetData = {
 'Sheet1': [
   ['Greg', 'Black', '=CONCATENATE(A1 + " " + B1)'],
   ['Anne', 'Carpenter', '=CONCATENATE(A2 + " " + B2)'],
   ['Chris', 'Aklips', '=CONCATENATE(A3 + " " + B3)'],
  ],
};

// build from sheets
const hfInstance = HyperFormula.buildFromSheets(sheetData);

// get cell content of the range of first two rows
const copiedData = hfInstance.copy({ sheet: 0, col: 0, row: 0 }, 3, 2);

// now paste it into second sheet
const changes = hfInstance.paste({ sheet: 0, col: 0, row: 0 });
```

