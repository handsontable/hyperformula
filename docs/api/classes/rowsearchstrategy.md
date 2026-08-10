# RowSearchStrategy

## Constructors

### constructor 

\+ **new RowSearchStrategy**(`dependencyGraph`: DependencyGraph): *[RowSearchStrategy](rowsearchstrategy.md)*

*Defined in [src/Lookup/RowSearchStrategy.ts:12](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/RowSearchStrategy.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |

**Returns:** *[RowSearchStrategy](rowsearchstrategy.md)*

## Methods

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

### find 

▸ **find**(`searchKey`: RawNoErrorScalarValue, `rangeValue`: [SimpleRangeValue](simplerangevalue.md), `searchOptions`: [SearchOptions](../interfaces/searchoptions.md)): *number*

*Defined in [src/Lookup/RowSearchStrategy.ts:20](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/RowSearchStrategy.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`searchKey` | RawNoErrorScalarValue |
`rangeValue` | [SimpleRangeValue](simplerangevalue.md) |
`searchOptions` | [SearchOptions](../interfaces/searchoptions.md) |

**Returns:** *number*