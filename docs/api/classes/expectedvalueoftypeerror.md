# ExpectedValueOfTypeError

Error thrown when the expected value type differs from the given value type.
It also displays the expected type.
This error might be thrown while setting or updating the [ConfigParams](../interfaces/configparams.md).
The following methods accept [ConfigParams](../interfaces/configparams.md) as a parameter:

**`see`** [buildEmpty](buildenginefactory.md#static-buildempty)

**`see`** [buildFromArray](hyperformula.md#static-buildfromarray)

**`see`** [buildFromSheets](buildenginefactory.md#static-buildfromsheets)

**`see`** [updateConfig](hyperformula.md#updateconfig)

## Constructors

### constructor 

\+ **new ExpectedValueOfTypeError**(`expectedType`: string, `paramName`: string): *[ExpectedValueOfTypeError](expectedvalueoftypeerror.md)*

*Defined in [src/errors.ts:177](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L177)*

**Parameters:**

Name | Type |
------ | ------ |
`expectedType` | string |
`paramName` | string |

**Returns:** *[ExpectedValueOfTypeError](expectedvalueoftypeerror.md)*

## Properties

### message 

• **message**: *string*

___

### name 

• **name**: *string*

___

### stack

• **stack**? : *undefined | string*

___

### Error

▪ **Error**: *ErrorConstructor*