# Operations

## Constructors

### constructor 

\+ **new Operations**(`config`: [Config](config.md), `dependencyGraph`: DependencyGraph, `columnSearch`: [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md), `cellContentParser`: [CellContentParser](cellcontentparser.md), `parser`: ParserWithCaching, `stats`: [Statistics](statistics.md), `lazilyTransformingAstService`: [LazilyTransformingAstService](lazilytransformingastservice.md), `namedExpressions`: [NamedExpressions](namedexpressions.md), `arraySizePredictor`: [ArraySizePredictor](arraysizepredictor.md)): *[Operations](operations.md)*

*Defined in [src/Operations.ts:160](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L160)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`dependencyGraph` | DependencyGraph |
`columnSearch` | [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md) |
`cellContentParser` | [CellContentParser](cellcontentparser.md) |
`parser` | ParserWithCaching |
`stats` | [Statistics](statistics.md) |
`lazilyTransformingAstService` | [LazilyTransformingAstService](lazilytransformingastservice.md) |
`namedExpressions` | [NamedExpressions](namedexpressions.md) |
`arraySizePredictor` | [ArraySizePredictor](arraysizepredictor.md) |

**Returns:** *[Operations](operations.md)*

## Methods

### addColumns 

▸ **addColumns**(`cmd`: [AddColumnsCommand](addcolumnscommand.md)): *void*

*Defined in [src/Operations.ts:203](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L203)*

**Parameters:**

Name | Type |
------ | ------ |
`cmd` | [AddColumnsCommand](addcolumnscommand.md) |

**Returns:** *void*

___

### addNamedExpression 

