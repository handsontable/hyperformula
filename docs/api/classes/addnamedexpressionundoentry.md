# AddNamedExpressionUndoEntry

## Constructors

### constructor 

\+ **new AddNamedExpressionUndoEntry**(`name`: string, `newContent`: [RawCellContent](../globals.md#rawcellcontent), `scope?`: undefined | number, `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *[AddNamedExpressionUndoEntry](addnamedexpressionundoentry.md)*

*Defined in [src/UndoRedo.ts:385](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L385)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`newContent` | [RawCellContent](../globals.md#rawcellcontent) |
`scope?` | undefined &#124; number |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *[AddNamedExpressionUndoEntry](addnamedexpressionundoentry.md)*

## Properties

### name

• **name**: *string*

*Defined in [src/UndoRedo.ts:387](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L387)*

___

### newContent

• **newContent**: *[RawCellContent](../globals.md#rawcellcontent)*

*Defined in [src/UndoRedo.ts:388](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L388)*

___

### options

• **options**? : *[NamedExpressionOptions](../globals.md#namedexpressionoptions)*

*Defined in [src/UndoRedo.ts:390](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L390)*

___

### scope

• **scope**? : *undefined | number*

*Defined in [src/UndoRedo.ts:389](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L389)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:399](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L399)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:395](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L395)*

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