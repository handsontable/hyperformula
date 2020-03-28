import {Address, AddressWithColumn} from './common'
import {absoluteSheetReference, CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellRangeAst,
  CellReferenceAst, ErrorAst,
  ParserWithCaching
} from '../parser'
import {ColumnsSpan} from '../ColumnsSpan'
import {ColumnRangeAst} from '../parser/Ast'
import {DependencyGraph} from '../DependencyGraph'

export abstract class Transformer {
  public transform(graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = this.transformSingleAst(node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  public transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const newAst = this.transformAst(ast, address)
    const newAddress = this.fixNodeAddress(address)
    return [newAst, newAddress]
  }

  private transformAst(ast: Ast, address: SimpleCellAddress): Ast {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        return this.transformCellReferenceAst(ast, address)
      }
      case AstNodeType.CELL_RANGE: {
        return this.transformCellRangeAst(ast, address)
      }
      case AstNodeType.COLUMN_RANGE: {
        return this.transformColumnRangeAst(ast, address)
      }
      case AstNodeType.ERROR:
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return ast
      }
      case AstNodeType.PERCENT_OP: {
        return {
          ...ast,
          type: ast.type,
          value: this.transformAst(ast.value, address),
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return {
          ...ast,
          type: ast.type,
          value: this.transformAst(ast.value, address),
        }
      }
      case AstNodeType.PLUS_UNARY_OP: {
        return {
          ...ast,
          type: ast.type,
          value: this.transformAst(ast.value, address),
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return {
          ...ast,
          type: ast.type,
          procedureName: ast.procedureName,
          args: ast.args.map((arg) => this.transformAst(arg, address)),
        }
      }
      case AstNodeType.PARENTHESIS: {
        return {
          ...ast,
          type: ast.type,
          expression: this.transformAst(ast.expression, address),
        }
      }
      default: {
        return {
          ...ast,
          type: ast.type,
          left: this.transformAst(ast.left, address),
          right: this.transformAst(ast.right, address),
        } as Ast
      }
    }
  }

  protected abstract transformCellReferenceAst(ast: CellReferenceAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformCellRangeAst(ast: CellRangeAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformRowRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformCellAddress<T extends Address>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false
  protected abstract fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress
  protected transformRange<T extends Address>(start: T, end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
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
}

export class AddColumnsTransformer extends Transformer {
  constructor(
    private addedColumns: ColumnsSpan
  ) {
    super()
  }

  protected transformCellReferenceAst(ast: CellReferenceAst, formulaAddress: SimpleCellAddress): Ast {
    const newCellAddress = this.transformCellAddress(ast.reference, formulaAddress)
    if (newCellAddress instanceof CellAddress) {
      return {...ast, reference: newCellAddress}
    } else if (newCellAddress === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformCellRangeAst(ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellRangeAst | ErrorAst {
    const newRange = this.transformRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return { ...ast, start: newRange[0], end: newRange[1] }
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    const newRange = this.transformRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return { ...ast, start: newRange[0], end: newRange[1] }
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformRowRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformCellAddress<T extends AddressWithColumn>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false {
    const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
    // Case 4 and 5
    if ((absoluteDependencySheet !== this.addedColumns.sheet)
      && (formulaAddress.sheet !== this.addedColumns.sheet)) {
      return false
    }

    const absolutizedDependencyAddress = dependencyAddress.toSimpleColumnAddress(formulaAddress)

    // Case 3
    if ((absoluteDependencySheet === this.addedColumns.sheet)
      && (formulaAddress.sheet !== this.addedColumns.sheet)) {
      if (this.addedColumns.columnStart <= absolutizedDependencyAddress.col) {
        return dependencyAddress.shiftedByColumns(this.addedColumns.numberOfColumns) as T
      } else {
        return false
      }
    }

    // Case 2
    if ((formulaAddress.sheet === this.addedColumns.sheet)
      && (absoluteDependencySheet !== this.addedColumns.sheet)) {
      if (dependencyAddress.isColumnAbsolute()) {
        return false
      }

      if (formulaAddress.col < this.addedColumns.columnStart) {
        return false
      }

      return dependencyAddress.shiftedByColumns(-this.addedColumns.numberOfColumns) as T
    }

    // Case 1
    if (dependencyAddress.isColumnAbsolute()) {
      if (dependencyAddress.col < this.addedColumns.columnStart) { // Case Aa
        return false
      } else { // Case Ab
        return dependencyAddress.shiftedByColumns(this.addedColumns.numberOfColumns) as T
      }
    } else {
      const absolutizedDependencyAddress = dependencyAddress.toSimpleColumnAddress(formulaAddress)
      if (absolutizedDependencyAddress.col < this.addedColumns.columnStart) {
        if (formulaAddress.col < this.addedColumns.columnStart) { // Case Raa
          return false
        } else { // Case Rab
          return dependencyAddress.shiftedByColumns(-this.addedColumns.numberOfColumns) as T
        }
      } else {
        if (formulaAddress.col < this.addedColumns.columnStart) { // Case Rba
          return dependencyAddress.shiftedByColumns(this.addedColumns.numberOfColumns) as T
        } else { // Case Rbb
          return false
        }
      }
    }
  }

  protected transformRange<T extends AddressWithColumn>(start: T, end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
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

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    if (this.addedColumns.sheet === address.sheet && this.addedColumns.columnStart <= address.col) {
      return {
        ...address,
        col: address.col + this.addedColumns.numberOfColumns,
      }
    } else {
      return address
    }
  }
}