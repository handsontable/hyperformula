import {Address} from './common'
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

  protected abstract transformCellRangeAst(ast: CellRangeAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformRowRangeAst(ast: RowRangeAst, formulaAddress: SimpleCellAddress): Ast
  protected abstract transformCellAddress<T extends Address>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false
  protected abstract fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress

  protected transformCellReferenceAst<T extends Address>(ast: CellReferenceAst, formulaAddress: SimpleCellAddress): Ast {
    const newCellAddress = this.transformCellAddress(ast.reference, formulaAddress)
    if (newCellAddress instanceof CellAddress) {
      return {...ast, reference: newCellAddress}
    } else if (newCellAddress === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }
}