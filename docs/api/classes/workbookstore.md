# WorkbookStore

## Methods

### add 

▸ **add**(`namedExpression`: [InternalNamedExpression](internalnamedexpression.md)): *void*

*Defined in [src/NamedExpressions.ts:55](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`namedExpression` | [InternalNamedExpression](internalnamedexpression.md) |

**Returns:** *void*

___

### get 

▸ **get**(`expressionName`: string): *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

*Defined in [src/NamedExpressions.ts:59](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

___

### getAllNamedExpressions 

▸ **getAllNamedExpressions**(): *[InternalNamedExpression](internalnamedexpression.md)[]*

*Defined in [src/NamedExpressions.ts:80](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L80)*

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)[]*

___

### getExisting 

▸ **getExisting**(`expressionName`: string): *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

*Defined in [src/NamedExpressions.ts:63](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

___

### has 

▸ **has**(`expressionName`: string): *boolean*

*Defined in [src/NamedExpressions.ts:45](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *boolean*

___

### isNameAvailable 

▸ **isNameAvailable**(`expressionName`: string): *boolean*

*Defined in [src/NamedExpressions.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *boolean*

___

### remove 

▸ **remove**(`expressionName`: string): *void*

*Defined in [src/NamedExpressions.ts:72](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *void*