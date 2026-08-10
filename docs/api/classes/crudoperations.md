# CrudOperations

## Constructors

### constructor 

\+ **new CrudOperations**(`config`: [Config](config.md), `operations`: [Operations](operations.md), `undoRedo`: [UndoRedo](undoredo.md), `clipboardOperations`: [ClipboardOperations](clipboardoperations.md), `dependencyGraph`: DependencyGraph, `columnSearch`: [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md), `parser`: ParserWithCaching, `cellContentParser`: [CellContentParser](cellcontentparser.md), `lazilyTransformingAstService`: [LazilyTransformingAstService](lazilytransformingastservice.md), `namedExpressions`: [NamedExpressions](namedexpressions.md)): *[CrudOperations](crudoperations.md)*

*Defined in [src/CrudOperations.ts:70](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](config.md) |
`operations` | [Operations](operations.md) |
`undoRedo` | [UndoRedo](undoredo.md) |
`clipboardOperations` | [ClipboardOperations](clipboardoperations.md) |
`dependencyGraph` | DependencyGraph |
`columnSearch` | [ColumnSearchStrategy](../interfaces/columnsearchstrategy.md) |
`parser` | ParserWithCaching |
`cellContentParser` | [CellContentParser](cellcontentparser.md) |
`lazilyTransformingAstService` | [LazilyTransformingAstService](lazilytransformingastservice.md) |
`namedExpressions` | [NamedExpressions](namedexpressions.md) |

**Returns:** *[CrudOperations](crudoperations.md)*

## Properties

### operations

• **operations**: *[Operations](operations.md)*

*Defined in [src/CrudOperations.ts:74](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L74)*

___

### undoRedo

• **undoRedo**: *[UndoRedo](undoredo.md)*

*Defined in [src/CrudOperations.ts:75](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L75)*

## Methods

### addColumns 

