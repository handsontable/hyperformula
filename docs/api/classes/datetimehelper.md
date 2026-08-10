# DateTimeHelper

## Constructors

### constructor 

\+ **new DateTimeHelper**(`config`: [Config](config.md)): *[DateTimeHelper](datetimehelper.md)*

*Defined in [src/DateTimeHelper.ts:58](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |

**Returns:** *[DateTimeHelper](datetimehelper.md)*

## Methods

### dateStringToDateNumber 

▸ **dateStringToDateNumber**(`dateTimeString`: string): *[Maybe](../globals.md#maybe)‹ExtendedNumber›*

*Defined in [src/DateTimeHelper.ts:81](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`dateTimeString` | string |

**Returns:** *[Maybe](../globals.md#maybe)‹ExtendedNumber›*

___

### dateToNumber 

▸ **dateToNumber**(`date`: [SimpleDate](../interfaces/simpledate.md)): *number*

*Defined in [src/DateTimeHelper.ts:131](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](../interfaces/simpledate.md) |

**Returns:** *number*

___

### daysInMonth 

▸ **daysInMonth**(`year`: number, `month`: number): *number*

*Defined in [src/DateTimeHelper.ts:167](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L167)*

**Parameters:**

Name | Type |
------ | ------ |
`year` | number |
`month` | number |

**Returns:** *number*

___

### endOfMonth 

▸ **endOfMonth**(`date`: [SimpleDate](../interfaces/simpledate.md)): *[SimpleDate](../interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:175](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](../interfaces/simpledate.md) |

**Returns:** *[SimpleDate](../interfaces/simpledate.md)*

___

### getEpochYearZero 

▸ **getEpochYearZero**(): *number*

*Defined in [src/DateTimeHelper.ts:109](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L109)*

**Returns:** *number*

___

### getNullYear 

▸ **getNullYear**(): *number*

*Defined in [src/DateTimeHelper.ts:105](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L105)*

**Returns:** *number*

___

### getWithinBounds 

▸ **getWithinBounds**(`dayNumber`: number): *[Maybe](../globals.md#maybe)‹number›*

*Defined in [src/DateTimeHelper.ts:77](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`dayNumber` | number |

**Returns:** *[Maybe](../globals.md#maybe)‹number›*

___

### isValidDate 

▸ **isValidDate**(`date`: [SimpleDate](../interfaces/simpledate.md)): *boolean*

*Defined in [src/DateTimeHelper.ts:113](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](../interfaces/simpledate.md) |

**Returns:** *boolean*

___

### leapYearsCount 

▸ **leapYearsCount**(`year`: number): *number*

*Defined in [src/DateTimeHelper.ts:163](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L163)*

**Parameters:**

Name | Type |
------ | ------ |
`year` | number |

**Returns:** *number*

___

### numberToSimpleDate 

▸ **numberToSimpleDate**(`arg`: number): *[SimpleDate](../interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:139](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L139)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *[SimpleDate](../interfaces/simpledate.md)*

___

### numberToSimpleDateTime 

▸ **numberToSimpleDateTime**(`arg`: number): *[SimpleDateTime](../globals.md#simpledatetime)*

*Defined in [src/DateTimeHelper.ts:154](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L154)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *[SimpleDateTime](../globals.md#simpledatetime)*

___

### parseDateTimeFromConfigFormats 

▸ **parseDateTimeFromConfigFormats**(`dateTimeString`: string): *Partial‹object›*

*Defined in [src/DateTimeHelper.ts:101](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`dateTimeString` | string |

**Returns:** *Partial‹object›*

___

### relativeNumberToAbsoluteNumber 

▸ **relativeNumberToAbsoluteNumber**(`arg`: number): *number*

*Defined in [src/DateTimeHelper.ts:135](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *number*

___

### toBasisUS 

▸ **toBasisUS**(`start`: [SimpleDate](../interfaces/simpledate.md), `end`: [SimpleDate](../interfaces/simpledate.md)): *[[SimpleDate](../interfaces/simpledate.md), [SimpleDate](../interfaces/simpledate.md)]*

*Defined in [src/DateTimeHelper.ts:179](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L179)*

**Parameters:**

Name | Type |
------ | ------ |
`start` | [SimpleDate](../interfaces/simpledate.md) |
`end` | [SimpleDate](../interfaces/simpledate.md) |

**Returns:** *[[SimpleDate](../interfaces/simpledate.md), [SimpleDate](../interfaces/simpledate.md)]*

___

### yearLengthForBasis 

▸ **yearLengthForBasis**(`start`: [SimpleDate](../interfaces/simpledate.md), `end`: [SimpleDate](../interfaces/simpledate.md)): *number*

*Defined in [src/DateTimeHelper.ts:195](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L195)*

**Parameters:**

Name | Type |
------ | ------ |
`start` | [SimpleDate](../interfaces/simpledate.md) |
`end` | [SimpleDate](../interfaces/simpledate.md) |

**Returns:** *number*