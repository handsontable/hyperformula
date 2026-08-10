# ColumnsSpan

## Constructors

### constructor 

\+ **new ColumnsSpan**(`sheet`: number, `columnStart`: number, `columnEnd`: number): *[ColumnsSpan](columnsspan.md)*

*Defined in [src/Span.ts:72](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`columnStart` | number |
`columnEnd` | number |

**Returns:** *[ColumnsSpan](columnsspan.md)*

## Properties

### columnEnd

• **columnEnd**: *number*

*Defined in [src/Span.ts:76](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L76)*

___

### columnStart

• **columnStart**: *number*

*Defined in [src/Span.ts:75](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L75)*

___

### sheet

• **sheet**: *number*

*Defined in [src/Span.ts:74](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L74)*

## Accessors

### end 

• **get end**(): *number*

*Defined in [src/Span.ts:94](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L94)*

**Returns:** *number*

___

### numberOfColumns 

• **get numberOfColumns**(): *number*

*Defined in [src/Span.ts:86](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L86)*

**Returns:** *number*

___

### start 

• **get start**(): *number*

*Defined in [src/Span.ts:90](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L90)*

**Returns:** *number*

## Methods

### columns 

▸ **columns**(): *IterableIterator‹number›*

*Defined in [src/Span.ts:106](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L106)*

**Returns:** *IterableIterator‹number›*

___

### firstColumn 

▸ **firstColumn**(): *[ColumnsSpan](columnsspan.md)*

*Defined in [src/Span.ts:124](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L124)*

**Returns:** *[ColumnsSpan](columnsspan.md)*

___

### intersect 

▸ **intersect**(`otherSpan`: [ColumnsSpan](columnsspan.md)): *[ColumnsSpan](columnsspan.md) | null*

*Defined in [src/Span.ts:112](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`otherSpan` | [ColumnsSpan](columnsspan.md) |

**Returns:** *[ColumnsSpan](columnsspan.md) | null*

___

### fromColumnStartAndEnd

▸ **fromColumnStartAndEnd**(`sheet`: number, `columnStart`: number, `columnEnd`: number): *[ColumnsSpan](columnsspan.md)‹›*

*Defined in [src/Span.ts:102](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`columnStart` | number |
`columnEnd` | number |

**Returns:** *[ColumnsSpan](columnsspan.md)‹›*

___

### fromNumberOfColumns

▸ **fromNumberOfColumns**(`sheet`: number, `columnStart`: number, `numberOfColumns`: number): *[ColumnsSpan](columnsspan.md)‹›*

*Defined in [src/Span.ts:98](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L98)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`columnStart` | number |
`numberOfColumns` | number |

**Returns:** *[ColumnsSpan](columnsspan.md)‹›*