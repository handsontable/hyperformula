/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {CombinedTransformer} from './dependencyTransformers/CombinedTransformer'
import {FormulaTransformer} from './dependencyTransformers/Transformer'
import {Maybe} from './Maybe'
import {Ast, AstNodeType, ParserWithCaching} from './parser'
import {StatType} from './statistics'
import {Statistics} from './statistics/Statistics'
import {UndoRedo} from './UndoRedo'

/**
 * Stand-in node for an address-only transformation. Every transformer leaves an EMPTY node
 * untouched, so only the address it returns alongside it carries information.
 */
const ADDRESS_ONLY_NODE: Ast = {type: AstNodeType.EMPTY}

/**
 * Manages lazy application of formula AST transformations.
 *
 * ## Problem
 * Structural operations (adding/removing rows/columns, moving cells, renaming sheets)
 * require updating every formula that references the affected area. Applying these
 * transformations eagerly to all formulas after every operation is expensive, especially
 * for large spreadsheets with many formulas.
 *
 * ## Solution: Lazy Transformation
 * Instead of transforming all formulas immediately, this service stores transformations
 * in a queue. Each formula vertex (FormulaVertex) and column index entry (ValueIndex)
 * tracks its own version number. When a consumer needs up-to-date data, it calls
 * `applyTransformations()` with its current version and receives all transformations
 * accumulated since that version.
 *
 * ## Compaction
 * Over time, the transformations array grows unboundedly. To prevent this memory leak,
 * the engine periodically triggers compaction when the number of accumulated
 * transformations reaches the configurable `maxPendingLazyTransformations`:
 *
 * 1. All FormulaVertex instances are forced to apply pending transformations
 *    (via `DependencyGraph.forceApplyPostponedTransformations()`).
 * 2. All ColumnIndex entries are forced to apply pending transformations
 *    (via `ColumnSearchStrategy.forceApplyPostponedTransformations()`).
 * 3. `compact()` is called, which advances `versionOffset` and clears the
 *    transformations array.
 * 4. `UndoRedo.cleanupOrphanedOldData()` removes any oldData entries that were
 *    written during forced application but belong to already-evicted undo entries.
 *
 * The `versionOffset` ensures that version numbers remain globally consistent
 * after compaction: `version() = versionOffset + transformations.length`.
 */
export class LazilyTransformingAstService {

  public parser?: ParserWithCaching
  public undoRedo?: UndoRedo

  private transformations: FormulaTransformer[] = []
  private versionOffset: number = 0
  private combinedTransformer?: CombinedTransformer

  constructor(
    private readonly stats: Statistics,
    private readonly maxPendingLazyTransformations: number,
  ) {
  }

  public version(): number {
    return this.versionOffset + this.transformations.length
  }

  public addTransformation(transformation: FormulaTransformer): number {
    if (this.combinedTransformer !== undefined) {
      this.combinedTransformer.add(transformation)
    } else {
      this.transformations.push(transformation)
    }
    return this.version()
  }

  public beginCombinedMode(sheet: number) {
    this.combinedTransformer = new CombinedTransformer(sheet)
  }

  public commitCombinedMode(): number {
    if (this.combinedTransformer === undefined) {
      throw Error('Combined mode wasn\'t started')
    }
    this.transformations.push(this.combinedTransformer)
    this.combinedTransformer = undefined
    return this.version()
  }

  public applyTransformations(ast: Ast, address: SimpleCellAddress, version: number): [Ast, SimpleCellAddress, number] {
    this.stats.start(StatType.TRANSFORM_ASTS_POSTPONED)

    const currentVersion = this.version()
    for (let v = Math.max(version, this.versionOffset); v < currentVersion; v++) {
      const transformation = this.transformations[v - this.versionOffset]
      if (transformation.isIrreversible()) {
        this.undoRedo!.storeDataForVersion(v, address, this.parser!.computeHashFromAst(ast))
        this.parser!.rememberNewAst(ast)
      }

      const [newAst, newAddress] = transformation.transformSingleAst(ast, address)
      ast = newAst
      address = newAddress
    }
    const cachedAst = this.parser!.rememberNewAst(ast)

    this.stats.end(StatType.TRANSFORM_ASTS_POSTPONED)
    return [cachedAst, address, currentVersion]
  }

  /**
   * Replays stored transformations over a bare address that carries no formula.
   *
   * `applyTransformations` above does the same walk for a formula vertex, which owns an AST and so
   * also records undo data as it goes. A value has no AST to record, and the vertex that owns the
   * formula still writes its own undo entry when it catches up, so this walk deliberately records
   * nothing. It reuses each transformation's own `transformSingleAst` with an empty node rather
   * than reaching for `fixNodeAddress`, because two transformers do more than shift coordinates:
   * `MoveCellsTransformer` only moves an address that lies inside the range being moved, and that
   * decision lives in `transformSingleAst`, not in `fixNodeAddress`.
   *
   * Returns `undefined` when the stamp predates the last compaction. Compaction brings every
   * vertex up to date before it discards transformations, but a `CellError` cached inside a
   * vertex's value is not a vertex and is never brought up to date, so its version can fall behind
   * `versionOffset`. The transformations needed to move the address are gone by then, and naming
   * some other cell is worse than naming none.
   *
   * @param {SimpleCellAddress} address - the address as it was at `version`
   * @param {number} version - the version the address was current at
   */
  public applyTransformationsToAddress(address: SimpleCellAddress, version: number): Maybe<SimpleCellAddress> {
    if (version < this.versionOffset) {
      return undefined
    }

    let transformed = address
    const currentVersion = this.version()
    for (let v = version; v < currentVersion; v++) {
      transformed = this.transformations[v - this.versionOffset].transformSingleAst(ADDRESS_ONLY_NODE, transformed)[1]
    }
    return transformed
  }

  public* getTransformationsFrom(version: number, filter?: (transformation: FormulaTransformer) => boolean): IterableIterator<FormulaTransformer> {
    const currentVersion = this.version()
    for (let v = Math.max(version, this.versionOffset); v < currentVersion; v++) {
      const transformation = this.transformations[v - this.versionOffset]
      if (!filter || filter(transformation)) {
        yield transformation
      }
    }
  }

  /**
   * Returns true when enough transformations have accumulated to justify the cost
   * of forcing all consumers (FormulaVertex, ColumnIndex) to apply pending changes.
   */
  public needsCompaction(): boolean {
    return this.transformations.length >= this.maxPendingLazyTransformations
  }

  /**
   * Compacts the transformations array by discarding all entries that have already
   * been applied by every consumer. Safe to call only after all FormulaVertex and
   * ColumnIndex consumers have been brought up to the current version.
   * After calling, UndoRedo.cleanupOrphanedOldData() must be invoked to remove
   * oldData entries written during forceApplyPostponedTransformations for
   * already-evicted undo entries.
   */
  public compact(): void {
    this.versionOffset += this.transformations.length
    this.transformations = []
  }
}
