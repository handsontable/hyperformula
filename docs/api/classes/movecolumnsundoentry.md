# MoveColumnsUndoEntry

## Constructors

### constructor 

\+ **new MoveColumnsUndoEntry**(`sheet`: number, `startColumn`: number, `numberOfColumns`: number, `targetColumn`: number, `version`: number): *[MoveColumnsUndoEntry](movecolumnsundoentry.md)*

*Defined in [src/UndoRedo.ts:195](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L195)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startColumn` | number |
`numberOfColumns` | number |
`targetColumn` | number |
`version` | number |

**Returns:** *[MoveColumnsUndoEntry](movecolumnsundoentry.md)*

## Properties

### numberOfColumns

• **numberOfColumns**: *number*

*Defined in [src/UndoRedo.ts:200](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L200)*

___

### sheet

• **sheet**: *number*

*Defined in [src/UndoRedo.ts:198](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L198)*

___

### startColumn

• **startColumn**: *number*

*Defined in [src/UndoRedo.ts:199](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L199)*

___

### targetColumn

• **targetColumn**: *number*

*Defined in [src/UndoRedo.ts:201](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L201)*

___

### undoEnd

• **undoEnd**: *number*

*Defined in [src/UndoRedo.ts:195](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L195)*

___

### undoStart

• **undoStart**: *number*

*Defined in [src/UndoRedo.ts:194](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L194)*

___

### version

• **version**: *number*

*Defined in [src/UndoRedo.ts:202](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L202)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:213](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L213)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:209](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L209)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:217](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L217)*

**Returns:** *number[]*