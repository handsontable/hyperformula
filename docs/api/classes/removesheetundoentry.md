# RemoveSheetUndoEntry

## Constructors

### constructor 

\+ **new RemoveSheetUndoEntry**(`sheetName`: string, `sheetId`: number, `oldSheetContent`: [ClipboardCell](../globals.md#clipboardcell)[][], `scopedNamedExpressions`: [[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)][]): *[RemoveSheetUndoEntry](removesheetundoentry.md)*

*Defined in [src/UndoRedo.ts:276](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L276)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetName` | string |
`sheetId` | number |
`oldSheetContent` | [ClipboardCell](../globals.md#clipboardcell)[][] |
`scopedNamedExpressions` | [[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)][] |

**Returns:** *[RemoveSheetUndoEntry](removesheetundoentry.md)*

## Properties

### oldSheetContent

• **oldSheetContent**: *[ClipboardCell](../globals.md#clipboardcell)[][]*

*Defined in [src/UndoRedo.ts:280](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L280)*

___

### scopedNamedExpressions

• **scopedNamedExpressions**: *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/UndoRedo.ts:281](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L281)*

___

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:279](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L279)*

___

### sheetName

• **sheetName**: *string*

*Defined in [src/UndoRedo.ts:278](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L278)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:290](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L290)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:286](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L42)*

Returns LazilyTransformingAstService version keys referenced by this entry's oldData.
Default implementation returns empty — override in entries that store oldData.

**Returns:** *number[]*