▸ **addColumns**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:110](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### addNamedExpression 

▸ **addNamedExpression**(`expressionName`: string, `expression`: [RawCellContent](../globals.md#rawcellcontent), `sheetId?`: undefined | number, `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *void*

*Defined in [src/CrudOperations.ts:382](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L382)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`expression` | [RawCellContent](../globals.md#rawcellcontent) |
`sheetId?` | undefined &#124; number |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *void*

___

### addRows 

▸ **addRows**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:92](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### addSheet 

▸ **addSheet**(`name?`: undefined | string): *string*

*Defined in [src/CrudOperations.ts:204](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L204)*

**Parameters:**

Name | Type |
------ | ------ |
`name?` | undefined &#124; string |

**Returns:** *string*

___

### beginUndoRedoBatchMode 

▸ **beginUndoRedoBatchMode**(): *void*

*Defined in [src/CrudOperations.ts:188](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L188)*

**Returns:** *void*

___

### changeNamedExpressionExpression 

▸ **changeNamedExpressionExpression**(`expressionName`: string, `sheetId`: number | undefined, `newExpression`: [RawCellContent](../globals.md#rawcellcontent), `options?`: [NamedExpressionOptions](../globals.md#namedexpressionoptions)): *void*

*Defined in [src/CrudOperations.ts:390](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L390)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId` | number &#124; undefined |
`newExpression` | [RawCellContent](../globals.md#rawcellcontent) |
`options?` | [NamedExpressionOptions](../globals.md#namedexpressionoptions) |

**Returns:** *void*

___

### clearClipboard 

▸ **clearClipboard**(): *void*

*Defined in [src/CrudOperations.ts:200](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L200)*

**Returns:** *void*

___

### clearSheet 

▸ **clearSheet**(`sheetId`: number): *void*

*Defined in [src/CrudOperations.ts:240](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L240)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *void*

___

### commitUndoRedoBatchMode 

▸ **commitUndoRedoBatchMode**(): *void*

*Defined in [src/CrudOperations.ts:192](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L192)*

**Returns:** *void*

___

### copy 

▸ **copy**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *void*

*Defined in [src/CrudOperations.ts:167](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L167)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *void*

___

### cut 

▸ **cut**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *void*

*Defined in [src/CrudOperations.ts:154](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L154)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *void*

___

### ensureItIsPossibleToAddColumns 

▸ **ensureItIsPossibleToAddColumns**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:462](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L462)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### ensureItIsPossibleToAddNamedExpression 

▸ **ensureItIsPossibleToAddNamedExpression**(`expressionName`: string, `expression`: [RawCellContent](../globals.md#rawcellcontent), `sheetId?`: undefined | number): *void*

*Defined in [src/CrudOperations.ts:408](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L408)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`expression` | [RawCellContent](../globals.md#rawcellcontent) |
`sheetId?` | undefined &#124; number |

**Returns:** *void*

___

### ensureItIsPossibleToAddRows 

▸ **ensureItIsPossibleToAddRows**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:429](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L429)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### ensureItIsPossibleToAddSheet 

▸ **ensureItIsPossibleToAddSheet**(`name`: string): *void*

*Defined in [src/CrudOperations.ts:550](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L550)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *void*

___

### ensureItIsPossibleToChangeCellContents 

▸ **ensureItIsPossibleToChangeCellContents**(`inputAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `content`: [RawCellContent](../globals.md#rawcellcontent)[][]): *void*

*Defined in [src/CrudOperations.ts:576](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L576)*

**Parameters:**

Name | Type |
------ | ------ |
`inputAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`content` | [RawCellContent](../globals.md#rawcellcontent)[][] |

**Returns:** *void*

___

### ensureItIsPossibleToChangeContent 

▸ **ensureItIsPossibleToChangeContent**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/CrudOperations.ts:567](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L567)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### ensureItIsPossibleToChangeNamedExpression 

▸ **ensureItIsPossibleToChangeNamedExpression**(`expressionName`: string, `expression`: [RawCellContent](../globals.md#rawcellcontent), `sheetId?`: undefined | number): *void*

*Defined in [src/CrudOperations.ts:414](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L414)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`expression` | [RawCellContent](../globals.md#rawcellcontent) |
`sheetId?` | undefined &#124; number |

**Returns:** *void*

___

### ensureItIsPossibleToChangeSheetContents 

▸ **ensureItIsPossibleToChangeSheetContents**(`sheetId`: number, `content`: [RawCellContent](../globals.md#rawcellcontent)[][]): *void*

*Defined in [src/CrudOperations.ts:585](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L585)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`content` | [RawCellContent](../globals.md#rawcellcontent)[][] |

**Returns:** *void*

___

### ensureItIsPossibleToCopy 

▸ **ensureItIsPossibleToCopy**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number): *void*

*Defined in [src/CrudOperations.ts:158](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *void*

___

### ensureItIsPossibleToMoveColumns 

▸ **ensureItIsPossibleToMoveColumns**(`sheet`: number, `startColumn`: number, `numberOfColumns`: number, `targetColumn`: number): *void*

*Defined in [src/CrudOperations.ts:523](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L523)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startColumn` | number |
`numberOfColumns` | number |
`targetColumn` | number |

**Returns:** *void*

___

### ensureItIsPossibleToMoveRows 

▸ **ensureItIsPossibleToMoveRows**(`sheet`: number, `startRow`: number, `numberOfRows`: number, `targetRow`: number): *void*

*Defined in [src/CrudOperations.ts:496](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L496)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startRow` | number |
`numberOfRows` | number |
`targetRow` | number |

**Returns:** *void*

___

### ensureItIsPossibleToRemoveColumns 

▸ **ensureItIsPossibleToRemoveColumns**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:480](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L480)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### ensureItIsPossibleToRemoveRows 

▸ **ensureItIsPossibleToRemoveRows**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:447](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L447)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### ensureItIsPossibleToRenameSheet 

▸ **ensureItIsPossibleToRenameSheet**(`sheetId`: number, `name`: string): *void*

*Defined in [src/CrudOperations.ts:556](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L556)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`name` | string |

**Returns:** *void*

___

### ensureRangeInSizeLimits 

▸ **ensureRangeInSizeLimits**(`range`: [AbsoluteCellRange](absolutecellrange.md)): *void*

*Defined in [src/CrudOperations.ts:591](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L591)*

**Parameters:**

Name | Type |
------ | ------ |
`range` | [AbsoluteCellRange](absolutecellrange.md) |

**Returns:** *void*

___

### ensureScopeIdIsValid 

▸ **ensureScopeIdIsValid**(`scopeId?`: undefined | number): *void*

*Defined in [src/CrudOperations.ts:609](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L609)*

**Parameters:**

Name | Type |
------ | ------ |
`scopeId?` | undefined &#124; number |

**Returns:** *void*

___

### getAndClearContentChanges 

▸ **getAndClearContentChanges**(): *[ContentChanges](contentchanges.md)*

*Defined in [src/CrudOperations.ts:605](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L605)*

**Returns:** *[ContentChanges](contentchanges.md)*

___

### isClipboardEmpty 

▸ **isClipboardEmpty**(): *boolean*

*Defined in [src/CrudOperations.ts:196](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L196)*

**Returns:** *boolean*

___

### isItPossibleToRemoveNamedExpression 

▸ **isItPossibleToRemoveNamedExpression**(`expressionName`: string, `sheetId?`: undefined | number): *void*

*Defined in [src/CrudOperations.ts:422](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L422)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |

**Returns:** *void*

___

### isThereSomethingToRedo 

▸ **isThereSomethingToRedo**(): *boolean*

*Defined in [src/CrudOperations.ts:601](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L601)*

**Returns:** *boolean*

___

### isThereSomethingToUndo 

▸ **isThereSomethingToUndo**(): *boolean*

*Defined in [src/CrudOperations.ts:597](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L597)*

**Returns:** *boolean*

___

### mappingFromOrder 

▸ **mappingFromOrder**(`sheetId`: number, `newOrder`: number[], `rowOrColumn`: "row" | "column"): *[number, number][]*

*Defined in [src/CrudOperations.ts:349](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L349)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`newOrder` | number[] |
`rowOrColumn` | "row" &#124; "column" |

**Returns:** *[number, number][]*

___

### moveCells 

▸ **moveCells**(`sourceLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `width`: number, `height`: number, `destinationLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/CrudOperations.ts:128](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`sourceLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |
`destinationLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### moveColumns 

▸ **moveColumns**(`sheet`: number, `startColumn`: number, `numberOfColumns`: number, `targetColumn`: number): *void*

*Defined in [src/CrudOperations.ts:147](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L147)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startColumn` | number |
`numberOfColumns` | number |
`targetColumn` | number |

**Returns:** *void*

___

### moveRows 

▸ **moveRows**(`sheet`: number, `startRow`: number, `numberOfRows`: number, `targetRow`: number): *void*

*Defined in [src/CrudOperations.ts:139](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L139)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`startRow` | number |
`numberOfRows` | number |
`targetRow` | number |

**Returns:** *void*

___

### paste 

▸ **paste**(`targetLeftCorner`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *void*

*Defined in [src/CrudOperations.ts:172](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L172)*

**Parameters:**

Name | Type |
------ | ------ |
`targetLeftCorner` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *void*

___

### redo 

▸ **redo**(): *void*

*Defined in [src/CrudOperations.ts:374](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L374)*

**Returns:** *void*

___

### removeColumns 

▸ **removeColumns**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:119](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### removeNamedExpression 

▸ **removeNamedExpression**(`expressionName`: string, `sheetId?`: undefined | number): *[InternalNamedExpression](internalnamedexpression.md)*

*Defined in [src/CrudOperations.ts:398](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L398)*

**Parameters:**

Name | Type |
------ | ------ |
`expressionName` | string |
`sheetId?` | undefined &#124; number |

**Returns:** *[InternalNamedExpression](internalnamedexpression.md)*

___

### removeRows 

▸ **removeRows**(`sheet`: number, ...`indexes`: [ColumnRowIndex](../globals.md#columnrowindex)[]): *void*

*Defined in [src/CrudOperations.ts:101](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`...indexes` | [ColumnRowIndex](../globals.md#columnrowindex)[] |

**Returns:** *void*

___

### removeSheet 

▸ **removeSheet**(`sheetId`: number): *void*

*Defined in [src/CrudOperations.ts:214](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L214)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |

**Returns:** *void*

___

### renameSheet 

▸ **renameSheet**(`sheetId`: number, `newName`: string): *[Maybe](../globals.md#maybe)‹string›*

*Defined in [src/CrudOperations.ts:224](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L224)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`newName` | string |

**Returns:** *[Maybe](../globals.md#maybe)‹string›*

___

### setCellContents 

▸ **setCellContents**(`topLeftCornerAddress`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `cellContents`: [RawCellContent](../globals.md#rawcellcontent)[][] | [RawCellContent](../globals.md#rawcellcontent)): *void*

*Defined in [src/CrudOperations.ts:249](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L249)*

**Parameters:**

Name | Type |
------ | ------ |
`topLeftCornerAddress` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`cellContents` | [RawCellContent](../globals.md#rawcellcontent)[][] &#124; [RawCellContent](../globals.md#rawcellcontent) |

**Returns:** *void*

___

### setColumnOrder 

▸ **setColumnOrder**(`sheetId`: number, `columnMapping`: [number, number][]): *void*

*Defined in [src/CrudOperations.ts:322](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L322)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`columnMapping` | [number, number][] |

**Returns:** *void*

___

### setRowOrder 

▸ **setRowOrder**(`sheetId`: number, `rowMapping`: [number, number][]): *void*

*Defined in [src/CrudOperations.ts:295](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`rowMapping` | [number, number][] |

**Returns:** *void*

___

### setSheetContent 

▸ **setSheetContent**(`sheetId`: number, `values`: [RawCellContent](../globals.md#rawcellcontent)[][]): *void*

*Defined in [src/CrudOperations.ts:283](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L283)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`values` | [RawCellContent](../globals.md#rawcellcontent)[][] |

**Returns:** *void*

___

### testColumnOrderForArrays 

▸ **testColumnOrderForArrays**(`sheetId`: number, `columnMapping`: [number, number][]): *void*

*Defined in [src/CrudOperations.ts:311](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L311)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`columnMapping` | [number, number][] |

**Returns:** *void*

___

### testRowOrderForArrays 

▸ **testRowOrderForArrays**(`sheetId`: number, `rowMapping`: [number, number][]): *void*

*Defined in [src/CrudOperations.ts:338](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L338)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`rowMapping` | [number, number][] |

**Returns:** *void*

___

### undo 

▸ **undo**(): *void*

*Defined in [src/CrudOperations.ts:366](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L366)*

**Returns:** *void*

___

### validateSwapColumnIndexes 

▸ **validateSwapColumnIndexes**(`sheetId`: number, `columnMapping`: [number, number][]): *void*

*Defined in [src/CrudOperations.ts:331](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L331)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`columnMapping` | [number, number][] |

**Returns:** *void*

___

### validateSwapRowIndexes 

▸ **validateSwapRowIndexes**(`sheetId`: number, `rowMapping`: [number, number][]): *void*

*Defined in [src/CrudOperations.ts:304](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L304)*

**Parameters:**

Name | Type |
------ | ------ |
`sheetId` | number |
`rowMapping` | [number, number][] |

**Returns:** *void*