# Evaluator

## Constructors

### constructor 

\+ **new Evaluator**(`config`: [Config](config.md), `stats`: [Statistics](statistics.md), `interpreter`: Interpreter, `lazilyTransformingAstService`: [LazilyTransformingAstService](lazilytransformingastservice.md), `dependencyGraph`: DependencyGraph, `columnSearch`: [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md)): *[Evaluator](evaluator.md)*

*Defined in [src/Evaluator.ts:22](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Evaluator.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`stats` | [Statistics](statistics.md) |
`interpreter` | Interpreter |
`lazilyTransformingAstService` | [LazilyTransformingAstService](lazilytransformingastservice.md) |
`dependencyGraph` | DependencyGraph |
`columnSearch` | [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md) |

**Returns:** *[Evaluator](evaluator.md)*

## Properties

### interpreter

• **interpreter**: *Interpreter*

*Defined in [src/Evaluator.ts:27](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Evaluator.ts#L27)*

## Methods

### partialRun 

▸ **partialRun**(`vertices`: Vertex[]): *[ContentChanges](contentchanges.md)*

*Defined in [src/Evaluator.ts:44](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Evaluator.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`vertices` | Vertex[] |

**Returns:** *[ContentChanges](contentchanges.md)*

___

### run 

▸ **run**(): *void*

*Defined in [src/Evaluator.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Evaluator.ts#L34)*

**Returns:** *void*

___

### runAndForget 

▸ **runAndForget**(`ast`: Ast, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `dependencies`: RelativeDependency[]): *InterpreterValue*

*Defined in [src/Evaluator.ts:56](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Evaluator.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | Ast |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`dependencies` | RelativeDependency[] |

**Returns:** *InterpreterValue*