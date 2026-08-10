# ClearSheetUndoEntry

## Constructors

### constructor 

\+ **new ClearSheetUndoEntry**(`sheetId`: number, `oldSheetContent`: [ClipboardCell](../globals.md#clipboardcell)[][]): *[ClearSheetUndoEntry](clearsheetundoentry.md)*

*Defined in [src/UndoRedo.ts:329](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L329)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`oldSheetContent` | [ClipboardCell](../globals.md#clipboardcell)[][] |

**Returns:** *[ClearSheetUndoEntry](clearsheetundoentry.md)*

## Properties

### oldSheetContent

• **oldSheetContent**: *[ClipboardCell](../globals.md#clipboardcell)[][]*

*Defined in [src/UndoRedo.ts:332](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L332)*

___

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:331](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L331)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:341](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L341)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:337](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L337)*

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