# ExpectedOneOfValuesError

Error thrown when the value was expected to be set for a config parameter.
It also displays the expected value.
This error might be thrown while setting or updating the [ConfigParams](../interfaces/configparams.md).
The following methods accept [ConfigParams](../interfaces/configparams.md) as a parameter:

**`see`** [buildEmpty](buildenginefactory.md#static-buildempty)

**`see`** [buildFromArray](hyperformula.md#static-buildfromarray)

**`see`** [buildFromSheets](buildenginefactory.md#static-buildfromsheets)

**`see`** [updateConfig](hyperformula.md#updateconfig)

## Constructors

### constructor 

\+ **new ExpectedOneOfValuesError**(`values`: string, `paramName`: string): *[ExpectedOneOfValuesError](expectedoneofvalueserror.md)*

*Defined in [src/errors.ts:242](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L242)*

**Parameters:**

Name | Type |
------ | ------ |
`values` | string |
`paramName` | string |

**Returns:** *[ExpectedOneOfValuesError](expectedoneofvalueserror.md)*

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