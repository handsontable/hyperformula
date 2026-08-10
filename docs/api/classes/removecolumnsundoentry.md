# RemoveColumnsUndoEntry

## Constructors

### constructor 

\+ **new RemoveColumnsUndoEntry**(`command`: [RemoveColumnsCommand](removecolumnscommand.md), `columnsRemovals`: [ColumnsRemoval](../interfaces/columnsremoval.md)[]): *[RemoveColumnsUndoEntry](removecolumnsundoentry.md)*

*Defined in [src/UndoRedo.ts:238](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L238)*

**Parameters:**

Name | Type |
------ | ------ |
`command` | [RemoveColumnsCommand](removecolumnscommand.md) |
`columnsRemovals` | [ColumnsRemoval](../interfaces/columnsremoval.md)[] |

**Returns:** *[RemoveColumnsUndoEntry](removecolumnsundoentry.md)*

## Properties

### columnsRemovals

• **columnsRemovals**: *[ColumnsRemoval](../interfaces/columnsremoval.md)[]*

*Defined in [src/UndoRedo.ts:241](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L241)*

___

### command

• **command**: *[RemoveColumnsCommand](removecolumnscommand.md)*

*Defined in [src/UndoRedo.ts:240](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L240)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:250](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L250)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:246](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L246)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:254](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L254)*

**Returns:** *number[]*