# Batch operations

HyperFormula offers a built-in feature for doing batch operations.
It allows you to combine multiple data modification actions into a single operation.

In some cases, batch operations can result in better performance,
especially when your app requires doing a large number of operations.

## How to batch

### Using the [`batch`](../api/classes/hyperformula.md#batch) method

You can use the [`batch`](../api/classes/hyperformula.md#batch) method to batch operations. This method accepts
just one parameter: a callback function that stacks the selected
operations into one. It performs the cumulative operation at the end.

This method returns a list of cells whose values were affected by this
operation together with their absolute addresses and new values.

```javascript
const hfInstance = HyperFormula.buildFromSheets({
  MySheet1: [ ['1'] ],
  MySheet2: [ ['10'] ],
});

// multiple operations in a single callback will trigger evaluation only once
// and only one set of changes will be returned as a combined result of all
// the operations that were triggered within the callback
const changes = hfInstance.batch(() => {
  hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=B1']]);
  hfInstance.setCellContents({ col: 4, row: 0, sheet: 0 }, [['=A1']]);
  
  // and numerous others
});
```

### Using the [`suspendEvaluation`](../api/classes/hyperformula.md#suspendevaluation) and [`resumeEvaluation`](../api/classes/hyperformula.md#resumeevaluation) methods

The same result can be achieved by suspending and resuming the
evaluation.

To do that you need to explicitly suspend the evaluation, then do the
operations one by one, and then resume the evaluation.

This method returns a list of cells which values were affected by the
operation together with their absolute addresses and new values.

```javascript
const hfInstance = HyperFormula.buildFromSheets({
  MySheet1: [ ['1'] ],
  MySheet2: [ ['10'] ],
});

// suspend the evaluation
hfInstance.suspendEvaluation();

// perform operations
hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=B1']]);
hfInstance.setSheetContent(1, [['50'], ['60']]);

// resume the evaluation
const changes = hfInstance.resumeEvaluation();
```

You can resume the evaluation by calling the [`resumeEvaluation`](../api/classes/hyperformula.md#resumeevaluation) method
which triggers the recalculation. Just like in the case of the [`batch`](../api/classes/hyperformula.md#batch)
method, it returns a list of cells which values changed after the
operation, together with their absolute addresses, and new values.

### Checking the evaluation suspension state

When you need to check if the evaluation is suspended you can
call the [`isEvaluationSuspended`](../api/classes/hyperformula.md#isevaluationsuspended) method.

```javascript
const hfInstance = HyperFormula.buildEmpty();

// suspend the evaluation
hfInstance.suspendEvaluation();

// check if the evaluation is suspended
// this method returns a simple boolean value
const isEvaluationSuspended = hfInstance.isEvaluationSuspended();

// resume evaluation if needed
hfInstance.resumeEvaluation();
```

## When to batch

You can batch operations anytime you want to stack several actions into
one. However, if you want to see the most amazing benefits of this
feature, use batch operations when there are a lot of heavy methods.
This will result in better performance. The best candidates to
batch in this situation are the following methods:

* `clearSheet`
* `setSheetContent`
* `setCellContents`
* `addNamedExpression`
* `changeNamedExpression`
* `removeNamedExpression`

These operations have an impact on calculation results and may affect
the performance.

Batching can be useful when there is a need for multiple memory-consuming
operations. In this case, you should consider using it to achieve
better performance in the application you develop; it will result
in faster calculation across the whole HyperFormula instance.

Batching can also be useful when you decide to use HyperFormula
on the [server-side](server-side-installation). Several operations
can be sent as a single one.

## What you can't batch

You can't batch read operations.

Methods such as [`getCellValue`](../api/classes/hyperformula.md#getcellvalue), [`getSheetSerialized`](../api/classes/hyperformula.md#getsheetserialized), or [`getFillRangeData`](../api/classes/hyperformula.md#getfillrangedata) will result in an error when called inside a [batch callback](#using-the-batch-method) or when the evaluation is [suspended](#using-the-suspendevaluation-and-resumeevaluation-methods).

The [paste](../api/classes/hyperformula.md#paste) method also can't be called when batching as it reads the contents of the copied cells.

## Demo

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/docs/examples/batch-operations/example1.html)

@[code](@/docs/examples/batch-operations/example1.css)

@[code](@/docs/examples/batch-operations/example1.js)

@[code](@/docs/examples/batch-operations/example1.ts)

:::
