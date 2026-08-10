# PasteUndoEntry

## Constructors

### constructor 

\+ **new PasteUndoEntry**(`targetLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `oldContent`: [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][], `newContent`: [ClipboardCell](../globals.md#clipboardcell)[][], `addedGlobalNamedExpressions`: string[]): *[PasteUndoEntry](pasteundoentry.md)*

*Defined in [src/UndoRedo.ts:366](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L366)*

**Parameters:**

Name | Type |
------ | ------ |
`targetLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`oldContent` | [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][] |
`newContent` | [ClipboardCell](../globals.md#clipboardcell)[][] |
`addedGlobalNamedExpressions` | string[] |

**Returns:** *[PasteUndoEntry](pasteundoentry.md)*

## Properties

### addedGlobalNamedExpressions

• **addedGlobalNamedExpressions**: *string[]*

*Defined in [src/UndoRedo.ts:371](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L371)*

___

### newContent

• **newContent**: *[ClipboardCell](../globals.md#clipboardcell)[][]*

*Defined in [src/UndoRedo.ts:370](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L370)*

___

### oldContent

• **oldContent**: *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/UndoRedo.ts:369](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L369)*

___

### targetLeftCorner

• **targetLeftCorner**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/UndoRedo.ts:368](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L368)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:380](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L380)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:376](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L376)*

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