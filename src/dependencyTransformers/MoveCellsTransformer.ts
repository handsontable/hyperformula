import {Transformer} from './Transformer'
import {Ast, CellAddress} from '../parser'
import {ErrorType, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

export class MoveCellsTransformer extends Transformer {
  private dependentFormulaTransformer: DependentFormulaTransformer
  constructor(
    public readonly sourceRange: AbsoluteCellRange,
    public readonly toRight: number,
    public readonly toBottom: number,
    public readonly toSheet: number
  ) {
    super()
    this.dependentFormulaTransformer = new DependentFormulaTransformer(sourceRange, toRight, toBottom, toSheet)
  }

  public get sheet(): number {
    return this.sourceRange.sheet
  }

  public transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress] {
    if (this.sourceRange.addressInRange(address)) {
      const newAst = this.transformAst(ast, address)
      return [newAst, this.fixNodeAddress(address)]
    } else {
      return this.dependentFormulaTransformer.transformSingleAst(ast, address)
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return simpleCellAddress(address.sheet, address.col + this.toRight, address.row + this.toBottom)
  }

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return this.transformAddress(dependencyAddress, formulaAddress)
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  private transformAddress<T extends CellAddress | RowAddress | ColumnAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    const sourceRange = this.sourceRange
    const targetRange = sourceRange.shifted(this.toRight, this.toBottom)

    if (dependencyAddress instanceof CellAddress) {
      const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
      if (sourceRange.addressInRange(absoluteDependencyAddress)) { // If dependency is internal, move only absolute dimensions
        return dependencyAddress.shiftAbsoluteDimensions(this.toRight, this.toBottom) as T

      } else if (targetRange.addressInRange(absoluteDependencyAddress)) {  // If dependency is external and moved range overrides it return REF
        return ErrorType.REF
      }
    }

    return dependencyAddress.shiftRelativeDimensions(-this.toRight, -this.toBottom) as T
  }


  private transformRange<T extends CellAddress | RowAddress | ColumnAddress>(start: T,  end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
    const newStart = this.transformAddress(start, formulaAddress)
    const newEnd = this.transformAddress(end, formulaAddress)
    if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
      return ErrorType.REF
    } else if (newStart || newEnd) {
      return [newStart || start, newEnd || end]
    } else {
      return false
    }
  }
}

class DependentFormulaTransformer extends Transformer {
  constructor(
    public readonly sourceRange: AbsoluteCellRange,
    public readonly toRight: number,
    public readonly toBottom: number,
    public readonly toSheet: number
  ) {
    super()
  }

  public get sheet(): number {
    return this.sourceRange.sheet
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends CellAddress | RowAddress | ColumnAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | false {
    if (this.shouldMove(dependencyAddress, formulaAddress)) {
      return dependencyAddress.moved(this.toSheet, this.toRight, this.toBottom) as T
    }
    return false
  }

  private shouldMove(dependencyAddress: CellAddress | RowAddress | ColumnAddress, formulaAddress: SimpleCellAddress): boolean {
    if (dependencyAddress instanceof CellAddress) {
      return this.sourceRange.addressInRange(dependencyAddress.toSimpleCellAddress(formulaAddress))
    } else if (dependencyAddress instanceof RowAddress) {
      return this.sourceRange.rowInRange(dependencyAddress.toSimpleRowAddress(formulaAddress)) && !this.sourceRange.isFinite()
    } else {
      return this.sourceRange.columnInRange(dependencyAddress.toSimpleColumnAddress(formulaAddress)) && !this.sourceRange.isFinite()
    }
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  private transformRange<T extends CellAddress | RowAddress | ColumnAddress>(start: T,  end: T, formulaAddress: SimpleCellAddress): [T, T] | false {
    const newStart = this.transformCellAddress(start, formulaAddress)
    const newEnd = this.transformCellAddress(end, formulaAddress)

    if (newStart && newEnd) {
      return [newStart, newEnd]
    }

    return false
  }
}