# Batch operations

HyperFormula offers a built-in feature for doing batch operations.
This allows you to put multiple CRUD and move operations into a
single operation.

In some cases, batch operations can result in better performance,
especially when your app requires to do a large number of operations.

## How to batch

### Using the `batch` method

You can use the `batch` method to batch operations. This method accepts
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
  ...
});
```

### Using the `suspendEvaluation` and `resumeEvaluation` methods

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
hfInstance.setSheetContent('MySheet2', [['50'], ['60']]);

// resume the evaluation
const changes = hfInstance.resumeEvaluation();
```

When you have performed the operations you wanted to, you can resume
evaluation by calling the `resumeEvaluation` method which will trigger
recalculation. Just like with the `batch` method, it returns a list of
cells whose values changed after the operation, their absolute addresses,
and new values. `resumeEvaluation` will also trigger the calculation.

You can resume the evaluation by calling the `resumeEvaluation` method
which triggers the recalculation. Just like in the case of the `batch`
method, it returns a list of cells which values changed after the
operation, together with their absolute addresses, and new values.

### Adjusting need with the `isEvaluationSuspended` method

Each time you need to check if the evaluation is suspended you can
call the `isEvaluationSuspended` method.

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

You can use `batch` anytime you want to stack several operations into
one. However, if you want to see the most amazing benefits of this
feature, use `batch` when there are a lot of heavy operations.
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
operations. In this case, you should consider using them to achieve
better performance in the application you develop; it will result
in faster calculation across the whole HyperFormula instance.

Batching can also be useful when you decide to use HyperFormula
on the [server-side](server-side-installation). Several operations
might be sent as a single one.

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/0.1.0/batch-operations?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: batch-operations"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
