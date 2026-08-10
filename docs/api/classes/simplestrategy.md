# SimpleStrategy

## Constructors

### constructor 

\+ **new SimpleStrategy**(`dependencyGraph`: DependencyGraph, `columnIndex`: [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md), `parser`: ParserWithCaching, `stats`: [Statistics](statistics.md), `cellContentParser`: [CellContentParser](cellcontentparser.md), `arraySizePredictor`: [ArraySizePredictor](arraysizepredictor.md)): *[SimpleStrategy](simplestrategy.md)*

*Defined in [src/GraphBuilder.ts:67](https://github.com/handsontable/hyperformula/blob/af2d59d/src/GraphBuilder.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |
`columnIndex` | [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md) |
`parser` | ParserWithCaching |
`stats` | [Statistics](statistics.md) |
`cellContentParser` | [CellContentParser](cellcontentparser.md) |
`arraySizePredictor` | [ArraySizePredictor](arraysizepredictor.md) |

**Returns:** *[SimpleStrategy](simplestrategy.md)*

## Methods

### run 

▸ **run**(`sheets`: [Sheets](../globals.md#sheets)): *[Dependencies](../globals.md#dependencies)*

*Defined in [src/GraphBuilder.ts:78](https://github.com/handsontable/hyperformula/blob/af2d59d/src/GraphBuilder.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`sheets` | [Sheets](../globals.md#sheets) |

**Returns:** *[Dependencies](../globals.md#dependencies)*