# BaseUndoEntry

## Methods

### doRedo

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:36](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L34)*

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