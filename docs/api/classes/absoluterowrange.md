# AbsoluteRowRange

## Constructors

### constructor 

\+ **new AbsoluteRowRange**(`sheet`: number, `rowStart`: number, `rowEnd`: number): *[AbsoluteRowRange](absoluterowrange.md)*

*Defined in [src/AbsoluteCellRange.ts:495](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L495)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`rowStart` | number |
`rowEnd` | number |

**Returns:** *[AbsoluteRowRange](absoluterowrange.md)*

## Properties

### end

• **end**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/AbsoluteCellRange.ts:47](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L47)*

___

### start

• **start**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/AbsoluteCellRange.ts:46](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L46)*

## Accessors

### sheet 

• **get sheet**(): *number*

*Defined in [src/AbsoluteCellRange.ts:60](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L60)*

**Returns:** *number*

## Methods

### addressInRange 

▸ **addressInRange**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:157](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L157)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *boolean*

___

### addresses 

▸ **addresses**(`dependencyGraph`: DependencyGraph): *[SimpleCellAddress](../interfaces/simplecelladdress.md)[]*

*Defined in [src/AbsoluteCellRange.ts:315](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L315)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |

**Returns:** *[SimpleCellAddress](../interfaces/simplecelladdress.md)[]*

___

### addressesArrayMap 

▸ **addressesArrayMap**‹**T**›(`dependencyGraph`: DependencyGraph, `op`: function): *T[][]*

*Defined in [src/AbsoluteCellRange.ts:299](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L299)*

**Type parameters:**

▪ **T**

**Parameters:**

▪ **dependencyGraph**: *DependencyGraph*

▪ **op**: *function*

