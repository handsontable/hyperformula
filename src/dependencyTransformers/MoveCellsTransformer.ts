import {Transformer} from './Transformer'
import {Ast, CellAddress} from '../parser'
import {ErrorType, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {Address} from './common'
import {MoveCellsTransformation} from '../LazilyTransformingAstService'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'

export class MoveCellsTransformer extends Transformer {
  private dependentFormulaTransformer: DependentFormulaTransformer
  constructor(
    private transformation: MoveCellsTransformation,
  ) {
    super()
    this.dependentFormulaTransformer = new DependentFormulaTransformer(transformation)
  }

  transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress] {
    if (this.transformation.sourceRange.addressInRange(address)) {
      const newAst = this.transformAst(ast, address)
      return [newAst, this.fixNodeAddress(address)]
    } else {
      return this.dependentFormulaTransformer.transformSingleAst(ast, address)
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return simpleCellAddress(address.sheet, address.col + this.transformation.toRight, address.row + this.transformation.toBottom)
  }

  protected transformCellAddress<T extends Address>(dependencyAddress: T, formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    const sourceRange = this.transformation.sourceRange
    const targetRange = sourceRange.shifted(this.transformation.toRight, this.transformation.toBottom)

    if (dependencyAddress instanceof CellAddress) {
      const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
      if (sourceRange.addressInRange(absoluteDependencyAddress)) { // If dependency is internal, move only absolute dimensions
        return dependencyAddress.shiftAbsoluteDimensions(this.transformation.toRight, this.transformation.toBottom) as T

      } else if (targetRange.addressInRange(absoluteDependencyAddress)) {  // If dependency is external and moved range overrides it return REF
        return ErrorType.REF
      }
    }

    return dependencyAddress.shiftRelativeDimensions(-this.transformation.toRight, -this.transformation.toBottom) as T
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformRowRangeAst(ast: RowRangeAst, formulaAddress: SimpleCellAddress): Ast {
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

class DependentFormulaTransformer extends Transformer {
  constructor(
    private transformation: MoveCellsTransformation
  ) {
    super()
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends Address>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | false {
    const sourceRange = this.transformation.sourceRange
    if (dependencyAddress instanceof CellAddress) {
      if (sourceRange.addressInRange(dependencyAddress.toSimpleCellAddress(formulaAddress))) {
        return dependencyAddress.moved(this.transformation.toSheet, this.transformation.toRight, this.transformation.toBottom) as T
      }
      return false
    }

    throw Error('This should not happen')
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformRowRangeAst(ast: RowRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | false {
    const newStart = this.transformCellAddress(start, formulaAddress)
    const newEnd = this.transformCellAddress(end, formulaAddress)

    if (newStart && newEnd) {
      return [newStart, newEnd]
    }

    return false
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }
}