import {FormulaTransformer, Transformer} from './Transformer'
import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {Address, cellRangeTransformer, transformAddressesInFormula} from './common'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, buildCellErrorAst, CellAddress, CellRangeAst, CellReferenceAst, ParserWithCaching} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {ColumnRangeAst} from '../parser/Ast'

export class RemoveSheetTransformer extends Transformer {
  constructor(
    private removedSheet: number
  ) {
    super()
  }

  transform(graph: DependencyGraph, parser: ParserWithCaching): void {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst] = this.transformSingleAst(node.getFormula()!, node.getAddress())
      node.setFormula(newAst)
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends Address>(dependencyAddress: T, formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    if (dependencyAddress.sheet === this.removedSheet) {
      return ErrorType.REF
    }
    return false
  }

  protected transformCellRangeAst(ast: CellRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
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

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }
}