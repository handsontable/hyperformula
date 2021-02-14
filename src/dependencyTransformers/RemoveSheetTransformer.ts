/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Transformer} from './Transformer'
import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'

export class RemoveSheetTransformer extends Transformer {
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

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, _formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return this.transformAddress(dependencyAddress)
  }

  protected transformCellRange(start: CellAddress, _end: CellAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return this.transformAddress(start)
  }

  protected transformColumnRange(start: ColumnAddress, _end: ColumnAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return this.transformAddress(start)
  }

  protected transformRowRange(start: RowAddress, _end: RowAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return this.transformAddress(start)
  }

  private transformAddress<T extends CellAddress | RowAddress | ColumnAddress>(address: T): ErrorType.REF | false {
    if (address.sheet === this.sheet) {
      return ErrorType.REF
    }
    return false
  }
}
