# SetRowOrderUndoEntry

## Constructors

### constructor 

\+ **new SetRowOrderUndoEntry**(`sheetId`: number, `rowMapping`: [number, number][], `oldContent`: [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]): *[SetRowOrderUndoEntry](setroworderundoentry.md)*

*Defined in [src/UndoRedo.ts:110](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`rowMapping` | [number, number][] |
`oldContent` | [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][] |

**Returns:** *[SetRowOrderUndoEntry](setroworderundoentry.md)*

## Properties

### oldContent

• **oldContent**: *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/UndoRedo.ts:114](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L114)*

___

### rowMapping

• **rowMapping**: *[number, number][]*

*Defined in [src/UndoRedo.ts:113](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L113)*

___

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:112](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L112)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:123](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L123)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:119](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L119)*

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