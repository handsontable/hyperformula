/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
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

  private transformations: FormulaTransformer[] = []
  private combinedTransformer?: CombinedTransformer

  constructor(
    private readonly stats: Statistics,
  ) {
  }

  public version(): number {
    return this.transformations.length
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
      throw 'Combined mode wasn\'t started'
    }
    this.transformations.push(this.combinedTransformer)
    this.combinedTransformer = undefined
    return this.version()
  }

  public applyTransformations(ast: Ast, address: SimpleCellAddress, version: number): [Ast, SimpleCellAddress, number] {
    this.stats.start(StatType.TRANSFORM_ASTS_POSTPONED)

    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
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
    return [cachedAst, address, this.transformations.length]
  }

  public* getTransformationsFrom(version: number, filter?: (transformation: FormulaTransformer) => boolean): IterableIterator<FormulaTransformer> {
    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      if (!filter || filter(transformation)) {
        yield transformation
      }
    }
  }
}
