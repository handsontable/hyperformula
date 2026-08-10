# ConfigValueTooSmallError

Error thrown when supplied config parameter value is too small.
This error might be thrown while setting or updating the [ConfigParams](../interfaces/configparams.md).
The following methods accept [ConfigParams](../interfaces/configparams.md) as a parameter:

**`see`** [buildEmpty](buildenginefactory.md#static-buildempty)

**`see`** [buildFromArray](hyperformula.md#static-buildfromarray)

**`see`** [buildFromSheets](buildenginefactory.md#static-buildfromsheets)

**`see`** [updateConfig](hyperformula.md#updateconfig)

## Constructors

### constructor 

\+ **new ConfigValueTooSmallError**(`paramName`: string, `minimum`: number): *[ConfigValueTooSmallError](configvaluetoosmallerror.md)*

*Defined in [src/errors.ts:209](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L209)*

**Parameters:**

Name | Type |
------ | ------ |
`paramName` | string |
`minimum` | number |

**Returns:** *[ConfigValueTooSmallError](configvaluetoosmallerror.md)*

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