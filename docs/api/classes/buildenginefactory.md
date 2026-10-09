# BuildEngineFactory

## Methods

### buildEmpty

▸ **buildEmpty**(`configInput`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `namedExpressions`: [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]): *[EngineState](../globals.md#enginestate)*

*Defined in [src/BuildEngineFactory.ts:66](https://github.com/handsontable/hyperformula/blob/99a45ea/src/BuildEngineFactory.ts#L66)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`configInput` | Partial‹[ConfigParams](../interfaces/configparams.md)› | {} |
`namedExpressions` | [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[] | [] |

**Returns:** *[EngineState](../globals.md#enginestate)*

___

### buildFromSheet

▸ **buildFromSheet**(`sheet`: [Sheet](../globals.md#sheet), `configInput`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `namedExpressions`: [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]): *[EngineState](../globals.md#enginestate)*

*Defined in [src/BuildEngineFactory.ts:59](https://github.com/handsontable/hyperformula/blob/99a45ea/src/BuildEngineFactory.ts#L59)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`sheet` | [Sheet](../globals.md#sheet) | - |
`configInput` | Partial‹[ConfigParams](../interfaces/configparams.md)› | {} |
`namedExpressions` | [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[] | [] |

**Returns:** *[EngineState](../globals.md#enginestate)*

___

### buildFromSheets

▸ **buildFromSheets**(`sheets`: [Sheets](../globals.md#sheets), `configInput`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `namedExpressions`: [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]): *[EngineState](../globals.md#enginestate)*

*Defined in [src/BuildEngineFactory.ts:53](https://github.com/handsontable/hyperformula/blob/99a45ea/src/BuildEngineFactory.ts#L53)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`sheets` | [Sheets](../globals.md#sheets) | - |
`configInput` | Partial‹[ConfigParams](../interfaces/configparams.md)› | {} |
`namedExpressions` | [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[] | [] |

**Returns:** *[EngineState](../globals.md#enginestate)*

___

### rebuildWithConfig

▸ **rebuildWithConfig**(`config`: [Config](config.md), `sheets`: [Sheets](../globals.md#sheets), `namedExpressions`: [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[], `stats`: [Statistics](statistics.md)): *[EngineState](../globals.md#enginestate)*

*Defined in [src/BuildEngineFactory.ts:72](https://github.com/handsontable/hyperformula/blob/99a45ea/src/BuildEngineFactory.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`sheets` | [Sheets](../globals.md#sheets) |
`namedExpressions` | [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[] |
`stats` | [Statistics](statistics.md) |

**Returns:** *[EngineState](../globals.md#enginestate)*