# ProtectedFunctionError

Error thrown when trying to register, override or remove function with reserved id.

**`see`** [registerFunctionPlugin](hyperformula.md#static-registerfunctionplugin)

**`see`** [registerFunction](hyperformula.md#static-registerfunction)

**`see`** [unregisterFunction](hyperformula.md#static-unregisterfunction)

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

### cannotRegisterFunctionWithId

▸ **cannotRegisterFunctionWithId**(`functionId`: string): *[ProtectedFunctionError](protectedfunctionerror.md)*

*Defined in [src/errors.ts:336](https://github.com/handsontable/hyperformula/blob/99a45ea/src/errors.ts#L336)*

**Parameters:**

Name | Type |
------ | ------ |
`functionId` | string |

**Returns:** *[ProtectedFunctionError](protectedfunctionerror.md)*

___

### cannotUnregisterFunctionWithId

▸ **cannotUnregisterFunctionWithId**(`functionId`: string): *[ProtectedFunctionError](protectedfunctionerror.md)*

*Defined in [src/errors.ts:340](https://github.com/handsontable/hyperformula/blob/99a45ea/src/errors.ts#L340)*

**Parameters:**

Name | Type |
------ | ------ |
`functionId` | string |

**Returns:** *[ProtectedFunctionError](protectedfunctionerror.md)*

___

### cannotUnregisterProtectedPlugin

▸ **cannotUnregisterProtectedPlugin**(): *[ProtectedFunctionError](protectedfunctionerror.md)*

*Defined in [src/errors.ts:344](https://github.com/handsontable/hyperformula/blob/99a45ea/src/errors.ts#L344)*

**Returns:** *[ProtectedFunctionError](protectedfunctionerror.md)*