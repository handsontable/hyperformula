---
tags:
  - defined names
  - global scope
  - variables
  - named constants
  - named columns
  - structured references
  - addNamedExpression
  - changeNamedExpression
  - removeNamedExpression
  - listNamedExpressions
---

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
| Name1       | Invalid  |
| RC          | Invalid  |

## Using named expressions in formulas

Named expressions can be used in any formula by referencing their names. Use them anywhere you would normally use a cell reference, range, or constant value.

```javascript
// Define named expressions
hfInstance.addNamedExpression('TaxRate', '=0.08');
hfInstance.addNamedExpression('SalesData', '=Sheet1!$A$1:$A$10');

// Use them in formulas
hfInstance.setCellContents({sheet: 0, col: 2, row: 0}, [['=SUM(SalesData)']]);
hfInstance.setCellContents({sheet: 0, col: 2, row: 1}, [['=SUM(SalesData) * TaxRate']]);
```

## Using named ranges in formulas

A named expression that resolves to a range of cells behaves differently depending on where it is used:

- **As a function argument** — it works as expected. `=SUM(myRange)`, `=COUNT(myRange)`, and `=INDEX(myRange, 1, 1)` all operate on the full range.
- **As an operand of an operator** — the range is reduced to a single cell before the operation. In `=myRange + 1`, only the cell of the range that shares the formula's row (for a vertical range) or column (for a horizontal range) is used. If the formula's row or column falls outside the range, or the range is two-dimensional, the result is a `#VALUE!` error.
- **As a bare reference** — `=myRange` on its own returns a `#VALUE!` error; a range cannot be placed directly into a single cell.

In the default mode the range is reduced before the operator runs, so `=SUM(myRange + 1)` adds 1 to that single reduced value rather than to every element (for a formula in row 1 of a vertical range, the result is `SUM(A1 + 1)`).

When array arithmetic is enabled (`useArrayArithmetic: true`), named ranges still work as function arguments and aggregate correctly, but as an operand they behave differently from the default mode:

- A bare `=myRange + 1` does not spill — it returns a `#VALUE!` error rather than producing one result per element.
- Inside an aggregate the operator becomes element-wise. `=SUM(myRange + 1)` adds 1 to every element and then sums, so for `myRange` covering values `1..5` it returns `20` (`SUM(2, 3, 4, 5, 6)`), not the single reduced value of the default mode.

## Named columns

HyperFormula does not support Excel-style structured references such as `Table[Column]`, and it does not treat column headers as formula addresses. A formula like `=SUM(Name1:Name5)` is not a reference to columns named Name1 and Name5.

Two separate problems often get stacked in that example:

1. **Illegal name.** `Name1` matches A1 notation (column NAME, row 1), so it cannot be registered as a named expression. Use `ColSales` or `Name_1` instead. See [Naming rules](#naming-rules).
2. **Range operator.** `:` does not accept named expressions as endpoints. Even with legal names, `Name_1:Name_5` is a parse error. See [Range restraints](cell-references.md#range-restraints).

To address a column by name, register a named expression that points at the column (or at the data range), then use that name in the formula:

```javascript
hfInstance.addNamedExpression('ColSales', '=Sheet1!$A:$A');
hfInstance.setCellContents({ sheet: 0, col: 2, row: 0 }, [['=SUM(ColSales)']]);
```

- The address inside the named expression must be **absolute** (`$A:$A` or `Sheet1!$A:$A`). Relative `A:A` is not allowed.
- If row 1 is a header, `$A:$A` includes it. For data only, use `$A$2:$A`.
- Do not put header text in the formula. Map each header to a named expression in application code.

## Available methods

These are the basic methods that can be used to add and manipulate named
expressions, including the creation and handling of named ranges. The full list
of methods is available in the [API reference](../api).

### Adding a named expression

You can add a named expression in two ways:

**During engine initialization**: You can provide named expressions as a parameter when creating a HyperFormula instance using the factory methods `buildEmpty`, `buildFromArray`, or `buildFromSheets`. This is the most efficient way to add multiple named expressions at once.

```javascript
// Define named expressions during initialization
const namedExpressions = [
  {
    name: 'prettyName',
    expression: '=Sheet1!$A$1+100',
    scope: 0 // optional: local scope for 'Sheet1'
  },
  {
    name: 'globalConstant', 
    expression: '=42'
    // no scope specified = global scope
  }
];

// Create engine with named expressions
const hfInstance = HyperFormula.buildEmpty({}, namedExpressions);
// or
const hfInstance = HyperFormula.buildFromArray(sheetData, {}, namedExpressions);
// or  
const hfInstance = HyperFormula.buildFromSheets(sheetsData, {}, namedExpressions);
```

**After engine creation**: You can add a named expression by using the `addNamedExpression` method. It accepts name for the expression, the expression as a raw cell content, and optionally the scope. If you do not define the scope it will be set to global, meaning the expression name will be valid for the whole workbook. If you want to add many of them, it is advised to do so in a [batch](batch-operations.md). This method returns [an array of changed cells](basic-operations.md#changes-array).

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
