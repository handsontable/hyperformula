/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ParserWithCaching,
} from '../parser'
import {ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'

export interface FormulaTransformer {
  sheet: number,

  isIrreversible(): boolean,

  performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void,

  transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress],
}

export abstract class Transformer implements FormulaTransformer {
  public abstract get sheet(): number

  public performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void {
    for (const node of graph.arrayFormulaNodes()) {
      const [newAst, newAddress] = this.transformSingleAst(node.getFormula(graph.lazilyTransformingAstService), node.getAddress(graph.lazilyTransformingAstService))
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

  public abstract isIrreversible(): boolean

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
      case AstNodeType.EMPTY:
      case AstNodeType.ERROR:
      case AstNodeType.NUMBER:
      case AstNodeType.NAMED_EXPRESSION:
      case AstNodeType.ERROR_WITH_RAW_INPUT:
      case AstNodeType.STRING: {
        return ast
      }
      case AstNodeType.PERCENT_OP:
      case AstNodeType.MINUS_UNARY_OP:
      case AstNodeType.PLUS_UNARY_OP: {
        return {
          ...ast,
          value: this.transformAst(ast.value, address),
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return {
          ...ast,
          procedureName: ast.procedureName,
          args: ast.args.map((arg) => this.transformAst(arg, address)),
        }
      }
      case AstNodeType.PARENTHESIS: {
        return {
          ...ast,
          expression: this.transformAst(ast.expression, address),
        }
      }
      case AstNodeType.ARRAY: {
        return {
          ...ast,
          args: ast.args.map((row) => row.map(val => this.transformAst(val, address)))
        }
      }
      default: {
        return {
          ...ast,
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

  protected abstract transformCellAddress<T extends CellAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false

  protected abstract transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false

  protected abstract transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false

  protected abstract transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false

  protected abstract fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress
}
