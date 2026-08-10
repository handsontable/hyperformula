# RenameSheetUndoEntry

Undo entry for renaming a sheet.

When renaming a sheet to a name that was previously referenced (but didn't exist),
a placeholder sheet gets merged into the renamed sheet. In this case:
- `version` contains the transformation version for restoring formulas during undo
- `mergedPlaceholderSheetId` contains the ID of the placeholder sheet that was merged

When renaming to a name not previously referenced, both optional params are undefined.

## Constructors

### constructor 

\+ **new RenameSheetUndoEntry**(`sheetId`: number, `oldName`: string, `newName`: string, `version?`: undefined | number, `mergedPlaceholderSheetId?`: undefined | number): *[RenameSheetUndoEntry](renamesheetundoentry.md)*

*Defined in [src/UndoRedo.ts:305](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L305)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`oldName` | string |
`newName` | string |
`version?` | undefined &#124; number |
`mergedPlaceholderSheetId?` | undefined &#124; number |

**Returns:** *[RenameSheetUndoEntry](renamesheetundoentry.md)*

## Properties

### mergedPlaceholderSheetId

• **mergedPlaceholderSheetId**? : *undefined | number*

*Defined in [src/UndoRedo.ts:311](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L311)*

___

### newName

• **newName**: *string*

*Defined in [src/UndoRedo.ts:309](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L309)*

___

### oldName

• **oldName**: *string*

*Defined in [src/UndoRedo.ts:308](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L308)*

___

### sheetId

• **sheetId**: *number*

*Defined in [src/UndoRedo.ts:307](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L307)*

___

### version

• **version**? : *undefined | number*

*Defined in [src/UndoRedo.ts:310](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L310)*

## Methods

### doRedo 

▸ **doRedo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:320](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L320)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### doUndo 

▸ **doUndo**(`undoRedo`: [UndoRedo](undoredo.md)): *void*

*Defined in [src/UndoRedo.ts:316](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L316)*

**Parameters:**

Name | Type |
------ | ------ |
`undoRedo` | [UndoRedo](undoredo.md) |

**Returns:** *void*

___

### getReferencedOldDataVersions 

▸ **getReferencedOldDataVersions**(): *number[]*

*Defined in [src/UndoRedo.ts:324](https://github.com/handsontable/hyperformula/blob/af2d59d/src/UndoRedo.ts#L324)*

**Returns:** *number[]*