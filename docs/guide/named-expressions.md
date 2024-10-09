# Named expressions

An expression can be assigned a human-friendly name. Thanks to this you can
refer to that name anywhere across the workbook. Names are especially useful
when you use some references repeatedly. In this case, names simplify the
formulas and reduce the risk of making a mistake. Such a worksheet is also
easier to maintain.

You can name a formula, string, number, or any other type of data.

By default, references in named expressions are absolute. Most people use
absolute references in spreadsheet software like Excel without even knowing
about it. Very few know that references can be relative too. Unfortunately,
HyperFormula doesn't support relative references inside named expressions at the
moment.

Dynamic ranges are supported through functions such as INDEX and OFFSET.

Named ranges can overlap each other, e.g., it is possible to define the names as
follows:

- rangeOne: Sheet1!$A$1:$D$10
- rangeTwo: Sheet1!$A$1:$E$1

## Examples

| Type                    | Custom name | Example expression        |
|:------------------------|:------------|:--------------------------|
| Named cell              | myCell      | =Sheet1!$A$1              |
| Named range of cells    | myRange     | =Sheet1!$A$1:$D$10        |
| Named constant (number) | myNumber    | =10                       |
| Named constant (string) | myText      | ="One Small Step for Man" |
| Named formula           | myFormula   | =SUM(Sheet1!$A$1:$D$10)   |

## Naming rules

Expression names are case-insensitive, and they:

- Must start with a Unicode letter or with an underscore (`_`).
- Can contain only Unicode letters, numbers, underscores, and periods (`.`).
- Can't be the same as any possible reference in the A1 notation (for example,
  `Q4` or `YEAR2023`).
- Can't be the same as any possible reference in the R1C1 notation (for example,
  `R4C5`, `RC` or `R0C`).
- Must be unique within a given scope.

::: tip
Expression names must be unique within a given scope, but you can override a
global named-expression with a local one. For example:

```javascript
// `MyRevenue` has to be unique within the global scope
hfInstance.addNamedExpression('MyRevenue', '=SUM(100+10)');

// but you can still use `MyRevenue` within the local scope of Sheet2 (sheetId = 1)
hfInstance.addNamedExpression('MyRevenue', '=Sheet2!$A$1+100', 1);
```
:::

For examples of valid and invalid expression names, see the following table:

| Name        | Validity |
|:------------|:---------|
| my Revenue  | Invalid  |
| myRevenue   | Valid    |
| quarter1    | Invalid  |
| quarter_1   | Valid    |
| 1stQuarter  | Invalid  |
| _1stQuarter | Valid    |
| .NET        | Invalid  |
| ASP.NET     | Valid    |
| A1          | Invalid  |
| $A$1        | Invalid  |
| RC          | Invalid  |

## Available methods

These are the basic methods that can be used to add and manipulate named
expressions, including the creation and handling of named ranges. The full list
of methods is available in the [API reference](../api).

### Adding a named expression

You can add a named expression by using the `addNamedExpression` method. It
accepts name for the expression, the expression as a raw cell content, and
optionally the scope. If you do not define the scope it will be set to global,
meaning the expression name will be valid for the whole workbook. If you want to
add many of them, it is advised to do so in a [batch](batch-operations.md).
This method returns [an array of changed cells](basic-operations.md#changes-array).

```javascript
// add 'prettyName' expression to the local scope of 'Sheet1' (sheetId = 0)
const changes = hfInstance.addNamedExpression(
  'prettyName',
  '=Sheet1!$A$1+100',
  0
);
```

### Changing a named expression

You can change a named expression by using the `changeNamedExpression` method.
Select the name of an expression to change and pass it as the first parameter,
then define the new expression as raw cell content and optionally add the scope.
If you do not define the scope it will be set to global, meaning the expression
will be valid for the whole workbook. If you want to change many of them, it is
advised to do so in a [batch](batch-operations.md).
This method returns [an array of changed cells](basic-operations.md#changes-array).

```javascript
// change the named expression
const changes = hfInstance.changeNamedExpression(
  'prettyName',
  '=Sheet1!$A$1+200'
);
```

### Removing a named expression

You can remove a named expression by using the `removeNamedExpression` method.
Select the name of an expression to remove and pass it as the first parameter
and optionally define the scope. If you do not define the scope it will be
understood as global, meaning, the whole workbook.
This method returns [an array of changed cells](basic-operations.md#changes-array).

```javascript
// remove 'prettyName' expression from 'Sheet1' (sheetId=0)
const changes = hfInstance.removeNamedExpression('prettyName', 0);
```

### Listing all named expressions

You can retrieve a whole list of named expressions by using the
`listNamedExpressions` method. It requires no parameters and returns all named
expressions as an array of strings.

```javascript
// get all named-expression names
const listOfExpressions = hfInstance.listNamedExpressions();
```

## Handling errors

Operations on named expressions throw errors when something goes wrong. These
errors can be [handled](basic-operations.md#handling-an-error) to provide a good
user experience in the application. It is also possible to check the
availability of operations using `isItPossibleTo*` methods, which are also
described in [that section](basic-operations.md#isitpossibleto-methods).

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/named-expressions/example1.html)

@[code](@/docs/examples/named-expressions/example1.css)

@[code](@/docs/examples/named-expressions/example1.js)

@[code](@/docs/examples/named-expressions/example1.ts)

:::
