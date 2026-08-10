# ChangeNamedExpressionUndoEntry

## Constructors

### constructor 

\+ **new ChangeNamedExpressionUndoEntry**(`namedExpression`: [InternalNamedExpression](internalnamedexpression.md), `newContent`: [RawCellContent](../globals.md#rawcellcontent), `oldContent`: [ClipboardCell](../globals.md#clipboardcell), `scope?`: undefined | number, `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *[ChangeNamedExpressionUndoEntry](changenamedexpressionundoentry.md)*

*Defined in [src/UndoRedo.ts:422](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L422)*

**Parameters:**

Name | Type |
------ | ------ |
`namedExpression` | [InternalNamedExpression](internalnamedexpression.md) |
`newContent` | [RawCellContent](../globals.md#rawcellcontent) |
`oldContent` | [ClipboardCell](../globals.md#clipboardcell) |
`scope?` | undefined &#124; number |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *[ChangeNamedExpressionUndoEntry](changenamedexpressionundoentry.md)*

## Properties

### namedExpression

• **namedExpression**: *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/UndoRedo.ts:424](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L424)*

___

### newContent

• **newContent**: *[RawCellContent](../globals.md#rawcellcontent)*

*Defined in [src/UndoRedo.ts:425](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L425)*

___

### oldContent

• **oldContent**: *[ClipboardCell](../globals.md#clipboardcell)*

*Defined in [src/UndoRedo.ts:426](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L426)*

___

### options

• **options**? : *[NamedExpressionOptions](../globals.md#namedexpressionoptions)*

*Defined in [src/UndoRedo.ts:428](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L428)*

___

### scope

• **scope**? : *undefined | number*

*Defined in [src/UndoRedo.ts:427](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L427)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:437](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L437)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:433](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L433)*

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