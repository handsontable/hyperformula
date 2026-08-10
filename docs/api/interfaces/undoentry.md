# UndoEntry

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](../classes/undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:24](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](../classes/undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](../classes/undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:22](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](../classes/undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:30](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L30)*

Returns the LazilyTransformingAstService version keys referenced by this entry's oldData storage.
Used to clean up oldData when the entry is permanently evicted from the undo/redo stack.

**Returns:** *number[]*