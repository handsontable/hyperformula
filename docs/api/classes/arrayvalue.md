# ArrayValue

## Constructors

### constructor 

\+ **new ArrayValue**(`array`: InternalScalarValue[][]): *[ArrayValue](arrayvalue.md)*

*Defined in [src/ArrayValue.ts:47](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`array` | InternalScalarValue[][] |

**Returns:** *[ArrayValue](arrayvalue.md)*

## Properties

### size 

• **size**: *[ArraySize](arraysize.md)*

*Defined in [src/ArrayValue.ts:46](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L46)*

## Methods

### addColumns 

▸ **addColumns**(`aboveColumn`: number, `numberOfColumns`: number): *void*

*Defined in [src/ArrayValue.ts:75](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`aboveColumn` | number |
`numberOfColumns` | number |

**Returns:** *void*

___

### addRows 

▸ **addRows**(`aboveRow`: number, `numberOfRows`: number): *void*

*Defined in [src/ArrayValue.ts:70](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`aboveRow` | number |
`numberOfRows` | number |

**Returns:** *void*

___

### get 

▸ **get**(`col`: number, `row`: number): *InternalScalarValue*

*Defined in [src/ArrayValue.ts:110](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`col` | number |
`row` | number |

**Returns:** *InternalScalarValue*

___

### height 

▸ **height**(): *number*

*Defined in [src/ArrayValue.ts:128](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L128)*

**Returns:** *number*

___

### nullArrays 

▸ **nullArrays**(`count`: number, `size`: number): *any[][]*

*Defined in [src/ArrayValue.ts:102](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`count` | number |
`size` | number |

**Returns:** *any[][]*

___

### raw 

▸ **raw**(): *InternalScalarValue[][]*

*Defined in [src/ArrayValue.ts:132](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L132)*

**Returns:** *InternalScalarValue[][]*

___

### removeColumns 

▸ **removeColumns**(`leftmostColumn`: number, `rightmostColumn`: number): *void*

*Defined in [src/ArrayValue.ts:91](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`leftmostColumn` | number |
`rightmostColumn` | number |

**Returns:** *void*

___

### removeRows 

▸ **removeRows**(`startRow`: number, `endRow`: number): *void*

*Defined in [src/ArrayValue.ts:82](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`startRow` | number |
`endRow` | number |

**Returns:** *void*

___

### resize 

▸ **resize**(`newSize`: [ArraySize](arraysize.md)): *void*

*Defined in [src/ArrayValue.ts:136](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L136)*

**Parameters:**

Name | Type |
------ | ------ |
`newSize` | [ArraySize](arraysize.md) |

**Returns:** *void*

___

### set 

▸ **set**(`col`: number, `row`: number, `value`: number): *void*

*Defined in [src/ArrayValue.ts:117](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`col` | number |
`row` | number |
`value` | number |

**Returns:** *void*

___

### simpleRangeValue 

▸ **simpleRangeValue**(): *[SimpleRangeValue](simplerangevalue.md)*

*Defined in [src/ArrayValue.ts:66](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L66)*

**Returns:** *[SimpleRangeValue](simplerangevalue.md)*

___

### width 

▸ **width**(): *number*

*Defined in [src/ArrayValue.ts:124](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L124)*

**Returns:** *number*

___

### fromInterpreterValue

▸ **fromInterpreterValue**(`value`: InterpreterValue): *[ArrayValue](arrayvalue.md)‹›*

*Defined in [src/ArrayValue.ts:58](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArrayValue.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | InterpreterValue |

**Returns:** *[ArrayValue](arrayvalue.md)‹›*