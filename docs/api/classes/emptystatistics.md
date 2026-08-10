# EmptyStatistics

Do not store stats in the memory. Stats are not needed on daily basis

## Methods

### end 

▸ **end**(`_name`: [StatType](../enums/stattype.md)): *void*

*Defined in [src/statistics/EmptyStatistics.ts:27](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/EmptyStatistics.ts#L27)*

**`inheritdoc`** 

**Parameters:**

Name | Type |
------ | ------ |
`_name` | [StatType](../enums/stattype.md) |

**Returns:** *void*

___

### incrementCriterionFunctionFullCacheUsed 

▸ **incrementCriterionFunctionFullCacheUsed**(): *void*

*Defined in [src/statistics/EmptyStatistics.ts:12](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/EmptyStatistics.ts#L12)*

**`inheritdoc`** 

**Returns:** *void*

___

### incrementCriterionFunctionPartialCacheUsed 

▸ **incrementCriterionFunctionPartialCacheUsed**(): *void*

*Defined in [src/statistics/EmptyStatistics.ts:17](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/EmptyStatistics.ts#L17)*

**`inheritdoc`** 

**Returns:** *void*

___

### measure 

▸ **measure**‹**T**›(`name`: [StatType](../enums/stattype.md), `func`: function): *T*

*Defined in [src/statistics/Statistics.ts:80](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L80)*

Measure given statistic as execution of given function.

**Type parameters:**

▪ **T**

**Parameters:**

▪ **name**: *[StatType](../enums/stattype.md)*

statistic to track

▪ **func**: *function*

function to call

▸ (): *T*

**Returns:** *T*

result of the function call

___

### reset 

▸ **reset**(): *void*

*Defined in [src/statistics/Statistics.ts:33](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L33)*

Resets statistics

**Returns:** *void*

___

### snapshot 

▸ **snapshot**(): *Map‹[StatType](../enums/stattype.md), number›*

*Defined in [src/statistics/Statistics.ts:90](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L90)*

Returns the snapshot of current results

**Returns:** *Map‹[StatType](../enums/stattype.md), number›*

___

### start 

▸ **start**(`_name`: [StatType](../enums/stattype.md)): *void*

*Defined in [src/statistics/EmptyStatistics.ts:22](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/EmptyStatistics.ts#L22)*

**`inheritdoc`** 

**Parameters:**

Name | Type |
------ | ------ |
`_name` | [StatType](../enums/stattype.md) |

**Returns:** *void*