# LazilyTransformingAstService

Manages lazy application of formula AST transformations.

## Problem
Structural operations (adding/removing rows/columns, moving cells, renaming sheets)
require updating every formula that references the affected area. Applying these
transformations eagerly to all formulas after every operation is expensive, especially
for large spreadsheets with many formulas.

## Solution: Lazy Transformation
Instead of transforming all formulas immediately, this service stores transformations
in a queue. Each formula vertex (FormulaVertex) and column index entry (ValueIndex)
tracks its own version number. When a consumer needs up-to-date data, it calls
`applyTransformations()` with its current version and receives all transformations
accumulated since that version.

## Compaction
Over time, the transformations array grows unboundedly. To prevent this memory leak,
the engine periodically triggers compaction when the number of accumulated
transformations reaches the configurable `maxPendingLazyTransformations`:

1. All FormulaVertex instances are forced to apply pending transformations
   (via `DependencyGraph.forceApplyPostponedTransformations()`).
2. All ColumnIndex entries are forced to apply pending transformations
   (via `ColumnSearchStrategy.forceApplyPostponedTransformations()`).
3. `compact()` is called, which advances `versionOffset` and clears the
   transformations array.
4. `UndoRedo.cleanupOrphanedOldData()` removes any oldData entries that were
   written during forced application but belong to already-evicted undo entries.

The `versionOffset` ensures that version numbers remain globally consistent
after compaction: `version() = versionOffset + transformations.length`.

## Constructors

### constructor 

\+ **new LazilyTransformingAstService**(`stats`: [Statistics](statistics.md), `maxPendingLazyTransformations`: number): *[LazilyTransformingAstService](lazilytransformingastservice.md)*

*Defined in [src/LazilyTransformingAstService.ts:54](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [Statistics](statistics.md) |
`maxPendingLazyTransformations` | number |

**Returns:** *[LazilyTransformingAstService](lazilytransformingastservice.md)*

## Properties

### parser

• **parser**? : *ParserWithCaching*

*Defined in [src/LazilyTransformingAstService.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L49)*

___

### undoRedo

• **undoRedo**? : *[UndoRedo](undoredo.md)*

*Defined in [src/LazilyTransformingAstService.ts:50](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L50)*

## Methods

### addTransformation 

▸ **addTransformation**(`transformation`: FormulaTransformer): *number*

*Defined in [src/LazilyTransformingAstService.ts:66](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`transformation` | FormulaTransformer |

**Returns:** *number*

___

### applyTransformations 

▸ **applyTransformations**(`ast`: Ast, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `version`: number): *[Ast, [SimpleCellAddress](../interfaces/simplecelladdress.md), number]*

*Defined in [src/LazilyTransformingAstService.ts:88](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | Ast |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`version` | number |

**Returns:** *[Ast, [SimpleCellAddress](../interfaces/simplecelladdress.md), number]*

___

### beginCombinedMode 

▸ **beginCombinedMode**(`sheet`: number): *void*

*Defined in [src/LazilyTransformingAstService.ts:75](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |

**Returns:** *void*

___

### commitCombinedMode 

▸ **commitCombinedMode**(): *number*

*Defined in [src/LazilyTransformingAstService.ts:79](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L79)*

**Returns:** *number*

___

### compact 

▸ **compact**(): *void*

*Defined in [src/LazilyTransformingAstService.ts:135](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L135)*

Compacts the transformations array by discarding all entries that have already
been applied by every consumer. Safe to call only after all FormulaVertex and
ColumnIndex consumers have been brought up to the current version.
After calling, UndoRedo.cleanupOrphanedOldData() must be invoked to remove
oldData entries written during forceApplyPostponedTransformations for
already-evicted undo entries.

**Returns:** *void*

___

### getTransformationsFrom 

▸ **getTransformationsFrom**(`version`: number, `filter?`: undefined | function): *IterableIterator‹FormulaTransformer›*

*Defined in [src/LazilyTransformingAstService.ts:109](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`version` | number |
`filter?` | undefined &#124; function |

**Returns:** *IterableIterator‹FormulaTransformer›*

___

### needsCompaction 

▸ **needsCompaction**(): *boolean*

*Defined in [src/LazilyTransformingAstService.ts:123](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L123)*

Returns true when enough transformations have accumulated to justify the cost
of forcing all consumers (FormulaVertex, ColumnIndex) to apply pending changes.

**Returns:** *boolean*

___

### version 

▸ **version**(): *number*

*Defined in [src/LazilyTransformingAstService.ts:62](https://github.com/handsontable/hyperformula/blob/af2d59d/src/LazilyTransformingAstService.ts#L62)*

**Returns:** *number*