▸ **addNamedExpression**(`expressionName`: string, `expression`: [RawCellContent](../globals.md#rawcellcontent), `sheetId?`: undefined | number, `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *void*

*Defined in [src/Operations.ts:420](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L420)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`expression` | [RawCellContent](../globals.md#rawcellcontent) |
`sheetId?` | undefined &#124; number |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *void*

___

### addPlaceholderSheetWithId 

▸ **addPlaceholderSheetWithId**(`sheetId`: number, `name`: string): *void*

*Defined in [src/Operations.ts:253](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L253)*

Adds a placeholder sheet with a specific ID for undo operations.
Used to restore previously merged placeholder sheets.

Note: Unlike `addSheetWithId`, this does NOT call `dependencyGraph.addSheet()`
because placeholders don't need dirty marking or strategy changes - they only
need to exist in the mappings so formulas can reference them again.

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`name` | string |

**Returns:** *void*

___

### addRows 

▸ **addRows**(`cmd`: [AddRowsCommand](addrowscommand.md)): *void*

*Defined in [src/Operations.ts:197](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L197)*

**Parameters:**

Name | Type |
------ | ------ |
`cmd` | [AddRowsCommand](addrowscommand.md) |

**Returns:** *void*

___

### addSheet 

▸ **addSheet**(`name?`: undefined | string): *object*

*Defined in [src/Operations.ts:231](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L231)*

Adds a new sheet to the workbook.

**Parameters:**

Name | Type |
------ | ------ |
`name?` | undefined &#124; string |

**Returns:** *object*

* **sheetId**: *number*

* **sheetName**: *string*

___

### addSheetWithId 

▸ **addSheetWithId**(`sheetId`: number, `name`: string): *void*

*Defined in [src/Operations.ts:240](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L240)*

Adds a sheet with a specific ID for redo operations.

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`name` | string |

**Returns:** *void*

___

### changeNamedExpressionExpression 

▸ **changeNamedExpressionExpression**(`expressionName`: string, `newExpression`: [RawCellContent](../globals.md#rawcellcontent), `sheetId?`: undefined | number, `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)]*

*Defined in [src/Operations.ts:433](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L433)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`newExpression` | [RawCellContent](../globals.md#rawcellcontent) |
`sheetId?` | undefined &#124; number |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)]*

___

### clearSheet 

▸ **clearSheet**(`sheetId`: number): *void*

*Defined in [src/Operations.ts:223](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L223)*

Clears the sheet content.

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *void*

___

### ensureItIsPossibleToMoveCells 

▸ **ensureItIsPossibleToMoveCells**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number, `destinationLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Operations.ts:466](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L466)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |
`destinationLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### forceApplyPostponedTransformations 

▸ **forceApplyPostponedTransformations**(): *void*

*Defined in [src/Operations.ts:745](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L745)*

Forces all formula vertices and column index entries to apply pending lazy
transformations, bringing them up to the current LazilyTransformingAstService version.
Called before undo of move operations and before compaction.

**Returns:** *void*

___

### getAndClearContentChanges 

▸ **getAndClearContentChanges**(): *[ContentChanges](contentchanges.md)*

*Defined in [src/Operations.ts:734](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L734)*

**Returns:** *[ContentChanges](contentchanges.md)*

___

### getClipboardCell 

▸ **getClipboardCell**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[ClipboardCell](../globals.md#clipboardcell)*

*Defined in [src/Operations.ts:549](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L549)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[ClipboardCell](../globals.md#clipboardcell)*

___

### getOldContent 

▸ **getOldContent**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]*

*Defined in [src/Operations.ts:530](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L530)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]*

___

### getRangeClipboardCells 

▸ **getRangeClipboardCells**(`range`: [AbsoluteCellRange](absolutecellrange.md)): *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/Operations.ts:590](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L590)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

___

### getSheetClipboardCells 

▸ **getSheetClipboardCells**(`sheet`: number): *[ClipboardCell](../globals.md#clipboardcell)[][]*

*Defined in [src/Operations.ts:574](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L574)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |

**Returns:** *[ClipboardCell](../globals.md#clipboardcell)[][]*

___

### moveCells 

▸ **moveCells**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number, `destinationLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[MoveCellsResult](../interfaces/movecellsresult.md)*

*Defined in [src/Operations.ts:343](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L343)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |
`destinationLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[MoveCellsResult](../interfaces/movecellsresult.md)*

___

### moveColumns 

▸ **moveColumns**(`sheet`: number, `startColumn`: number, `numberOfColumns`: number, `targetColumn`: number): *number*

*Defined in [src/Operations.ts:324](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L324)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startColumn` | number |
`numberOfColumns` | number |
`targetColumn` | number |

**Returns:** *number*

___

### moveRows 

▸ **moveRows**(`sheet`: number, `startRow`: number, `numberOfRows`: number, `targetRow`: number): *number*

*Defined in [src/Operations.ts:305](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L305)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startRow` | number |
`numberOfRows` | number |
`targetRow` | number |

**Returns:** *number*

___

### removeColumns 

▸ **removeColumns**(`cmd`: [RemoveColumnsCommand](removecolumnscommand.md)): *[ColumnsRemoval](../interfaces/columnsremoval.md)[]*

*Defined in [src/Operations.ts:209](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L209)*

**Parameters:**

Name | Type |
------ | ------ |
`cmd` | [RemoveColumnsCommand](removecolumnscommand.md) |

**Returns:** *[ColumnsRemoval](../interfaces/columnsremoval.md)[]*

___

### removeNamedExpression 

▸ **removeNamedExpression**(`expressionName`: string, `sheetId?`: undefined | number): *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)]*

*Defined in [src/Operations.ts:447](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L447)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |

**Returns:** *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)]*

___

### removeRows 

▸ **removeRows**(`cmd`: [RemoveRowsCommand](removerowscommand.md)): *[RowsRemoval](../interfaces/rowsremoval.md)[]*

*Defined in [src/Operations.ts:186](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L186)*

**Parameters:**

Name | Type |
------ | ------ |
`cmd` | [RemoveRowsCommand](removerowscommand.md) |

**Returns:** *[RowsRemoval](../interfaces/rowsremoval.md)[]*

___

### removeSheet 

▸ **removeSheet**(`sheetId`: number): *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/Operations.ts:261](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L261)*

Removes a sheet from the workbook.

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *[[InternalNamedExpression](internalnamedexpression.md), [ClipboardCell](../globals.md#clipboardcell)][]*

___

### removeSheetByName 

▸ **removeSheetByName**(`sheetName`: string): *[[InternalNamedExpression](internalnamedexpression.md)‹›, [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/Operations.ts:273](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L273)*

Removes a sheet from the workbook by name.

**Parameters:**

Name | Type |
------ | ------ |
`sheetName` | string |

**Returns:** *[[InternalNamedExpression](internalnamedexpression.md)‹›, [ClipboardCell](../globals.md#clipboardcell)][]*

___

### renameSheet 

▸ **renameSheet**(`sheetId`: number, `newName`: string): *object*

*Defined in [src/Operations.ts:281](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L281)*

Renames a sheet in the workbook.

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`newName` | string |

**Returns:** *object*

* **mergedPlaceholderSheetId**? : *undefined | number*

* **previousDisplayName**: *[Maybe](../globals.md#maybe)‹string›*

* **version**? : *undefined | number*

___

### restoreCell 

▸ **restoreCell**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `clipboardCell`: [ClipboardCell](../globals.md#clipboardcell)): *void*

*Defined in [src/Operations.ts:509](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L509)*

Restores a single cell.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`clipboardCell` | [ClipboardCell](../globals.md#clipboardcell) |

**Returns:** *void*

___

### restoreClipboardCells 

▸ **restoreClipboardCells**(`sourceSheetId`: number, `cells`: IterableIterator‹[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]›): *string[]*

*Defined in [src/Operations.ts:493](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L493)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceSheetId` | number |
`cells` | IterableIterator‹[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]› |

**Returns:** *string[]*

___

### restoreNamedExpression 

▸ **restoreNamedExpression**(`namedExpression`: [InternalNamedExpression](internalnamedexpression.md), `content`: [ClipboardCell](../globals.md#clipboardcell), `sheetId?`: undefined | number): *void*

*Defined in [src/Operations.ts:426](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L426)*

**Parameters:**

Name | Type |
------ | ------ |
`namedExpression` | [InternalNamedExpression](internalnamedexpression.md) |
`content` | [ClipboardCell](../globals.md#clipboardcell) |
`sheetId?` | undefined &#124; number |

**Returns:** *void*

___

### rowEffectivelyNotInSheet 

▸ **rowEffectivelyNotInSheet**(`row`: number, `sheet`: number): *boolean*

*Defined in [src/Operations.ts:729](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L729)*

Returns true if row number is outside of given sheet.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`row` | number | row number |
`sheet` | number | sheet ID number  |

**Returns:** *boolean*

___

### setCellContent 

▸ **setCellContent**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `newCellContent`: [RawCellContent](../globals.md#rawcellcontent)): *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]*

*Defined in [src/Operations.ts:598](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L598)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`newCellContent` | [RawCellContent](../globals.md#rawcellcontent) |

**Returns:** *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)]*

___

### setCellEmpty 

▸ **setCellEmpty**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Operations.ts:695](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L695)*

Sets cell content to an empty value.
Creates an EmptyCellVertex and updates the dependency graph and column search index.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### setColumnOrder 

▸ **setColumnOrder**(`sheetId`: number, `columnMapping`: [number, number][]): *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/Operations.ts:399](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L399)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`columnMapping` | [number, number][] |

**Returns:** *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

___

### setFormulaToCell 

▸ **setFormulaToCell**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `size`: [ArraySize](arraysize.md), `__namedParameters`: object): *void*

*Defined in [src/Operations.ts:663](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L663)*

Sets cell content to a formula.
Creates a ScalarFormulaVertex and updates the dependency graph and column search index.

**Parameters:**

▪ **address**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

▪ **size**: *[ArraySize](arraysize.md)*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`ast` | Ast |
`dependencies` | RelativeDependency[] |
`hasStructuralChangeFunction` | boolean |
`hasVolatileFunction` | boolean |

**Returns:** *void*

___

### setFormulaToCellFromCache 

▸ **setFormulaToCellFromCache**(`formulaHash`: string, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Operations.ts:709](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L709)*

**Parameters:**

Name | Type |
------ | ------ |
`formulaHash` | string |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### setParsingErrorToCell 

▸ **setParsingErrorToCell**(`rawInput`: string, `errors`: ParsingError[], `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Operations.ts:648](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L648)*

Sets cell content to an instance of parsing error.
Creates a ParsingErrorVertex and updates the dependency graph and column search index.

**Parameters:**

Name | Type |
------ | ------ |
`rawInput` | string |
`errors` | ParsingError[] |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### setRowOrder 

▸ **setRowOrder**(`sheetId`: number, `rowMapping`: [number, number][]): *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

*Defined in [src/Operations.ts:378](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L378)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`rowMapping` | [number, number][] |

**Returns:** *[[SimpleCellAddress](../interfaces/simplecelladdress.md), [ClipboardCell](../globals.md#clipboardcell)][]*

___

### setSheetContent 

▸ **setSheetContent**(`sheetId`: number, `newSheetContent`: [RawCellContent](../globals.md#rawcellcontent)[][]): *void*

*Defined in [src/Operations.ts:634](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L634)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`newSheetContent` | [RawCellContent](../globals.md#rawcellcontent)[][] |

**Returns:** *void*

___

### setValueToCell 

▸ **setValueToCell**(`value`: RawAndParsedValue, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/Operations.ts:681](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L681)*

Sets cell content to a value.
Creates a ValueCellVertex and updates the dependency graph and column search index.

**Parameters:**

Name | Type |
------ | ------ |
`value` | RawAndParsedValue |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*