# AddColumnsUndoEntry

## Constructors

### constructor 

\+ **new AddColumnsUndoEntry**(`command`: [AddColumnsCommand](addcolumnscommand.md)): *[AddColumnsUndoEntry](addcolumnsundoentry.md)*

*Defined in [src/UndoRedo.ts:222](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`command` | [AddColumnsCommand](addcolumnscommand.md) |

**Returns:** *[AddColumnsUndoEntry](addcolumnsundoentry.md)*

## Properties

### command

• **command**: *[AddColumnsCommand](addcolumnscommand.md)*

*Defined in [src/UndoRedo.ts:224](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L224)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:233](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L233)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:229](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L229)*

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