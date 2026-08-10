# SetCellContentsUndoEntry

## Constructors

### constructor 

\+ **new SetCellContentsUndoEntry**(`cellContents`: object[]): *[SetCellContentsUndoEntry](setcellcontentsundoentry.md)*

*Defined in [src/UndoRedo.ts:346](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L346)*

**Parameters:**

Name | Type |
------ | ------ |
`cellContents` | object[] |

**Returns:** *[SetCellContentsUndoEntry](setcellcontentsundoentry.md)*

## Properties

### cellContents

• **cellContents**: *object[]*

*Defined in [src/UndoRedo.ts:348](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L348)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:361](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L361)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:357](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L357)*

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