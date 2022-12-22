# Named expressions

An expression can be assigned a human-friendly name.
Thanks to this you can refer to that name anywhere across the workbook.
Names are especially useful when you use some references repeatedly.
In this case, names simplify the formulas and reduce the risk of making
a mistake. Such a worksheet is also easier to maintain.

You can name a formula, string, number, or any other type of data.

By default, references in named expressions are absolute. Most people use
absolute references in spreadsheet software like Excel without even
knowing about it. Very few know that references can be relative too.
Unfortunately, HyperFormula doesn't support relative references inside
named expressions at the moment.

Dynamic ranges are supported through functions such as INDEX and OFFSET.

Named ranges can overlap each other, e.g. it is possible to define
the names as follows:

* rangeOne: A1:D10
* rangeTwo: A1:E1

## Examples

| Type | Custom name | Example expression |
| :--- | :--- | :--- |
| Named cell | myCell | =A1 |
| Named range of cells | myRange | =A1:D10 |
| Named constant (number) | myNumber | =10 |
| Named constant (string) | myText | ="One Small Step for Man" |
| Named formula | myFormula | =SUM(A1:D10) |

## Naming convention

* The name has to **be unique within the scope**; if you set
'MyPotato' globally (meaning you do not define any scope) it has
to be unique globally. However, you can still define 'MyPotato'
again in the local scope of a sheet.

```javascript
// define for a global scope
hfInstance.addNamedExpression('MyPotato', '=SUM(100+10)');

// define for the local scope of Sheet2 (sheetId = 1), still a valid name
hfInstance.addNamedExpression('MyPotato', '=Sheet2!$A$1+100', 1);
```

* The name starts with a letter or an underscore. The minimum required
length of a name is based on the `maxColumns`value inside
[configuration object](configuration-options.md).
* The name must not equal a cell reference, e.g. A1, $A$1, R1C1; a separate “1” or “A” is also invalid.
* The name is case-insensitive.
* A space character is not allowed.
* The maximum number of characters is 255.

**Examples of correct and incorrect names:**

| Name | Validity |
| :--- | :--- |
| myRevenue | Correct |
| quarter_1 | Correct |
| _1stQuarter | Correct |
| my Revenue | Incorrect |
| 1stQuarter | Incorrect |
| A1 | Incorrect |
| R1C1 | Incorrect |
| !A$1:D10 | Incorrect |

## Available methods

These are the basic methods that can be used to add and manipulate
named expressions, including the creation and handling of
named ranges. The full list of methods is available in the
[API reference](../api).

### Adding a named expression

You can add a named expression by using the `addNamedExpression`
method. It accepts name for the expression, the expression as a
raw cell content, and optionally the scope. If you do not define
the scope it will be set to global, meaning the expression name
will be valid for the whole workbook. If you want to add many of them, it is
advised to do so in a [batch](batch-operations.md). This method
returns a list of cells whose values were affected by this operation, their absolute addresses, and new values. See the "changes"
section in [basic operations](basic-operations) for more info.

```javascript
// add 'prettyName' expression to the local scope of 'Sheet1' (sheetId = 0)
const changes = hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 0);
```

### Changing a named expression

You can change a named expression by using the `changeNamedExpression`
method. Select the name of an expression to change and pass it as
the first parameter,  then define the new expression as raw cell
content and optionally add the scope. If you do not define the scope
it will be set to global, meaning the expression will be vaild for the whole workbook. If you want to change many of them, it is advised
to do so in a [batch](batch-operations.md). This method returns
a list of cells whose values were affected by this operation, their absolute addresses, and new values. See the "changes"
section in [basic operations](basic-operations) for more info.

```javascript
// change the named expression
const changes = hfInstance.changeNamedExpression('prettyName', '=Sheet1!$A$1+200');
```

### Removing a named expression

You can remove a named expression by using the `removeNamedExpression`
method. Select the name of an expression to remove and pass it as
the first parameter and optionally define the scope. If you do
not define the scope it will be understood as global, meaning,
the whole workbook. This method returns a list of cells whose values
were affected by this operation, their absolute addresses, and new values.
See the changes section in
[basic operations](basic-operations) for more info.

```javascript
// remove 'prettyName' expression from 'Sheet1' (sheetId=0)
const changes = hfInstance.removeNamedExpression('prettyName', 0);
```

### Listing all named expressions

You can retrieve a whole list of named expressions by
using the `listNamedExpressions` method. It requires no
parameters and returns all named expressions as an array of strings.

```javascript
// get all named expression names
const listOfExpressions = hfInstance.listNamedExpressions();
```

## Handling errors

Operations on named expressions throw errors when something goes
wrong. These errors can be handled to provide a good user experience
in the application. Be sure to check the
[basic operations](basic-operations) section to read about
error handling. It is also possible to check the availability of operations using `isItPossibleTo*` methods, which are also described in [that section](basic-operations#isitpossibleto-methods).

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.3.x/named-expressions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: named-expressions"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
