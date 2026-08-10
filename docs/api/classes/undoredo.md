# UndoRedo

Manages undo/redo stacks for all spreadsheet operations.

## oldData: Preserving Formula ASTs Across Irreversible Transformations

Some structural operations (e.g., removing rows/columns, moving cells) destroy
formula information that cannot be reconstructed from the transformation alone.
For example, when a row is removed, formulas referencing that row are rewritten
to `#REF!` — an irreversible change.

To support undo of such operations, `oldData` stores snapshots of formula AST
hashes keyed by the LazilyTransformingAstService version at which the irreversible
transformation was applied. Each entry maps a version number to an array of
`[cellAddress, astHash]` pairs that can be used to restore the original formula
from the parser cache.

### Memory Management

Without cleanup, `oldData` grows indefinitely as undo entries are evicted but
their oldData keys remain. Three mechanisms prevent this:

1. **Eviction cleanup**: When undo entries are evicted (due to `undoLimit`),
   `cleanupOldDataForEntries()` deletes their referenced oldData keys
   (unless still needed by entries on the other stack).
2. **Orphan cleanup**: Compaction may force lazy formula evaluation, which
   writes new oldData entries for already-evicted undo entries. After compaction,
   `cleanupOrphanedOldData()` removes any keys not referenced by entries on
   either stack or the in-progress batch.
3. **Short-circuit**: When `undoLimit` is 0 (undo disabled),
   `storeDataForVersion()` returns immediately to avoid storing data that
   would never be used.

## Constructors

### constructor 

\+ **new UndoRedo**(`config`: [Config](config.md), `operations`: [Operations](operations.md)): *[UndoRedo](undoredo.md)*

*Defined in [src/UndoRedo.ts:505](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L505)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`operations` | [Operations](operations.md) |

**Returns:** *[UndoRedo](undoredo.md)*

## Properties

### oldData 

• **oldData**: *Map‹number, [[SimpleCellAddress](../interfaces/simplecelladdress.md), string][]›* = new Map()

*Defined in [src/UndoRedo.ts:501](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L501)*

## Methods

### beginBatchMode 

▸ **beginBatchMode**(): *void*

*Defined in [src/UndoRedo.ts:522](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L522)*

**Returns:** *void*

___

### cleanupOrphanedOldData 

▸ **cleanupOrphanedOldData**(): *void*

*Defined in [src/UndoRedo.ts:880](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L880)*

Removes oldData entries whose version keys are not referenced by any
entry on the undo stack, redo stack, or in-progress batch. Called after
compaction forces lazy formula evaluation, which may insert oldData for
already-evicted entries.

**Returns:** *void*

___

### clearRedoStack 

▸ **clearRedoStack**(): *void*

*Defined in [src/UndoRedo.ts:550](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L550)*

Clears the redo stack and removes oldData entries no longer referenced by any remaining entry.

**Returns:** *void*

___

### clearUndoStack 

▸ **clearUndoStack**(): *void*

*Defined in [src/UndoRedo.ts:556](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L556)*

Clears the undo stack and removes oldData entries no longer referenced by any remaining entry.

**Returns:** *void*

___

### commitBatchMode 

▸ **commitBatchMode**(): *void*

*Defined in [src/UndoRedo.ts:526](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L526)*

**Returns:** *void*

___

### isRedoStackEmpty 

▸ **isRedoStackEmpty**(): *boolean*

*Defined in [src/UndoRedo.ts:565](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L565)*

**Returns:** *boolean*

___

### isUndoStackEmpty 

▸ **isUndoStackEmpty**(): *boolean*

*Defined in [src/UndoRedo.ts:561](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L561)*

**Returns:** *boolean*

___

### redo 

▸ **redo**(): *void*

*Defined in [src/UndoRedo.ts:756](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L756)*

**Returns:** *void*

___

### redoAddColumns 

▸ **redoAddColumns**(`operation`: [AddColumnsUndoEntry](addcolumnsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:808](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L808)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddColumnsUndoEntry](addcolumnsundoentry.md) |

**Returns:** *void*

___

### redoAddNamedExpression 

▸ **redoAddNamedExpression**(`operation`: [AddNamedExpressionUndoEntry](addnamedexpressionundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:841](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L841)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddNamedExpressionUndoEntry](addnamedexpressionundoentry.md) |

**Returns:** *void*

___

### redoAddRows 

▸ **redoAddRows**(`operation`: [AddRowsUndoEntry](addrowsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:804](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L804)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddRowsUndoEntry](addrowsundoentry.md) |

**Returns:** *void*

___

### redoAddSheet 

▸ **redoAddSheet**(`operation`: [AddSheetUndoEntry](addsheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:816](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L816)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddSheetUndoEntry](addsheetundoentry.md) |

**Returns:** *void*

___

### redoBatch 

