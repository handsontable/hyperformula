# SetColumnOrderUndoEntry

## Constructors

### constructor 

\+ **new SetColumnOrderUndoEntry**(`sheetId`: number, `columnMapping`: [number, number][], `oldContent`: [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]): *[SetColumnOrderUndoEntry](setcolumnorderundoentry.md)*

*Defined in [src/UndoRedo.ts:128](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`columnMapping` | [number, number][] |
`oldContent` | [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][] |

**Returns:** *[SetColumnOrderUndoEntry](setcolumnorderundoentry.md)*

## Properties

### columnMapping

• **columnMapping**: *[number, number][]*

*Defined in [src/UndoRedo.ts:131](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L131)*

___

### oldContent

• **oldContent**: *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/UndoRedo.ts:132](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L132)*

___

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:130](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L130)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:141](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:137](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L137)*

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