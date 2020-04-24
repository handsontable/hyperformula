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
    if (dependencyAddress.sheet === this.sheet) {
      return ErrorType.REF
    }
    return false
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false {
    const newStart = this.transformCellAddress(start, formulaAddress)
    const newEnd = this.transformCellAddress(end, formulaAddress)
    if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
      return ErrorType.REF
    } else if (newStart || newEnd) {
      return [newStart || start, newEnd || end]
    } else {
      return false
    }
  }

  protected transformColumnRange(start: ColumnAddress, _end: ColumnAddress, _formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    if (start.sheet === this.sheet || start.sheet === this.sheet) {
      return ErrorType.REF
    }
    return false
  }

  protected transformRowRange(start: RowAddress, _end: RowAddress, _formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    if (start.sheet === this.sheet || start.sheet === this.sheet) {
      return ErrorType.REF
    }
    return false
  }
}
