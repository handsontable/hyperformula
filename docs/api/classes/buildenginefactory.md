# BuildEngineFactory

## Methods

### buildEmpty

▸ **buildEmpty**(`configInput`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `namedExpressions`: [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]): *[EngineState](../globals.md#enginestate)*

*Defined in [src/BuildEngineFactory.ts:62](https://github.com/handsontable/hyperformula/blob/af2d59d/src/BuildEngineFactory.ts#L62)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`configInput` | Partial‹[ConfigParams](../interfaces/configparams.md)› | {} |
`namedExpressions` | [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[] | [] |

**Returns:** *[EngineState](../globals.md#enginestate)*

___

### buildFromSheet

▸ **buildFromSheet**(`sheet`: [Sheet](../globals.md#sheet), `configInput`: Partial‹[ConfigParams](../interfaces/configparams.md)›, `namedExpressions`: [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]): *[EngineState](../globals.md#enginestate)*

*Defined in [src/BuildEngineFactory.ts:56](https://github.com/handsontable/hyperformula/blob/af2d59d/src/BuildEngineFactory.ts#L56)*

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

*Defined in [src/BuildEngineFactory.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/BuildEngineFactory.ts#L51)*

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

*Defined in [src/BuildEngineFactory.ts:66](https://github.com/handsontable/hyperformula/blob/af2d59d/src/BuildEngineFactory.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`sheets` | [Sheets](../globals.md#sheets) |
`namedExpressions` | [SerializedNamedExpression](../interfaces/serializednamedexpression.md)[] |
`stats` | [Statistics](statistics.md) |

**Returns:** *[EngineState](../globals.md#enginestate)*