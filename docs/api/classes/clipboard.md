# Clipboard

## Constructors

### constructor 

\+ **new Clipboard**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number, `type`: [ClipboardOperationType](../enums/clipboardoperationtype.md), `content?`: [ClipboardCell](../globals.md#clipboardcell)[][]): *[Clipboard](clipboard.md)*

*Defined in [src/ClipboardOperations.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |
`type` | [ClipboardOperationType](../enums/clipboardoperationtype.md) |
`content?` | [ClipboardCell](../globals.md#clipboardcell)[][] |

**Returns:** *[Clipboard](clipboard.md)*

## Properties

### content

• **content**? : *[ClipboardCell](../globals.md#clipboardcell)[][]*

*Defined in [src/ClipboardOperations.ts:57](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L57)*

___

### height

• **height**: *number*

*Defined in [src/ClipboardOperations.ts:55](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L55)*

___

### sourceLeftCorner

• **sourceLeftCorner**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/ClipboardOperations.ts:53](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L53)*

___

### type

• **type**: *[ClipboardOperationType](../enums/clipboardoperationtype.md)*

*Defined in [src/ClipboardOperations.ts:56](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L56)*

___

### width

• **width**: *number*

*Defined in [src/ClipboardOperations.ts:54](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L54)*

## Methods

### getContent 

▸ **getContent**(`leftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *IterableIterator‹[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]›*

*Defined in [src/ClipboardOperations.ts:61](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`leftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *IterableIterator‹[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]›*