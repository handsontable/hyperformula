# Statistics

Provides tracking performance statistics to the engine

## Methods

### end 

▸ **end**(`name`: [StatType](../enums/stattype.md)): *void*

*Defined in [src/statistics/Statistics.ts:59](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L59)*

Stops tracking particular statistic.
Raise error if tracking statistic wasn't started.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`name` | [StatType](../enums/stattype.md) | statistic to stop tracking  |

**Returns:** *void*

___

### incrementCriterionFunctionFullCacheUsed 

▸ **incrementCriterionFunctionFullCacheUsed**(): *void*

*Defined in [src/statistics/Statistics.ts:18](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L18)*

**Returns:** *void*

___

### incrementCriterionFunctionPartialCacheUsed 

▸ **incrementCriterionFunctionPartialCacheUsed**(): *void*

*Defined in [src/statistics/Statistics.ts:24](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L24)*

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

▸ **start**(`name`: [StatType](../enums/stattype.md)): *void*

*Defined in [src/statistics/Statistics.ts:45](https://github.com/handsontable/hyperformula/blob/af2d59d/src/statistics/Statistics.ts#L45)*

Starts tracking particular statistic.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`name` | [StatType](../enums/stattype.md) | statistic to start tracking  |

**Returns:** *void*