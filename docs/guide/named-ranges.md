# Named ranges

You can give a human-friendly name to a range of adjacent cells. Thanks to this you can refer to that name anywhere across the workbook. Names are especially useful when you use some references repeatedly. In this case, names simplify the formulas and reduce the risk of making a mistake. Such a worksheet is also easier to maintain.

Named ranges can be understood as a specific subset of [named expressions](https://handsontable.github.io/hyperformula/api/classes/hyperformula.html#named-expressions) in HyperFormula.

Named ranges can be used as constants without referring to any range of cells. That means you can name a formula, string, number, or any other type of data.

By default, references in named ranges are absolute. Most people use absolute references in spreadsheet software like Excel, without even knowing about it. Very few know that references can be relative too. Unfortunately, HyperFormula doesn't support relative references at the moment inside named expressions.

Dynamic ranges are supported through functions such as INDEX and OFFSET.

Named ranges can overlap each other, eg. it is possible to define the names as follows: 

* rangeOne: A1:D10
* rangeTwo: A1:E1

**Examples**

| Type | Custom name | Range or constant |
| :--- | :--- | :--- |
| Named cell | myCell | =A1 |
| Named range of cells | myRange | =A1:D10 |
| Named constant \(number\) | myNumber | =10 |
| Named constant \(string\) | myText | ="One Small Step for Man" |
| Named formula | myFormula | =SUM\(A1:D10\) |

**Naming convention**

* The name has to be **unique within the scope**, if you set 'MyPotato' globally \(meaning, you do not define any scope\) it has to be unique globally, however, you still can define 'MyPotato' again in a specific local scope of a sheet.

Check this comparison:

```javascript
// define for a global scope
hfInstance.addNamedExpression('MyPotato', '=SUM(100+10)');

// define for a local scope of Sheet2, still a valid name
hfInstance.addNamedExpression('MyPotato', '=Sheet2!$A$1+100', 'Sheet2');
```

* The name starts with a letter or an underscore. The minimum required length of a name is based on the `maxColumns`value inside [configuration object](configuration-options.md).
* The name must not equal to a cell reference, eg. A1, $A$1, R1C1, separate 1 or A are also not valid
* The name is case-insensitive. 
* A space character is not allowed.
* A maximum number of characters in 255.

An example of correct and incorrect names:

| Name | Validity |
| :--- | :--- |
| myRevenue | Correct |
| quarter\_1 | Correct |
| \_1stQuarter | Correct |
| my Revenue | Incorrect |
| 1stQuarter | Incorrect |
| A1 | Incorrect |
| R1C1 | Incorrect |
| !A$1:D10 | Incorrect |

**Available methods** 

These are the basic methods that can be used to add and manipulate named expressions, including the creation and handling of named ranges. The full list of methods is available in the API reference.

* Adding a named expression

You can add a named expression by using the `addNamedExpression` method. It accepts the name for expression, the expression as a raw cell content, and optionally the scope. If you do not define the scope it will be set to the global one, meaning the expression will be per workbook. If you want to add many of them, it is advised to do so in a [batch](batch-operations.md). This method returns a list of cells which values were affected by this operation their absolute addresses and new values. See the "changes" section of [basic operations](crud-operations.md) for more info.

```javascript
// add 'prettyName' expression to the local scope of 'Sheet1'
const changes = hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 'Sheet1');
```

* Changing a named expression

You can change a named expression by using the `changeNamedExpression` method. Select the name of an expression to change and pass it as the first parameter,  then define the new expression as raw cell content and optionally add the scope. If you do not define the scope it will be set to the global one, meaning the expression will be per workbook. If you want to change many of them, it is advised to do so in a [batch](batch-operations.md). This method returns a list of cells which values were affected by this operation their absolute addresses and new values. See the "changes" section of [basic operations](crud-operations.md) for more info.

```javascript
// change the named expression
const changes = hfInstance.changeNamedExpression('prettyName', '=Sheet1!$A$1+200');
```

* Removing a named expression

You can remove a named expression by using the `removeNamedExpression` method. Select the name of an expression to change and pass it as the first parameter and optionally define the scope. If you do not define the scope it will be understood as a global, meaning, the whole workbook. This method returns a list of cells which values were affected by this operation their absolute addresses and new values. See the changes section of [basic operations](crud-operations.md) for more info.

```javascript
// remove 'prettyName' expression from 'Sheet1'
const changes = hfInstance.removeNamedExpression('prettyName', 'Sheet1');
```

* Listing all named expressions

You can retrieve a whole list of named expressions by using the `listNamedExpressions` method. It requires no parameters and returns all named expressions as an array of strings.

```javascript
// get all named expression names
const listOfExpressions = hfInstance.listNamedExpressions();
```

### Handling errors

Operations on named expressions throw errors when something goes wrong. These errors can be handled to achieve good user experience in the application. Be sure to check the[ basic operations](crud-operations.md) section to read about error handling. There is also a possibility to check the availability of operations with `isItPossibleTo*` methods, they are also described [there](crud-operations.md#isitpossibleto-methods). 

### Demo

<iframe
   src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/develop/named-expressions?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview"
   style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
   title="handsontable/hyperformula-demos: basic-usage"
   allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
   sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>