▸ (`arg`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *T*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *T[][]*

___

### addressesWithDirection 

▸ **addressesWithDirection**(`right`: number, `bottom`: number, `dependencyGraph`: DependencyGraph): *IterableIterator‹[SimpleCellAddress](../interfaces/simplecelladdress.md)›*

*Defined in [src/AbsoluteCellRange.ts:331](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L331)*

**Parameters:**

Name | Type |
------ | ------ |
`right` | number |
`bottom` | number |
`dependencyGraph` | DependencyGraph |

**Returns:** *IterableIterator‹[SimpleCellAddress](../interfaces/simplecelladdress.md)›*

___

### arrayOfAddressesInRange 

▸ **arrayOfAddressesInRange**(): *[SimpleCellAddress](../interfaces/simplecelladdress.md)[][]*

*Defined in [src/AbsoluteCellRange.ts:275](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L275)*

**Returns:** *[SimpleCellAddress](../interfaces/simplecelladdress.md)[][]*

___

### columnInRange 

▸ **columnInRange**(`address`: [SimpleColumnAddress](../interfaces/simplecolumnaddress.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:168](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L168)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleColumnAddress](../interfaces/simplecolumnaddress.md) |

**Returns:** *boolean*

___

### containsRange 

▸ **containsRange**(`range`: [AbsoluteCellRange](absolutecellrange.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:182](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L182)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *boolean*

___

### doesOverlap 

▸ **doesOverlap**(`other`: [AbsoluteCellRange](absolutecellrange.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:144](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`other` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *boolean*

___

### effectiveEndColumn 

▸ **effectiveEndColumn**(`dependencyGraph`: DependencyGraph): *number*

*Defined in [src/AbsoluteCellRange.ts:536](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L536)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |

**Returns:** *number*

___

### effectiveEndRow 

▸ **effectiveEndRow**(`_dependencyGraph`: DependencyGraph): *number*

*Defined in [src/AbsoluteCellRange.ts:394](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L394)*

**Parameters:**

Name | Type |
------ | ------ |
`_dependencyGraph` | DependencyGraph |

**Returns:** *number*

___

### effectiveHeight 

▸ **effectiveHeight**(`_dependencyGraph`: DependencyGraph): *number*

*Defined in [src/AbsoluteCellRange.ts:402](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L402)*

**Parameters:**

Name | Type |
------ | ------ |
`_dependencyGraph` | DependencyGraph |

**Returns:** *number*

___

### effectiveWidth 

▸ **effectiveWidth**(`dependencyGraph`: DependencyGraph): *number*

*Defined in [src/AbsoluteCellRange.ts:540](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L540)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |

**Returns:** *number*

___

### exceedsSheetSizeLimits 

▸ **exceedsSheetSizeLimits**(`_maxColumns`: number, `maxRows`: number): *boolean*

*Defined in [src/AbsoluteCellRange.ts:532](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L532)*

**Parameters:**

Name | Type |
------ | ------ |
`_maxColumns` | number |
`maxRows` | number |

**Returns:** *boolean*

___

### expandByColumns 

▸ **expandByColumns**(`_numberOfColumns`: number): *void*

*Defined in [src/AbsoluteCellRange.ts:520](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L520)*

**Parameters:**

Name | Type |
------ | ------ |
`_numberOfColumns` | number |

**Returns:** *void*

___

### expandByRows 

▸ **expandByRows**(`numberOfRows`: number): *void*

*Defined in [src/AbsoluteCellRange.ts:217](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L217)*

**Parameters:**

Name | Type |
------ | ------ |
`numberOfRows` | number |

**Returns:** *void*

___

### getAddress 

▸ **getAddress**(`col`: number, `row`: number): *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/AbsoluteCellRange.ts:379](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L379)*

**Parameters:**

Name | Type |
------ | ------ |
`col` | number |
`row` | number |

**Returns:** *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

___

### height 

▸ **height**(): *number*

*Defined in [src/AbsoluteCellRange.ts:267](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L267)*

**Returns:** *number*

___

### includesColumn 

▸ **includesColumn**(`column`: number): *boolean*

*Defined in [src/AbsoluteCellRange.ts:208](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L208)*

**Parameters:**

Name | Type |
------ | ------ |
`column` | number |

**Returns:** *boolean*

___

### includesRow 

▸ **includesRow**(`row`: number): *boolean*

*Defined in [src/AbsoluteCellRange.ts:204](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L204)*

**Parameters:**

Name | Type |
------ | ------ |
`row` | number |

**Returns:** *boolean*

___

### intersectionWith 

▸ **intersectionWith**(`other`: [AbsoluteCellRange](absolutecellrange.md)): *[Maybe](../globals.md#maybe)‹[AbsoluteCellRange](absolutecellrange.md)›*

*Defined in [src/AbsoluteCellRange.ts:186](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L186)*

**Parameters:**

Name | Type |
------ | ------ |
`other` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *[Maybe](../globals.md#maybe)‹[AbsoluteCellRange](absolutecellrange.md)›*

___

### isFinite 

▸ **isFinite**(): *boolean*

*Defined in [src/AbsoluteCellRange.ts:140](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L140)*

**Returns:** *boolean*

___

### moveToSheet 

▸ **moveToSheet**(`toSheet`: number): *void*

*Defined in [src/AbsoluteCellRange.ts:234](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L234)*

**Parameters:**

Name | Type |
------ | ------ |
`toSheet` | number |

**Returns:** *void*

___

### rangeWithSameHeight 

▸ **rangeWithSameHeight**(`startColumn`: number, `numberOfColumns`: number): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:255](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L255)*

**Parameters:**

Name | Type |
------ | ------ |
`startColumn` | number |
`numberOfColumns` | number |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### rangeWithSameWidth 

▸ **rangeWithSameWidth**(`startRow`: number, `numberOfRows`: number): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:528](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L528)*

**Parameters:**

Name | Type |
------ | ------ |
`startRow` | number |
`numberOfRows` | number |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### removeSpan 

▸ **removeSpan**(`span`: [Span](../globals.md#span)): *void*

*Defined in [src/AbsoluteCellRange.ts:239](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L239)*

**Parameters:**

Name | Type |
------ | ------ |
`span` | [Span](../globals.md#span) |

**Returns:** *void*

___

### rowInRange 

▸ **rowInRange**(`address`: [SimpleRowAddress](../interfaces/simplerowaddress.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:175](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleRowAddress](../interfaces/simplerowaddress.md) |

**Returns:** *boolean*

___

### sameAs 

▸ **sameAs**(`other`: [AbsoluteCellRange](absolutecellrange.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:295](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`other` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *boolean*

___

### sameDimensionsAs 

▸ **sameDimensionsAs**(`other`: [AbsoluteCellRange](absolutecellrange.md)): *boolean*

*Defined in [src/AbsoluteCellRange.ts:291](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L291)*

**Parameters:**

Name | Type |
------ | ------ |
`other` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *boolean*

___

### shiftByColumns 

▸ **shiftByColumns**(`_numberOfColumns`: number): *void*

*Defined in [src/AbsoluteCellRange.ts:516](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L516)*

**Parameters:**

Name | Type |
------ | ------ |
`_numberOfColumns` | number |

**Returns:** *void*

___

### shiftByRows 

▸ **shiftByRows**(`numberOfRows`: number): *void*

*Defined in [src/AbsoluteCellRange.ts:212](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`numberOfRows` | number |

**Returns:** *void*

___

### shifted 

▸ **shifted**(`byCols`: number, `byRows`: number): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:524](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L524)*

**Parameters:**

Name | Type |
------ | ------ |
`byCols` | number |
`byRows` | number |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### shouldBeRemoved 

▸ **shouldBeRemoved**(): *boolean*

*Defined in [src/AbsoluteCellRange.ts:512](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L512)*

**Returns:** *boolean*

___

### size 

▸ **size**(): *number*

*Defined in [src/AbsoluteCellRange.ts:271](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L271)*

**Returns:** *number*

___

### toString 

▸ **toString**(): *string*

*Defined in [src/AbsoluteCellRange.ts:259](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L259)*

**Returns:** *string*

___

### width 

▸ **width**(): *number*

*Defined in [src/AbsoluteCellRange.ts:263](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L263)*

**Returns:** *number*

___

### withStart 

▸ **withStart**(`newStart`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:287](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L287)*

**Parameters:**

Name | Type |
------ | ------ |
`newStart` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### fromAst

▸ **fromAst**(`ast`: CellRangeAst | ColumnRangeAst | RowRangeAst, `baseAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:83](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | CellRangeAst &#124; ColumnRangeAst &#124; RowRangeAst |
`baseAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### fromAstOrUndef

▸ **fromAstOrUndef**(`ast`: CellRangeAst | ColumnRangeAst | RowRangeAst, `baseAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[Maybe](../globals.md#maybe)‹[AbsoluteCellRange](absolutecellrange.md)›*

*Defined in [src/AbsoluteCellRange.ts:93](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | CellRangeAst &#124; ColumnRangeAst &#124; RowRangeAst |
`baseAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[Maybe](../globals.md#maybe)‹[AbsoluteCellRange](absolutecellrange.md)›*

___

### fromCellRange

▸ **fromCellRange**(`x`: [CellRange](../interfaces/cellrange.md), `baseAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:101](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | [CellRange](../interfaces/cellrange.md) |
`baseAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### fromCoordinates

▸ **fromCoordinates**(`sheet`: number, `x1`: number, `y1`: number, `x2`: number, `y2`: number): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:136](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L136)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`x1` | number |
`y1` | number |
`x2` | number |
`y2` | number |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### fromRowRangeAst

▸ **fromRowRangeAst**(`x`: RowRangeAst, `baseAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[AbsoluteRowRange](absoluterowrange.md)*

*Defined in [src/AbsoluteCellRange.ts:503](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L503)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | RowRangeAst |
`baseAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[AbsoluteRowRange](absoluterowrange.md)*

___

### fromSimpleCellAddresses

▸ **fromSimpleCellAddresses**(`start`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `end`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:64](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`start` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`end` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### spanFrom

▸ **spanFrom**(`topLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/AbsoluteCellRange.ts:108](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`topLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *[AbsoluteCellRange](absolutecellrange.md)*

___

### spanFromOrUndef

▸ **spanFromOrUndef**(`topLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *[Maybe](../globals.md#maybe)‹[AbsoluteCellRange](absolutecellrange.md)›*

*Defined in [src/AbsoluteCellRange.ts:116](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L116)*

**Parameters:**

Name | Type |
------ | ------ |
`topLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *[Maybe](../globals.md#maybe)‹[AbsoluteCellRange](absolutecellrange.md)›*