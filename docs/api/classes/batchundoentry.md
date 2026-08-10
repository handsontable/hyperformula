# BatchUndoEntry

## Properties

### operations

• **operations**: *[UndoEntry](../interfaces/undoentry.md)[]* = []

*Defined in [src/UndoRedo.ts:443](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L443)*

## Methods

### add 

▸ **add**(`operation`: [UndoEntry](../interfaces/undoentry.md)): *void*

*Defined in [src/UndoRedo.ts:445](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L445)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [UndoEntry](../interfaces/undoentry.md) |

**Returns:** *void*

___

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:459](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L459)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:455](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L455)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:463](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L463)*

**Returns:** *number[]*

___

### reversedOperations 

▸ **reversedOperations**(): *Generator‹[UndoEntry](../interfaces/undoentry.md), void, unknown›*

*Defined in [src/UndoRedo.ts:449](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L449)*

**Returns:** *Generator‹[UndoEntry](../interfaces/undoentry.md), void, unknown›*