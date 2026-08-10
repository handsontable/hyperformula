# RowsSpan

## Constructors

### constructor 

\+ **new RowsSpan**(`sheet`: number, `rowStart`: number, `rowEnd`: number): *[RowsSpan](rowsspan.md)*

*Defined in [src/Span.ts:11](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`rowStart` | number |
`rowEnd` | number |

**Returns:** *[RowsSpan](rowsspan.md)*

## Properties

### rowEnd

• **rowEnd**: *number*

*Defined in [src/Span.ts:16](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L16)*

___

### rowStart

• **rowStart**: *number*

*Defined in [src/Span.ts:15](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L15)*

___

### sheet

• **sheet**: *number*

*Defined in [src/Span.ts:14](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L14)*

## Accessors

### end 

• **get end**(): *number*

*Defined in [src/Span.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L34)*

**Returns:** *number*

___

### numberOfRows 

• **get numberOfRows**(): *number*

*Defined in [src/Span.ts:26](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L26)*

**Returns:** *number*

___

### start 

• **get start**(): *number*

*Defined in [src/Span.ts:30](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L30)*

**Returns:** *number*

## Methods

### firstRow 

▸ **firstRow**(): *[RowsSpan](rowsspan.md)*

*Defined in [src/Span.ts:64](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L64)*

**Returns:** *[RowsSpan](rowsspan.md)*

___

### intersect 

▸ **intersect**(`otherSpan`: [RowsSpan](rowsspan.md)): *[RowsSpan](rowsspan.md) | null*

*Defined in [src/Span.ts:52](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`otherSpan` | [RowsSpan](rowsspan.md) |

**Returns:** *[RowsSpan](rowsspan.md) | null*

___

### rows 

▸ **rows**(): *IterableIterator‹number›*

*Defined in [src/Span.ts:46](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L46)*

**Returns:** *IterableIterator‹number›*

___

### fromNumberOfRows

▸ **fromNumberOfRows**(`sheet`: number, `rowStart`: number, `numberOfRows`: number): *[RowsSpan](rowsspan.md)‹›*

*Defined in [src/Span.ts:38](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`rowStart` | number |
`numberOfRows` | number |

**Returns:** *[RowsSpan](rowsspan.md)‹›*

___

### fromRowStartAndEnd

▸ **fromRowStartAndEnd**(`sheet`: number, `rowStart`: number, `rowEnd`: number): *[RowsSpan](rowsspan.md)‹›*

*Defined in [src/Span.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`rowStart` | number |
`rowEnd` | number |

**Returns:** *[RowsSpan](rowsspan.md)‹›*