# RemoveNamedExpressionUndoEntry

## Constructors

### constructor 

\+ **new RemoveNamedExpressionUndoEntry**(`namedExpression`: [InternalNamedExpression](internalnamedexpression.md), `content`: [ClipboardCell](../globals.md#clipboardcell), `scope?`: undefined | number): *[RemoveNamedExpressionUndoEntry](removenamedexpressionundoentry.md)*

*Defined in [src/UndoRedo.ts:404](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L404)*

**Parameters:**

Name | Type |
------ | ------ |
`namedExpression` | [InternalNamedExpression](internalnamedexpression.md) |
`content` | [ClipboardCell](../globals.md#clipboardcell) |
`scope?` | undefined &#124; number |

**Returns:** *[RemoveNamedExpressionUndoEntry](removenamedexpressionundoentry.md)*

## Properties

### content

• **content**: *[ClipboardCell](../globals.md#clipboardcell)*

*Defined in [src/UndoRedo.ts:407](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L407)*

___

### namedExpression

• **namedExpression**: *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/UndoRedo.ts:406](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L406)*

___

### scope

• **scope**? : *undefined | number*

*Defined in [src/UndoRedo.ts:408](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L408)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:417](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L417)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:413](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L413)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L42)*

Returns LazilyTransformingAstService version keys referenced by this entry's oldData.
Default implementation returns empty — override in entries that store oldData.

**Returns:** *number[]*