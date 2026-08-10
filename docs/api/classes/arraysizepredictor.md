# ArraySizePredictor

## Constructors

### constructor 

\+ **new ArraySizePredictor**(`config`: [Config](config.md), `functionRegistry`: FunctionRegistry): *[ArraySizePredictor](arraysizepredictor.md)*

*Defined in [src/ArraySize.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArraySize.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`functionRegistry` | FunctionRegistry |

**Returns:** *[ArraySizePredictor](arraysizepredictor.md)*

## Methods

### checkArraySize 

▸ **checkArraySize**(`ast`: Ast, `formulaAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[ArraySize](arraysize.md)*

*Defined in [src/ArraySize.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArraySize.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | Ast |
`formulaAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[ArraySize](arraysize.md)*

___

### checkArraySizeForAst 

▸ **checkArraySizeForAst**(`ast`: Ast, `state`: InterpreterState): *[ArraySize](arraysize.md)*

*Defined in [src/ArraySize.ts:53](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArraySize.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | Ast |
`state` | InterpreterState |

**Returns:** *[ArraySize](arraysize.md)*