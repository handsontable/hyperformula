# LicenseCapabilityMissingError

Error thrown when a public API method is called for a [FeatureId](../enums/featureid.md) that the current
license entitlement does not grant, or when the license key itself blocks every gated feature
(a missing or invalid key, an expired classic key, or a trial past its grace period); the
message then names the key's state instead. Mirrors gate B's `ErrorMessage.LicenseCapability`, but
this one guards the API surface itself rather than a formula evaluation, so it
is thrown synchronously instead of surfacing as a cell error.

This list names every method that can throw it - `resumeEvaluation` is deliberately NOT among
them: it is the sole exit from a suspended engine, so gating it could strand an instance
permanently if the entitlement changes mid-suspension (see the note on `HyperFormula.
ensureCapability`).

**`see`** [HyperFormula.buildFromArray](hyperformula.md#static-buildfromarray)

**`see`** [HyperFormula.buildFromSheets](hyperformula.md#static-buildfromsheets)

**`see`** [HyperFormula.buildEmpty](hyperformula.md#static-buildempty)

**`see`** [addNamedExpression](namedexpressions.md#addnamedexpression)

**`see`** [changeNamedExpression](hyperformula.md#changenamedexpression)

**`see`** [removeNamedExpression](crudoperations.md#removenamedexpression)

**`see`** [copy](internalnamedexpression.md#copy)

**`see`** [cut](crudoperations.md#cut)

**`see`** [paste](crudoperations.md#paste)

**`see`** [setCellContents](crudoperations.md#setcellcontents)

**`see`** [addRows](arrayvalue.md#addrows)

**`see`** [removeRows](arrayvalue.md#removerows)

**`see`** [addColumns](arrayvalue.md#addcolumns)

**`see`** [removeColumns](arrayvalue.md#removecolumns)

**`see`** [moveCells](crudoperations.md#movecells)

**`see`** [moveRows](crudoperations.md#moverows)

**`see`** [moveColumns](crudoperations.md#movecolumns)

**`see`** [swapRowIndexes](hyperformula.md#swaprowindexes)

**`see`** [setRowOrder](crudoperations.md#setroworder)

**`see`** [swapColumnIndexes](hyperformula.md#swapcolumnindexes)

**`see`** [setColumnOrder](crudoperations.md#setcolumnorder)

**`see`** [addSheet](crudoperations.md#addsheet)

**`see`** [removeSheet](columnbinarysearch.md#removesheet)

**`see`** [clearSheet](crudoperations.md#clearsheet)

**`see`** [setSheetContent](crudoperations.md#setsheetcontent)

**`see`** [renameSheet](crudoperations.md#renamesheet)

**`see`** [undo](crudoperations.md#undo)

**`see`** [redo](crudoperations.md#redo)

**`see`** [batch](hyperformula.md#batch)

**`see`** [suspendEvaluation](hyperformula.md#suspendevaluation)

## Constructors

### constructor 

\+ **new LicenseCapabilityMissingError**(`feature`: [FeatureId](../enums/featureid.md), `blockingState?`: [LicenseKeyValidityState](../enums/licensekeyvaliditystate.md)): *[LicenseCapabilityMissingError](licensecapabilitymissingerror.md)*

*Defined in [src/errors.ts:444](https://github.com/handsontable/hyperformula/blob/99a45ea/src/errors.ts#L444)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`feature` | [FeatureId](../enums/featureid.md) | the gated feature that was called |
`blockingState?` | [LicenseKeyValidityState](../enums/licensekeyvaliditystate.md) | - |

**Returns:** *[LicenseCapabilityMissingError](licensecapabilitymissingerror.md)*

## Properties

### feature

• **feature**: *[FeatureId](../enums/featureid.md)*

*Defined in [src/errors.ts:444](https://github.com/handsontable/hyperformula/blob/99a45ea/src/errors.ts#L444)*

The gated feature the call needed.

___

### message 

• **message**: *string*

___

### name 

• **name**: *string*

___

### stack

• **stack**? : *undefined | string*

___

### Error

▪ **Error**: *ErrorConstructor*