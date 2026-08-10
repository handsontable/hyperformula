# Exporter

## Constructors

### constructor 

\+ **new Exporter**(`config`: [Config](config.md), `namedExpressions`: [NamedExpressions](namedexpressions.md), `sheetMapping`: SheetMapping, `lazilyTransformingService`: [LazilyTransformingAstService](lazilytransformingastservice.md)): *[Exporter](exporter.md)*

*Defined in [src/Exporter.ts:55](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`namedExpressions` | [NamedExpressions](namedexpressions.md) |
`sheetMapping` | SheetMapping |
`lazilyTransformingService` | [LazilyTransformingAstService](lazilytransformingastservice.md) |

**Returns:** *[Exporter](exporter.md)*

## Methods

### exportChange 

▸ **exportChange**(`change`: [CellValueChange](../interfaces/cellvaluechange.md)): *[ExportedChange](../globals.md#exportedchange) | [ExportedChange](../globals.md#exportedchange)[]*

*Defined in [src/Exporter.ts:64](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`change` | [CellValueChange](../interfaces/cellvaluechange.md) |

**Returns:** *[ExportedChange](../globals.md#exportedchange) | [ExportedChange](../globals.md#exportedchange)[]*

___

### exportScalarOrRange 

▸ **exportScalarOrRange**(`value`: InterpreterValue): *[CellValue](../globals.md#cellvalue) | [CellValue](../globals.md#cellvalue)[][]*

*Defined in [src/Exporter.ts:108](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | InterpreterValue |

**Returns:** *[CellValue](../globals.md#cellvalue) | [CellValue](../globals.md#cellvalue)[][]*

___

### exportValue 

▸ **exportValue**(`value`: InterpreterValue): *[CellValue](../globals.md#cellvalue)*

*Defined in [src/Exporter.ts:94](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | InterpreterValue |

**Returns:** *[CellValue](../globals.md#cellvalue)*