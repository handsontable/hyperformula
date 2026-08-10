# ColumnSearchStrategy

## Methods

### add 

▸ **add**(`value`: RawInterpreterValue, `address`: [SimpleCellAddress](simplecelladdress.md)): *void*

*Defined in [src/Lookup/SearchStrategy.ts:37](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawInterpreterValue |
`address` | [SimpleCellAddress](simplecelladdress.md) |

**Returns:** *void*

___

### addColumns 

▸ **addColumns**(`columnsSpan`: [ColumnsSpan](../classes/columnsspan.md)): *void*

*Defined in [src/Lookup/SearchStrategy.ts:45](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`columnsSpan` | [ColumnsSpan](../classes/columnsspan.md) |

**Returns:** *void*

___

### advancedFind 

▸ **advancedFind**(`keyMatcher`: function, `range`: [SimpleRangeValue](../classes/simplerangevalue.md), `options`: [AdvancedFindOptions](advancedfindoptions.md)): *number*

*Defined in [src/Lookup/SearchStrategy.ts:33](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L33)*

**Parameters:**

▪ **keyMatcher**: *function*

▸ (`arg`: RawInterpreterValue): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | RawInterpreterValue |

▪ **range**: *[SimpleRangeValue](../classes/simplerangevalue.md)*

▪ **options**: *[AdvancedFindOptions](advancedfindoptions.md)*

**Returns:** *number*

___

### applyChanges 

▸ **applyChanges**(`contentChanges`: [CellValueChange](cellvaluechange.md)[]): *void*

*Defined in [src/Lookup/SearchStrategy.ts:43](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`contentChanges` | [CellValueChange](cellvaluechange.md)[] |

**Returns:** *void*

___

### change 

▸ **change**(`oldValue`: RawInterpreterValue | undefined, `newValue`: RawInterpreterValue, `address`: [SimpleCellAddress](simplecelladdress.md)): *void*

*Defined in [src/Lookup/SearchStrategy.ts:41](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`oldValue` | RawInterpreterValue &#124; undefined |
`newValue` | RawInterpreterValue |
`address` | [SimpleCellAddress](simplecelladdress.md) |

**Returns:** *void*

___

### find 

▸ **find**(`searchKey`: RawNoErrorScalarValue, `range`: [SimpleRangeValue](../classes/simplerangevalue.md), `options`: [SearchOptions](searchoptions.md)): *number*

*Defined in [src/Lookup/SearchStrategy.ts:31](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`searchKey` | RawNoErrorScalarValue |
`range` | [SimpleRangeValue](../classes/simplerangevalue.md) |
`options` | [SearchOptions](searchoptions.md) |

**Returns:** *number*

___

### forceApplyPostponedTransformations 

▸ **forceApplyPostponedTransformations**(): *void*

*Defined in [src/Lookup/SearchStrategy.ts:60](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L60)*

Forces all lazily-tracked ValueIndex entries to apply any pending transformations,
bringing every entry's version up to the current LazilyTransformingAstService version.
Must be called before compacting LazilyTransformingAstService.

**Returns:** *void*

___

### moveValues 

▸ **moveValues**(`range`: IterableIterator‹[RawScalarValue, [SimpleCellAddress](simplecelladdress.md)]›, `toRight`: number, `toBottom`: number, `toSheet`: number): *void*

*Defined in [src/Lookup/SearchStrategy.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | IterableIterator‹[RawScalarValue, [SimpleCellAddress](simplecelladdress.md)]› |
`toRight` | number |
`toBottom` | number |
`toSheet` | number |

**Returns:** *void*

___

### remove 

▸ **remove**(`value`: RawInterpreterValue | undefined, `address`: [SimpleCellAddress](simplecelladdress.md)): *void*

*Defined in [src/Lookup/SearchStrategy.ts:39](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawInterpreterValue &#124; undefined |
`address` | [SimpleCellAddress](simplecelladdress.md) |

**Returns:** *void*

___

### removeColumns 

▸ **removeColumns**(`columnsSpan`: [ColumnsSpan](../classes/columnsspan.md)): *void*

*Defined in [src/Lookup/SearchStrategy.ts:47](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`columnsSpan` | [ColumnsSpan](../classes/columnsspan.md) |

**Returns:** *void*

___

### removeSheet 

▸ **removeSheet**(`sheetId`: number): *void*

*Defined in [src/Lookup/SearchStrategy.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *void*

___

### removeValues 

▸ **removeValues**(`range`: IterableIterator‹[RawScalarValue, [SimpleCellAddress](simplecelladdress.md)]›): *void*

*Defined in [src/Lookup/SearchStrategy.ts:53](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | IterableIterator‹[RawScalarValue, [SimpleCellAddress](simplecelladdress.md)]› |

**Returns:** *void*