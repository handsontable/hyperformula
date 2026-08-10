# SimpleRangeValue

A class that represents a range of data.

## Constructors

### constructor 

\+ **new SimpleRangeValue**(`_data?`: InternalScalarValue[][], `range?`: [AbsoluteCellRange](absolutecellrange.md), `dependencyGraph?`: DependencyGraph, `_hasOnlyNumbers?`: undefined | false | true): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/SimpleRangeValue.ts:21](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L21)*

In most cases, it's more convenient to create a `SimpleRangeValue` object
by calling one of the [static factory methods](#fromrange).

**Parameters:**

Name | Type |
------ | ------ |
`_data?` | InternalScalarValue[][] |
`range?` | [AbsoluteCellRange](absolutecellrange.md) |
`dependencyGraph?` | DependencyGraph |
`_hasOnlyNumbers?` | undefined &#124; false &#124; true |

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*

## Properties

### range

• **range**? : *[AbsoluteCellRange](absolutecellrange.md)*

*Defined in [src/SimpleRangeValue.ts:33](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L33)*

A property that represents the address of the range.

___

### size

• **size**: *[ArraySize](arraysize.md)*

*Defined in [src/SimpleRangeValue.ts:21](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L21)*

A property that represents the size of the range.

## Accessors

### data 

• **get data**(): *InternalScalarValue[][]*

*Defined in [src/SimpleRangeValue.ts:45](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L45)*

Returns the range data as a 2D array.

**Returns:** *InternalScalarValue[][]*

## Methods

### effectiveAddressesFromData 

▸ **effectiveAddressesFromData**(`leftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *IterableIterator‹[SimpleCellAddress](../interfaces/simplecelladdress.md)›*

*Defined in [src/SimpleRangeValue.ts:125](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L125)*

Generates the addresses of the cells contained in the range assuming the provided address is the left corner of the range.

**Parameters:**

Name | Type |
------ | ------ |
`leftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *IterableIterator‹[SimpleCellAddress](../interfaces/simplecelladdress.md)›*

___

### entriesFromTopLeftCorner 

▸ **entriesFromTopLeftCorner**(`leftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *IterableIterator‹[InternalScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]›*

*Defined in [src/SimpleRangeValue.ts:139](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L139)*

Generates values and addresses of the cells contained in the range assuming the provided address is the left corner of the range.

This method combines the functionalities of [`iterateValuesFromTopLeftCorner()`](#iteratevaluesfromtopleftcorner) and [`effectiveAddressesFromData()`](#effectiveaddressesfromdata).

**Parameters:**

Name | Type |
------ | ------ |
`leftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *IterableIterator‹[InternalScalarValue, [SimpleCellAddress](../interfaces/simplecelladdress.md)]›*

___

### hasOnlyNumbers 

▸ **hasOnlyNumbers**(): *boolean*

*Defined in [src/SimpleRangeValue.ts:165](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L165)*

Returns `true` if and only if the range contains only numeric values.

**Returns:** *boolean*

___

### height 

▸ **height**(): *number*

*Defined in [src/SimpleRangeValue.ts:102](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L102)*

Returns the number of rows contained in the range.

**Returns:** *number*

___

### isAdHoc 

▸ **isAdHoc**(): *boolean*

*Defined in [src/SimpleRangeValue.ts:88](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L88)*

Returns `true` if and only if the `SimpleRangeValue` has no address set.

**Returns:** *boolean*

___

### iterateValuesFromTopLeftCorner 

▸ **iterateValuesFromTopLeftCorner**(): *IterableIterator‹InternalScalarValue›*

*Defined in [src/SimpleRangeValue.ts:151](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L151)*

Generates the values of the cells contained in the range assuming the provided address is the left corner of the range.

**Returns:** *IterableIterator‹InternalScalarValue›*

___

### numberOfElements 

▸ **numberOfElements**(): *number*

*Defined in [src/SimpleRangeValue.ts:158](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L158)*

Returns the number of cells contained in the range.

**Returns:** *number*

___

### rawData 

▸ **rawData**(): *InternalScalarValue[][]*

*Defined in [src/SimpleRangeValue.ts:196](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L196)*

Returns the range data as a 2D array.

Internal use only.

**Returns:** *InternalScalarValue[][]*

___

### rawNumbers 

▸ **rawNumbers**(): *number[][]*

*Defined in [src/SimpleRangeValue.ts:186](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L186)*

Returns the range data as a 2D array of numbers.

Internal use only.

**Returns:** *number[][]*

___

### sameDimensionsAs 

▸ **sameDimensionsAs**(`other`: [SimpleRangeValue](simplerangevalue.md)): *boolean*

*Defined in [src/SimpleRangeValue.ts:204](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L204)*

Returns `true` if and only if the range has the same width and height as the `other` range object.

**Parameters:**

Name | Type |
------ | ------ |
`other` | [SimpleRangeValue](simplerangevalue.md) |

**Returns:** *boolean*

___

### valuesFromTopLeftCorner 

▸ **valuesFromTopLeftCorner**(): *InternalScalarValue[]*

*Defined in [src/SimpleRangeValue.ts:109](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L109)*

Returns the range data as a 1D array.

**Returns:** *InternalScalarValue[]*

___

### width 

▸ **width**(): *number*

*Defined in [src/SimpleRangeValue.ts:95](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L95)*

Returns the number of columns contained in the range.

**Returns:** *number*

___

### fromRange

▸ **fromRange**(`data`: InternalScalarValue[][], `range`: [AbsoluteCellRange](absolutecellrange.md), `dependencyGraph`: DependencyGraph): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/SimpleRangeValue.ts:53](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L53)*

A factory method. Returns a `SimpleRangeValue` object with the provided range address and the provided data.

**Parameters:**

Name | Type |
------ | ------ |
`data` | InternalScalarValue[][] |
`range` | [AbsoluteCellRange](absolutecellrange.md) |
`dependencyGraph` | DependencyGraph |

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*

___

### fromScalar

▸ **fromScalar**(`scalar`: InternalScalarValue): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/SimpleRangeValue.ts:81](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L81)*

A factory method. Returns a `SimpleRangeValue` object that contains a single value.

**Parameters:**

Name | Type |
------ | ------ |
`scalar` | InternalScalarValue |

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*

___

### onlyNumbers

▸ **onlyNumbers**(`data`: number[][]): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/SimpleRangeValue.ts:60](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L60)*

A factory method. Returns a `SimpleRangeValue` object with the provided numeric data.

**Parameters:**

Name | Type |
------ | ------ |
`data` | number[][] |

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*

___

### onlyRange

▸ **onlyRange**(`range`: [AbsoluteCellRange](absolutecellrange.md), `dependencyGraph`: DependencyGraph): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/SimpleRangeValue.ts:74](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L74)*

A factory method. Returns a `SimpleRangeValue` object with the provided range address.

**Parameters:**

Name | Type |
------ | ------ |
`range` | [AbsoluteCellRange](absolutecellrange.md) |
`dependencyGraph` | DependencyGraph |

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*

___

### onlyValues

▸ **onlyValues**(`data`: InternalScalarValue[][]): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/SimpleRangeValue.ts:67](https://github.com/handsontable/hyperformula/blob/af2d59d/src/SimpleRangeValue.ts#L67)*

A factory method. Returns a `SimpleRangeValue` object with the provided data.

**Parameters:**

Name | Type |
------ | ------ |
`data` | InternalScalarValue[][] |

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*