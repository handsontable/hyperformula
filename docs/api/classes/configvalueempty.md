# ConfigValueEmpty

Error thrown when supplied config parameter value is an empty string.
This error might be thrown while setting or updating the [ConfigParams](../interfaces/configparams.md).
The following methods accept [ConfigParams](../interfaces/configparams.md) as a parameter:

**`see`** [buildEmpty](buildenginefactory.md#static-buildempty)

**`see`** [buildFromArray](hyperformula.md#static-buildfromarray)

**`see`** [buildFromSheets](buildenginefactory.md#static-buildfromsheets)

**`see`** [updateConfig](hyperformula.md#updateconfig)

## Constructors

### constructor 

\+ **new ConfigValueEmpty**(`paramName`: string): *[ConfigValueEmpty](configvalueempty.md)*

*Defined in [src/errors.ts:193](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L193)*

**Parameters:**

Name | Type |
------ | ------ |
`paramName` | string |

**Returns:** *[ConfigValueEmpty](configvalueempty.md)*

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