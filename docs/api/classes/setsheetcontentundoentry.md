# SetSheetContentUndoEntry

## Constructors

### constructor 

\+ **new SetSheetContentUndoEntry**(`sheetId`: number, `oldSheetContent`: [ClipboardCell](../globals.md#clipboardcell)[][], `newSheetContent`: [RawCellContent](../globals.md#rawcellcontent)[][]): *[SetSheetContentUndoEntry](setsheetcontentundoentry.md)*

*Defined in [src/UndoRedo.ts:146](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`oldSheetContent` | [ClipboardCell](../globals.md#clipboardcell)[][] |
`newSheetContent` | [RawCellContent](../globals.md#rawcellcontent)[][] |

**Returns:** *[SetSheetContentUndoEntry](setsheetcontentundoentry.md)*

## Properties

### newSheetContent

• **newSheetContent**: *[RawCellContent](../globals.md#rawcellcontent)[][]*

*Defined in [src/UndoRedo.ts:150](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L150)*

___

### oldSheetContent

• **oldSheetContent**: *[ClipboardCell](../globals.md#clipboardcell)[][]*

*Defined in [src/UndoRedo.ts:149](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L149)*

___

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:148](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L148)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:159](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L159)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:155](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L155)*

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