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

*Defined in [src/errors.ts:334](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L334)*

**Parameters:**

Name | Type |
------ | ------ |
`functionId` | string |

**Returns:** *[ProtectedFunctionError](protectedfunctionerror.md)*

___

### cannotUnregisterFunctionWithId

▸ **cannotUnregisterFunctionWithId**(`functionId`: string): *[ProtectedFunctionError](protectedfunctionerror.md)*

*Defined in [src/errors.ts:338](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L338)*

**Parameters:**

Name | Type |
------ | ------ |
`functionId` | string |

**Returns:** *[ProtectedFunctionError](protectedfunctionerror.md)*

___

### cannotUnregisterProtectedPlugin

▸ **cannotUnregisterProtectedPlugin**(): *[ProtectedFunctionError](protectedfunctionerror.md)*

*Defined in [src/errors.ts:342](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L342)*

**Returns:** *[ProtectedFunctionError](protectedfunctionerror.md)*