▸ **redoBatch**(`batchOperation`: [BatchUndoEntry](batchundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:768](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L768)*

**Parameters:**

Name | Type |
------ | ------ |
`batchOperation` | [BatchUndoEntry](batchundoentry.md) |

**Returns:** *void*

___

### redoChangeNamedExpression 

▸ **redoChangeNamedExpression**(`operation`: [ChangeNamedExpressionUndoEntry](changenamedexpressionundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:849](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L849)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [ChangeNamedExpressionUndoEntry](changenamedexpressionundoentry.md) |

**Returns:** *void*

___

### redoClearSheet 

▸ **redoClearSheet**(`operation`: [ClearSheetUndoEntry](clearsheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:832](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L832)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [ClearSheetUndoEntry](clearsheetundoentry.md) |

**Returns:** *void*

___

### redoMoveCells 

▸ **redoMoveCells**(`operation`: [MoveCellsUndoEntry](movecellsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:778](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L778)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [MoveCellsUndoEntry](movecellsundoentry.md) |

**Returns:** *void*

___

### redoMoveColumns 

▸ **redoMoveColumns**(`operation`: [MoveColumnsUndoEntry](movecolumnsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:828](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L828)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [MoveColumnsUndoEntry](movecolumnsundoentry.md) |

**Returns:** *void*

___

### redoMoveRows 

▸ **redoMoveRows**(`operation`: [MoveRowsUndoEntry](moverowsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:824](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L824)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [MoveRowsUndoEntry](moverowsundoentry.md) |

**Returns:** *void*

___

### redoPaste 

▸ **redoPaste**(`operation`: [PasteUndoEntry](pasteundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:786](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L786)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [PasteUndoEntry](pasteundoentry.md) |

**Returns:** *void*

___

### redoRemoveColumns 

▸ **redoRemoveColumns**(`operation`: [RemoveColumnsUndoEntry](removecolumnsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:782](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L782)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveColumnsUndoEntry](removecolumnsundoentry.md) |

**Returns:** *void*

___

### redoRemoveNamedExpression 

▸ **redoRemoveNamedExpression**(`operation`: [RemoveNamedExpressionUndoEntry](removenamedexpressionundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:845](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L845)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveNamedExpressionUndoEntry](removenamedexpressionundoentry.md) |

**Returns:** *void*

___

### redoRemoveRows 

▸ **redoRemoveRows**(`operation`: [RemoveRowsUndoEntry](removerowsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:774](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L774)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveRowsUndoEntry](removerowsundoentry.md) |

**Returns:** *void*

___

### redoRemoveSheet 

▸ **redoRemoveSheet**(`operation`: [RemoveSheetUndoEntry](removesheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:812](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L812)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveSheetUndoEntry](removesheetundoentry.md) |

**Returns:** *void*

___

### redoRenameSheet 

▸ **redoRenameSheet**(`operation`: [RenameSheetUndoEntry](renamesheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:820](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L820)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RenameSheetUndoEntry](renamesheetundoentry.md) |

**Returns:** *void*

___

### redoSetCellContents 

▸ **redoSetCellContents**(`operation`: [SetCellContentsUndoEntry](setcellcontentsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:798](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L798)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetCellContentsUndoEntry](setcellcontentsundoentry.md) |

**Returns:** *void*

___

### redoSetColumnOrder 

▸ **redoSetColumnOrder**(`operation`: [SetColumnOrderUndoEntry](setcolumnorderundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:857](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L857)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetColumnOrderUndoEntry](setcolumnorderundoentry.md) |

**Returns:** *void*

___

### redoSetRowOrder 

▸ **redoSetRowOrder**(`operation`: [SetRowOrderUndoEntry](setroworderundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:853](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L853)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetRowOrderUndoEntry](setroworderundoentry.md) |

**Returns:** *void*

___

### redoSetSheetContent 

▸ **redoSetSheetContent**(`operation`: [SetSheetContentUndoEntry](setsheetcontentundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:836](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L836)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetSheetContentUndoEntry](setsheetcontentundoentry.md) |

**Returns:** *void*

___

### saveOperation 

▸ **saveOperation**(`operation`: [UndoEntry](../interfaces/undoentry.md)): *void*

*Defined in [src/UndoRedo.ts:514](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L514)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [UndoEntry](../interfaces/undoentry.md) |

**Returns:** *void*

___

### storeDataForVersion 

▸ **storeDataForVersion**(`version`: number, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `astHash`: string): *void*

*Defined in [src/UndoRedo.ts:538](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L538)*

Stores a formula AST hash snapshot for the given LazilyTransformingAstService version.
Skipped when `undoLimit` is 0 (undo disabled) to avoid storing data that would never be used.

**Parameters:**

Name | Type |
------ | ------ |
`version` | number |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`astHash` | string |

**Returns:** *void*

___

### undo 

▸ **undo**(): *void*

*Defined in [src/UndoRedo.ts:569](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L569)*

**Returns:** *void*

___

### undoAddColumns 

▸ **undoAddColumns**(`operation`: [AddColumnsUndoEntry](addcolumnsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:626](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L626)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddColumnsUndoEntry](addcolumnsundoentry.md) |

**Returns:** *void*

___

### undoAddNamedExpression 

▸ **undoAddNamedExpression**(`operation`: [AddNamedExpressionUndoEntry](addnamedexpressionundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:736](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L736)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddNamedExpressionUndoEntry](addnamedexpressionundoentry.md) |

**Returns:** *void*

___

### undoAddRows 

▸ **undoAddRows**(`operation`: [AddRowsUndoEntry](addrowsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:618](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L618)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddRowsUndoEntry](addrowsundoentry.md) |

**Returns:** *void*

___

### undoAddSheet 

▸ **undoAddSheet**(`operation`: [AddSheetUndoEntry](addsheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:678](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L678)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [AddSheetUndoEntry](addsheetundoentry.md) |

**Returns:** *void*

___

### undoBatch 

▸ **undoBatch**(`batchOperation`: [BatchUndoEntry](batchundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:580](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L580)*

**Parameters:**

Name | Type |
------ | ------ |
`batchOperation` | [BatchUndoEntry](batchundoentry.md) |

**Returns:** *void*

___

### undoChangeNamedExpression 

▸ **undoChangeNamedExpression**(`operation`: [ChangeNamedExpressionUndoEntry](changenamedexpressionundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:744](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L744)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [ChangeNamedExpressionUndoEntry](changenamedexpressionundoentry.md) |

**Returns:** *void*

___

### undoClearSheet 

▸ **undoClearSheet**(`operation`: [ClearSheetUndoEntry](clearsheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:711](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L711)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [ClearSheetUndoEntry](clearsheetundoentry.md) |

**Returns:** *void*

___

### undoMoveCells 

▸ **undoMoveCells**(`operation`: [MoveCellsUndoEntry](movecellsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:666](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L666)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [MoveCellsUndoEntry](movecellsundoentry.md) |

**Returns:** *void*

___

### undoMoveColumns 

▸ **undoMoveColumns**(`operation`: [MoveColumnsUndoEntry](movecolumnsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:659](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L659)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [MoveColumnsUndoEntry](movecolumnsundoentry.md) |

**Returns:** *void*

___

### undoMoveRows 

▸ **undoMoveRows**(`operation`: [MoveRowsUndoEntry](moverowsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:652](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L652)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [MoveRowsUndoEntry](moverowsundoentry.md) |

**Returns:** *void*

___

### undoPaste 

▸ **undoPaste**(`operation`: [PasteUndoEntry](pasteundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:645](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L645)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [PasteUndoEntry](pasteundoentry.md) |

**Returns:** *void*

___

### undoRemoveColumns 

▸ **undoRemoveColumns**(`operation`: [RemoveColumnsUndoEntry](removecolumnsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:602](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L602)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveColumnsUndoEntry](removecolumnsundoentry.md) |

**Returns:** *void*

___

### undoRemoveNamedExpression 

▸ **undoRemoveNamedExpression**(`operation`: [RemoveNamedExpressionUndoEntry](removenamedexpressionundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:740](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L740)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveNamedExpressionUndoEntry](removenamedexpressionundoentry.md) |

**Returns:** *void*

___

### undoRemoveRows 

▸ **undoRemoveRows**(`operation`: [RemoveRowsUndoEntry](removerowsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:586](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L586)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveRowsUndoEntry](removerowsundoentry.md) |

**Returns:** *void*

___

### undoRemoveSheet 

▸ **undoRemoveSheet**(`operation`: [RemoveSheetUndoEntry](removesheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:683](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L683)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RemoveSheetUndoEntry](removesheetundoentry.md) |

**Returns:** *void*

___

### undoRenameSheet 

▸ **undoRenameSheet**(`operation`: [RenameSheetUndoEntry](renamesheetundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:701](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L701)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [RenameSheetUndoEntry](renamesheetundoentry.md) |

**Returns:** *void*

___

### undoSetCellContents 

▸ **undoSetCellContents**(`operation`: [SetCellContentsUndoEntry](setcellcontentsundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:634](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L634)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetCellContentsUndoEntry](setcellcontentsundoentry.md) |

**Returns:** *void*

___

### undoSetColumnOrder 

▸ **undoSetColumnOrder**(`operation`: [SetColumnOrderUndoEntry](setcolumnorderundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:752](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L752)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetColumnOrderUndoEntry](setcolumnorderundoentry.md) |

**Returns:** *void*

___

### undoSetRowOrder 

▸ **undoSetRowOrder**(`operation`: [SetRowOrderUndoEntry](setroworderundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:748](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L748)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetRowOrderUndoEntry](setroworderundoentry.md) |

**Returns:** *void*

___

### undoSetSheetContent 

▸ **undoSetSheetContent**(`operation`: [SetSheetContentUndoEntry](setsheetcontentundoentry.md)): *void*

*Defined in [src/UndoRedo.ts:723](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L723)*

**Parameters:**

Name | Type |
------ | ------ |
`operation` | [SetSheetContentUndoEntry](setsheetcontentundoentry.md) |

**Returns:** *void*