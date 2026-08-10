# RemoveRowsUndoEntry

## Constructors

### constructor 

\+ **new RemoveRowsUndoEntry**(`command`: [RemoveRowsCommand](removerowscommand.md), `rowsRemovals`: [RowsRemoval](../interfaces/rowsremoval.md)[]): *[RemoveRowsUndoEntry](removerowsundoentry.md)*

*Defined in [src/UndoRedo.ts:47](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`command` | [RemoveRowsCommand](removerowscommand.md) |
`rowsRemovals` | [RowsRemoval](../interfaces/rowsremoval.md)[] |

**Returns:** *[RemoveRowsUndoEntry](removerowsundoentry.md)*

## Properties

### command

• **command**: *[RemoveRowsCommand](removerowscommand.md)*

*Defined in [src/UndoRedo.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L49)*

___

### rowsRemovals

• **rowsRemovals**: *[RowsRemoval](../interfaces/rowsremoval.md)[]*

*Defined in [src/UndoRedo.ts:50](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L50)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:59](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:55](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:63](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L63)*

**Returns:** *number[]*