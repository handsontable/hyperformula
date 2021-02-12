/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {Transformer} from './Transformer'
import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'

export class CleanOutOfScopeDependenciesTransformer extends Transformer {
  constructor(
    public readonly sheet: number
  ) {
    super()
  }

  public isIrreversible() {
    return true
  }

  public performEagerTransformations(graph: DependencyGraph, _parser: ParserWithCaching): void {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst] = this.transformSingleAst(node.getFormula()!, node.getAddress())
      node.setFormula(newAst)
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return dependencyAddress.isInScope(formulaAddress) ? false : ErrorType.REF
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return start.isInScope(formulaAddress) && end.isInScope(formulaAddress) ? false : ErrorType.REF
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return start.isInScope(formulaAddress) && end.isInScope(formulaAddress) ? false : ErrorType.REF
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return start.isInScope(formulaAddress) && end.isInScope(formulaAddress) ? false : ErrorType.REF
  }
}
