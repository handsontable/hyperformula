# AddSheetUndoEntry

## Constructors

### constructor 

\+ **new AddSheetUndoEntry**(`sheetName`: string, `sheetId`: number): *[AddSheetUndoEntry](addsheetundoentry.md)*

*Defined in [src/UndoRedo.ts:259](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L259)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetName` | string |
`sheetId` | number |

**Returns:** *[AddSheetUndoEntry](addsheetundoentry.md)*

## Properties

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:262](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L262)*

___

### sheetName

• **sheetName**: *string*

*Defined in [src/UndoRedo.ts:261](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L261)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:271](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L271)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:267](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L267)*

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