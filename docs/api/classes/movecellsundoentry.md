# MoveCellsUndoEntry

## Constructors

### constructor 

\+ **new MoveCellsUndoEntry**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number, `destinationLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `overwrittenCellsData`: [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][], `addedGlobalNamedExpressions`: string[], `version`: number): *[MoveCellsUndoEntry](movecellsundoentry.md)*

*Defined in [src/UndoRedo.ts:68](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |
`destinationLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`overwrittenCellsData` | [[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][] |
`addedGlobalNamedExpressions` | string[] |
`version` | number |

**Returns:** *[MoveCellsUndoEntry](movecellsundoentry.md)*

## Properties

### addedGlobalNamedExpressions

• **addedGlobalNamedExpressions**: *string[]*

*Defined in [src/UndoRedo.ts:75](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L75)*

___

### destinationLeftCorner

• **destinationLeftCorner**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/UndoRedo.ts:73](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L73)*

___

### height

• **height**: *number*

*Defined in [src/UndoRedo.ts:72](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L72)*

___

### overwrittenCellsData

• **overwrittenCellsData**: *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/UndoRedo.ts:74](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L74)*

___

### sourceLeftCorner

• **sourceLeftCorner**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/UndoRedo.ts:70](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L70)*

___

### version

• **version**: *number*

*Defined in [src/UndoRedo.ts:76](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L76)*

___

### width

• **width**: *number*

*Defined in [src/UndoRedo.ts:71](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L71)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:85](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:81](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:89](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L89)*

**Returns:** *number[]*