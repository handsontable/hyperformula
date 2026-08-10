# WorksheetStore

## Properties

### mapping

• **mapping**: *Map‹string, [InternalNamedExpression](internalnamedexpression.md)‹››* = new Map<string, InternalNamedExpression>()

*Defined in [src/NamedExpressions.ts:90](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L90)*

## Methods

### add 

▸ **add**(`namedExpression`: [InternalNamedExpression](internalnamedexpression.md)): *void*

*Defined in [src/NamedExpressions.ts:92](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`namedExpression` | [InternalNamedExpression](internalnamedexpression.md) |

**Returns:** *void*

___

### get 

▸ **get**(`expressionName`: string): *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

*Defined in [src/NamedExpressions.ts:96](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

___

### getAllNamedExpressions 

▸ **getAllNamedExpressions**(): *[InternalNamedExpression](internalnamedexpression.md)[]*

*Defined in [src/NamedExpressions.ts:104](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L104)*

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)[]*

___

### has 

▸ **has**(`expressionName`: string): *boolean*

*Defined in [src/NamedExpressions.ts:100](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *boolean*

___

### isNameAvailable 

▸ **isNameAvailable**(`expressionName`: string): *boolean*

*Defined in [src/NamedExpressions.ts:108](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *boolean*

___

### remove 

▸ **remove**(`expressionName`: string): *void*

*Defined in [src/NamedExpressions.ts:113](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *void*