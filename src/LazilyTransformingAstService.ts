/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {CombinedTransformer} from './dependencyTransformers/CombinedTransformer'
import {FormulaTransformer} from './dependencyTransformers/Transformer'
import {Ast, ParserWithCaching} from './parser'
import {StatType} from './statistics'
import {Statistics} from './statistics/Statistics'
import {UndoRedo} from './UndoRedo'

export class LazilyTransformingAstService {

  public parser?: ParserWithCaching
  public undoRedo?: UndoRedo

  private static readonly COMPACTION_THRESHOLD = 50

  private transformations: FormulaTransformer[] = []
  private versionOffset: number = 0
  private combinedTransformer?: CombinedTransformer

  constructor(
    private readonly stats: Statistics,
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
    return this.transformations.length >= LazilyTransformingAstService.COMPACTION_THRESHOLD
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
