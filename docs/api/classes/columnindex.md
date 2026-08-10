# ColumnIndex

## Constructors

### constructor 

\+ **new ColumnIndex**(`dependencyGraph`: DependencyGraph, `config`: [Config](config.md), `stats`: [Statistics](statistics.md)): *[ColumnIndex](columnindex.md)*

*Defined in [src/Lookup/ColumnIndex.ts:43](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |
`config` | [Config](config.md) |
`stats` | [Statistics](statistics.md) |

**Returns:** *[ColumnIndex](columnindex.md)*

## Methods

### add 

▸ **add**(`value`: RawInterpreterValue, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Lookup/ColumnIndex.ts:54](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawInterpreterValue |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### addColumns 

▸ **addColumns**(`columnsSpan`: [ColumnsSpan](columnsspan.md)): *void*

*Defined in [src/Lookup/ColumnIndex.ts:165](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`columnsSpan` | [ColumnsSpan](columnsspan.md) |

**Returns:** *void*

___

### advancedFind 

▸ **advancedFind**(`keyMatcher`: function, `range`: [SimpleRangeValue](simplerangevalue.md), `options`: [AdvancedFindOptions](../interfaces/advancedfindoptions.md)): *number*

*Defined in [src/Lookup/ColumnIndex.ts:161](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L161)*

**Parameters:**

▪ **keyMatcher**: *function*

▸ (`arg`: RawInterpreterValue): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | RawInterpreterValue |

▪ **range**: *[SimpleRangeValue](simplerangevalue.md)*

▪`Default value`  **options**: *[AdvancedFindOptions](../interfaces/advancedfindoptions.md)*= { returnOccurrence: 'first' }

**Returns:** *number*

___

### applyChanges 

▸ **applyChanges**(`contentChanges`: [CellValueChange](../interfaces/cellvaluechange.md)[]): *void*

*Defined in [src/Lookup/ColumnIndex.ts:88](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`contentChanges` | [CellValueChange](../interfaces/cellvaluechange.md)[] |

**Returns:** *void*

___

### change 

▸ **change**(`oldValue`: RawInterpreterValue | undefined, `newValue`: RawInterpreterValue, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Lookup/ColumnIndex.ts:80](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`oldValue` | RawInterpreterValue &#124; undefined |
`newValue` | RawInterpreterValue |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### ensureRecentData 

▸ **ensureRecentData**(`sheet`: number, `col`: number, `value`: RawInterpreterValue): *void*

*Defined in [src/Lookup/ColumnIndex.ts:233](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L233)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`col` | number |
`value` | RawInterpreterValue |

**Returns:** *void*

___

### find 

▸ **find**(`searchKey`: RawNoErrorScalarValue, `rangeValue`: [SimpleRangeValue](simplerangevalue.md), `__namedParameters`: object): *number*

*Defined in [src/Lookup/ColumnIndex.ts:110](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L110)*

**Parameters:**

▪ **searchKey**: *RawNoErrorScalarValue*

▪ **rangeValue**: *[SimpleRangeValue](simplerangevalue.md)*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`ifNoMatch` | "returnLowerBound" &#124; "returnUpperBound" &#124; "returnNotFound" |
`ordering` | "asc" &#124; "desc" &#124; "none" |
`returnOccurrence` | undefined &#124; "first" &#124; "last" |

**Returns:** *number*

___

### forceApplyPostponedTransformations 

▸ **forceApplyPostponedTransformations**(): *void*

*Defined in [src/Lookup/ColumnIndex.ts:192](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L192)*

Forces all ValueIndex entries to apply any pending lazy transformations,
bringing every entry up to the current LazilyTransformingAstService version.
Must be called before compacting LazilyTransformingAstService.

**Returns:** *void*

___

### getColumnMap 

▸ **getColumnMap**(`sheet`: number, `col`: number): *[ColumnMap](../globals.md#columnmap)*

*Defined in [src/Lookup/ColumnIndex.ts:205](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L205)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`col` | number |

**Returns:** *[ColumnMap](../globals.md#columnmap)*

___

### getValueIndex 

▸ **getValueIndex**(`sheet`: number, `col`: number, `value`: RawInterpreterValue): *[ValueIndex](../interfaces/valueindex.md)*

*Defined in [src/Lookup/ColumnIndex.ts:220](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L220)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`col` | number |
`value` | RawInterpreterValue |

**Returns:** *[ValueIndex](../interfaces/valueindex.md)*

___

### moveValues 

▸ **moveValues**(`sourceRange`: IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]›, `toRight`: number, `toBottom`: number, `toSheet`: number): *void*

*Defined in [src/Lookup/ColumnIndex.ts:96](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceRange` | IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]› |
`toRight` | number |
`toBottom` | number |
`toSheet` | number |

**Returns:** *void*

___

### remove 

▸ **remove**(`value`: RawInterpreterValue | undefined, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Lookup/ColumnIndex.ts:66](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawInterpreterValue &#124; undefined |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### removeColumns 

▸ **removeColumns**(`columnsSpan`: [ColumnsSpan](columnsspan.md)): *void*

*Defined in [src/Lookup/ColumnIndex.ts:174](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L174)*

**Parameters:**

Name | Type |
------ | ------ |
`columnsSpan` | [ColumnsSpan](columnsspan.md) |

**Returns:** *void*

___

### removeSheet 

▸ **removeSheet**(`sheetId`: number): *void*

*Defined in [src/Lookup/ColumnIndex.ts:183](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L183)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *void*

___

### removeValues 

▸ **removeValues**(`range`: IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]›): *void*

*Defined in [src/Lookup/ColumnIndex.ts:104](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]› |

**Returns:** *void*