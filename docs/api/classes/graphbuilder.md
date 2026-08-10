# GraphBuilder

Service building the graph and mappings.

## Constructors

### constructor 

\+ **new GraphBuilder**(`dependencyGraph`: DependencyGraph, `columnSearch`: [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md), `parser`: ParserWithCaching, `cellContentParser`: [CellContentParser](cellcontentparser.md), `stats`: [Statistics](statistics.md), `arraySizePredictor`: [ArraySizePredictor](arraysizepredictor.md)): *[GraphBuilder](graphbuilder.md)*

*Defined in [src/GraphBuilder.ts:31](https://github.com/handsontable/hyperformula/blob/af2d59d/src/GraphBuilder.ts#L31)*

Configures the building service.

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |
`columnSearch` | [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md) |
`parser` | ParserWithCaching |
`cellContentParser` | [CellContentParser](cellcontentparser.md) |
`stats` | [Statistics](statistics.md) |
`arraySizePredictor` | [ArraySizePredictor](arraysizepredictor.md) |

**Returns:** *[GraphBuilder](graphbuilder.md)*

## Methods

### buildGraph 

▸ **buildGraph**(`sheets`: [Sheets](../globals.md#sheets), `stats`: [Statistics](statistics.md)): *void*

*Defined in [src/GraphBuilder.ts:50](https://github.com/handsontable/hyperformula/blob/af2d59d/src/GraphBuilder.ts#L50)*

Builds graph.

**Parameters:**

Name | Type |
------ | ------ |
`sheets` | [Sheets](../globals.md#sheets) |
`stats` | [Statistics](statistics.md) |

**Returns:** *void*