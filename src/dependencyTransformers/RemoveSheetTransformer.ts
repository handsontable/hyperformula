/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {Transformer} from './Transformer'

export class RemoveSheetTransformer extends Transformer {
  constructor(
    public readonly sheet: number
  ) {
    super()
  }

  public isIrreversible() {
    return true
  }

  public performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void {
    for (const node of graph.arrayFormulaNodes()) {
      const [newAst] = this.transformSingleAst(node.getFormula(graph.lazilyTransformingAstService), node.getAddress(graph.lazilyTransformingAstService))
      const cachedAst = parser.rememberNewAst(newAst) // TODO: check if this is needed
      node.setFormula(cachedAst)
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, _formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return this.transformAddress(dependencyAddress)
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return this.transformAddress(start) === ErrorType.REF || this.transformAddress(end) === ErrorType.REF ? ErrorType.REF : false
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return this.transformAddress(start) === ErrorType.REF || this.transformAddress(end) === ErrorType.REF ? ErrorType.REF : false
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return this.transformAddress(start) === ErrorType.REF || this.transformAddress(end) === ErrorType.REF ? ErrorType.REF : false
  }

  private transformAddress<T extends CellAddress | RowAddress | ColumnAddress>(address: T): ErrorType.REF | false {
    if (address.sheet === this.sheet) {
      return ErrorType.REF
    }
    return false
  }
}
