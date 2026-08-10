# ColumnBinarySearch

## Constructors

### constructor 

\+ **new ColumnBinarySearch**(`dependencyGraph`: DependencyGraph): *[ColumnBinarySearch](columnbinarysearch.md)*

*Defined in [src/Lookup/ColumnBinarySearch.ts:15](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |

**Returns:** *[ColumnBinarySearch](columnbinarysearch.md)*

## Methods

### add 

▸ **add**(`value`: RawScalarValue, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:21](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawScalarValue |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### addColumns 

▸ **addColumns**(`columnsSpan`: [ColumnsSpan](columnsspan.md)): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:37](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`columnsSpan` | [ColumnsSpan](columnsspan.md) |

**Returns:** *void*

___

### advancedFind 

▸ **advancedFind**(`keyMatcher`: function, `rangeValue`: [SimpleRangeValue](simplerangevalue.md), `__namedParameters`: object): *number*

*Defined in [src/Lookup/AdvancedFind.ts:27](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/AdvancedFind.ts#L27)*

**Parameters:**

▪ **keyMatcher**: *function*

▸ (`arg`: RawInterpreterValue): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | RawInterpreterValue |

▪ **rangeValue**: *[SimpleRangeValue](simplerangevalue.md)*

▪`Default value`  **__namedParameters**: *object*= { returnOccurrence: 'first' }

Name | Type |
------ | ------ |
`returnOccurrence` | undefined &#124; "first" &#124; "last" |

**Returns:** *number*

___

### applyChanges 

▸ **applyChanges**(`contentChanges`: [CellValueChange](../interfaces/cellvaluechange.md)[]): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:33](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`contentChanges` | [CellValueChange](../interfaces/cellvaluechange.md)[] |

**Returns:** *void*

___

### change 

▸ **change**(`oldValue`: RawScalarValue | undefined, `newValue`: RawScalarValue, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:29](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`oldValue` | RawScalarValue &#124; undefined |
`newValue` | RawScalarValue |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### find 

▸ **find**(`searchKey`: RawNoErrorScalarValue, `rangeValue`: [SimpleRangeValue](simplerangevalue.md), `searchOptions`: [SearchOptions](../interfaces/searchoptions.md)): *number*

*Defined in [src/Lookup/ColumnBinarySearch.ts:69](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`searchKey` | RawNoErrorScalarValue |
`rangeValue` | [SimpleRangeValue](simplerangevalue.md) |
`searchOptions` | [SearchOptions](../interfaces/searchoptions.md) |

**Returns:** *number*

___

### forceApplyPostponedTransformations 

▸ **forceApplyPostponedTransformations**(): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:63](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L63)*

No-op: ColumnBinarySearch reads cell values directly from the dependency graph
on every lookup, so it has no cached data that could become stale.
Unlike ColumnIndex, which maintains a separate value-to-address index that
must be kept in sync with lazy transformations, binary search always operates
on the current graph state.

**Returns:** *void*

___

### moveValues 

▸ **moveValues**(`sourceRange`: IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]›, `toRight`: number, `toBottom`: number, `toSheet`: number): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L49)*

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

▸ **remove**(`value`: RawScalarValue | undefined, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:25](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawScalarValue &#124; undefined |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### removeColumns 

▸ **removeColumns**(`columnsSpan`: [ColumnsSpan](columnsspan.md)): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:41](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`columnsSpan` | [ColumnsSpan](columnsspan.md) |

**Returns:** *void*

___

### removeSheet 

▸ **removeSheet**(`sheetId`: number): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:45](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *void*

___

### removeValues 

▸ **removeValues**(`range`: IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]›): *void*

*Defined in [src/Lookup/ColumnBinarySearch.ts:53](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnBinarySearch.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | IterableIterator‹[RawScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]› |

**Returns:** *void*