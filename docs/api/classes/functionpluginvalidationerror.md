# FunctionPluginValidationError

Error thrown when function plugin is invalid.

**`see`** [registerFunction](hyperformula.md#static-registerfunction)

**`see`** [registerFunctionPlugin](hyperformula.md#static-registerfunctionplugin)

**`see`** [buildFromArray](hyperformula.md#static-buildfromarray)

**`see`** [buildFromSheets](buildenginefactory.md#static-buildfromsheets)

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

## Methods

### functionMethodNotFound

▸ **functionMethodNotFound**(`functionName`: string, `pluginName`: string): *[FunctionPluginValidationError](functionpluginvalidationerror.md)*

*Defined in [src/errors.ts:321](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L321)*

**Parameters:**

Name | Type |
------ | ------ |
`functionName` | string |
`pluginName` | string |

**Returns:** *[FunctionPluginValidationError](functionpluginvalidationerror.md)*

___

### functionNotDeclaredInPlugin

▸ **functionNotDeclaredInPlugin**(`functionId`: string, `pluginName`: string): *[FunctionPluginValidationError](functionpluginvalidationerror.md)*

*Defined in [src/errors.ts:317](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L317)*

**Parameters:**

Name | Type |
------ | ------ |
`functionId` | string |
`pluginName` | string |

**Returns:** *[FunctionPluginValidationError](functionpluginvalidationerror.md)*