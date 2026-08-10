# MoveRowsUndoEntry

## Constructors

### constructor 

\+ **new MoveRowsUndoEntry**(`sheet`: number, `startRow`: number, `numberOfRows`: number, `targetRow`: number, `version`: number): *[MoveRowsUndoEntry](moverowsundoentry.md)*

*Defined in [src/UndoRedo.ts:166](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L166)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startRow` | number |
`numberOfRows` | number |
`targetRow` | number |
`version` | number |

**Returns:** *[MoveRowsUndoEntry](moverowsundoentry.md)*

## Properties

### numberOfRows

• **numberOfRows**: *number*

*Defined in [src/UndoRedo.ts:171](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L171)*

___

### sheet

• **sheet**: *number*

*Defined in [src/UndoRedo.ts:169](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L169)*

___

### startRow

• **startRow**: *number*

*Defined in [src/UndoRedo.ts:170](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L170)*

___

### targetRow

• **targetRow**: *number*

*Defined in [src/UndoRedo.ts:172](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L172)*

___

### undoEnd

• **undoEnd**: *number*

*Defined in [src/UndoRedo.ts:166](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L166)*

___

### undoStart

• **undoStart**: *number*

*Defined in [src/UndoRedo.ts:165](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L165)*

___

### version

• **version**: *number*

*Defined in [src/UndoRedo.ts:173](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L173)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:184](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L184)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:180](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L180)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:188](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L188)*

**Returns:** *number[]*