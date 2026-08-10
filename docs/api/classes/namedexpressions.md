# NamedExpressions

## Properties

### SHEET_FOR_WORKBOOK_EXPRESSIONS

▪ **SHEET_FOR_WORKBOOK_EXPRESSIONS**: *number* = -1

*Defined in [src/NamedExpressions.ts:127](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L127)*

## Methods

### addNamedExpression 

▸ **addNamedExpression**(`expressionName`: string, `sheetId?`: undefined | number, `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/NamedExpressions.ts:189](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L189)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)*

___

### getAllNamedExpressions 

▸ **getAllNamedExpressions**(): *object[]*

*Defined in [src/NamedExpressions.ts:251](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L251)*

**Returns:** *object[]*

___

### getAllNamedExpressionsForScope 

▸ **getAllNamedExpressionsForScope**(`scope?`: undefined | number): *[InternalNamedExpression](internalnamedexpression.md)[]*

*Defined in [src/NamedExpressions.ts:273](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L273)*

**Parameters:**

Name | Type |
------ | ------ |
`scope?` | undefined &#124; number |

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)[]*

___

### getAllNamedExpressionsNames 

▸ **getAllNamedExpressionsNames**(): *string[]*

*Defined in [src/NamedExpressions.ts:247](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L247)*

**Returns:** *string[]*

___

### getAllNamedExpressionsNamesInScope 

▸ **getAllNamedExpressionsNamesInScope**(`sheetId?`: undefined | number): *string[]*

*Defined in [src/NamedExpressions.ts:243](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L243)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId?` | undefined &#124; number |

**Returns:** *string[]*

___

### isExpressionInScope 

▸ **isExpressionInScope**(`expressionName`: string, `sheetId`: number): *boolean*

*Defined in [src/NamedExpressions.ts:162](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L162)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId` | number |

**Returns:** *boolean*

___

### isNameAvailable 

▸ **isNameAvailable**(`expressionName`: string, `sheetId?`: undefined | number): *boolean*

*Defined in [src/NamedExpressions.ts:133](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |

**Returns:** *boolean*

___

### isNameValid 

▸ **isNameValid**(`expressionName`: string): *boolean*

*Defined in [src/NamedExpressions.ts:177](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L177)*

Checks the validity of a named-expression's name.

The name:
- Must start with a Unicode letter or with an underscore (`_`).
- Can contain only Unicode letters, numbers, underscores, and periods (`.`).
- Can't be the same as any possible reference in the A1 notation (`[A-Za-z]+[0-9]+`).
- Can't be the same as any possible reference in the R1C1 notation (`[rR][0-9]*[cC][0-9]*`).

The naming rules follow the [OpenDocument](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html#__RefHeading__1017964_715980110) standard.

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *boolean*

___

### namedExpressionForScope 

▸ **namedExpressionForScope**(`expressionName`: string, `sheetId?`: undefined | number): *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

*Defined in [src/NamedExpressions.ts:150](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |

**Returns:** *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

___

### namedExpressionInAddress 

▸ **namedExpressionInAddress**(`row`: number): *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

*Defined in [src/NamedExpressions.ts:141](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`row` | number |

**Returns:** *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

___

### namedExpressionOrPlaceholder 

▸ **namedExpressionOrPlaceholder**(`expressionName`: string, `sheetId`: number): *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/NamedExpressions.ts:212](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId` | number |

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)*

___

### nearestNamedExpression 

▸ **nearestNamedExpression**(`expressionName`: string, `sheetId`: number): *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

*Defined in [src/NamedExpressions.ts:158](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId` | number |

**Returns:** *[Maybe](../globals.md#maybe)‹[InternalNamedExpression](internalnamedexpression.md)›*

___

### remove 

▸ **remove**(`expressionName`: string, `sheetId?`: undefined | number): *void*

*Defined in [src/NamedExpressions.ts:225](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L225)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |

**Returns:** *void*

___

### restoreNamedExpression 

▸ **restoreNamedExpression**(`namedExpression`: [InternalNamedExpression](internalnamedexpression.md), `sheetId?`: undefined | number): *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/NamedExpressions.ts:204](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L204)*

**Parameters:**

Name | Type |
------ | ------ |
`namedExpression` | [InternalNamedExpression](internalnamedexpression.md) |
`sheetId?` | undefined &#124; number |

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)*

___

### workbookNamedExpressionOrPlaceholder 

▸ **workbookNamedExpressionOrPlaceholder**(`expressionName`: string): *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/NamedExpressions.ts:216](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L216)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)*