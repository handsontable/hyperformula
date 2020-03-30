import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ParserWithCaching
} from '../parser'
import {ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {DependencyGraph} from '../DependencyGraph'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {Address} from '../parser/Address'

export interface FormulaTransformer {
  sheet: number,
  transform(graph: DependencyGraph, parser: ParserWithCaching): void,
  transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress],
}

export abstract class Transformer implements FormulaTransformer {
  protected constructor(
  ) {}

  public transform(graph: DependencyGraph, parser: ParserWithCaching): void {
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

  protected transformAst(ast: Ast, address: SimpleCellAddress): Ast {
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
      case AstNodeType.ROW_RANGE: {
        return this.transformRowRangeAst(ast, address)
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

  protected transformCellRangeAst(ast: CellRangeAst, formulaAddress: SimpleCellAddress): Ast {
    const newRange = this.transformCellRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return {...ast, start: newRange[0], end: newRange[1]}
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    const newRange = this.transformColumnRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return {...ast, start: newRange[0], end: newRange[1]}
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformRowRangeAst(ast: RowRangeAst, formulaAddress: SimpleCellAddress): Ast {
    const newRange = this.transformRowRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return {...ast, start: newRange[0], end: newRange[1]}
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected abstract transformCellAddress<T extends Address>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false
  protected abstract transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false
  protected abstract transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false
  protected abstract transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false
  protected abstract fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress
  public abstract get sheet(): number
}