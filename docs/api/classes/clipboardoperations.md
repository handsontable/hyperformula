# ClipboardOperations

## Constructors

### constructor 

\+ **new ClipboardOperations**(`config`: [Config](config.md), `dependencyGraph`: DependencyGraph, `operations`: [Operations](operations.md)): *[ClipboardOperations](clipboardoperations.md)*

*Defined in [src/ClipboardOperations.ts:77](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`dependencyGraph` | DependencyGraph |
`operations` | [Operations](operations.md) |

**Returns:** *[ClipboardOperations](clipboardoperations.md)*

## Properties

### clipboard

• **clipboard**? : *[Clipboard](clipboard.md)*

*Defined in [src/ClipboardOperations.ts:75](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L75)*

## Methods

### abortCut 

▸ **abortCut**(): *void*

*Defined in [src/ClipboardOperations.ts:107](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L107)*

**Returns:** *void*

___

### clear 

▸ **clear**(): *void*

*Defined in [src/ClipboardOperations.ts:113](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L113)*

**Returns:** *void*

___

### copy 

▸ **copy**(`leftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *void*

*Defined in [src/ClipboardOperations.ts:92](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`leftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *void*

___

### cut 

▸ **cut**(`leftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *void*

*Defined in [src/ClipboardOperations.ts:88](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`leftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *void*

___

### ensureItIsPossibleToCopyPaste 

▸ **ensureItIsPossibleToCopyPaste**(`destinationLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/ClipboardOperations.ts:117](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`destinationLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### isCopyClipboard 

▸ **isCopyClipboard**(): *boolean*

*Defined in [src/ClipboardOperations.ts:141](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L141)*

**Returns:** *boolean*

___

### isCutClipboard 

▸ **isCutClipboard**(): *boolean*

*Defined in [src/ClipboardOperations.ts:137](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L137)*

**Returns:** *boolean*