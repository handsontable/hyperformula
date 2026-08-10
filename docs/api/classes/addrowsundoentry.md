# AddRowsUndoEntry

## Constructors

### constructor 

\+ **new AddRowsUndoEntry**(`command`: [AddRowsCommand](addrowscommand.md)): *[AddRowsUndoEntry](addrowsundoentry.md)*

*Defined in [src/UndoRedo.ts:94](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`command` | [AddRowsCommand](addrowscommand.md) |

**Returns:** *[AddRowsUndoEntry](addrowsundoentry.md)*

## Properties

### command

• **command**: *[AddRowsCommand](addrowscommand.md)*

*Defined in [src/UndoRedo.ts:96](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L96)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:105](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:101](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L101)*

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