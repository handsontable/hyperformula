/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellReferenceAst,
  ParserWithCaching,
} from '../parser'
import {ColumnReferenceOrNamedExperssionAst, RangeOpAst, RowReferenceAst} from '../parser/Ast'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'

export interface FormulaTransformer {
  sheet: number,
  isIrreversible(): boolean,
  performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void,
  transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress],
}

export abstract class Transformer implements FormulaTransformer {
  public abstract get sheet(): number

  public performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void {
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
      case AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION:
      case AstNodeType.ROW_REFERENCE: {
        throw  Error('Shouldnt happen')
      }
      case AstNodeType.RANGE_OP: {
        return this.transformCellRangeAst(ast, address)
      }
      case AstNodeType.EMPTY:
      case AstNodeType.ERROR:
      case AstNodeType.NUMBER:
      case AstNodeType.ERROR_WITH_RAW_INPUT:
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

  protected transformCellRangeAst(ast: RangeOpAst, formulaAddress: SimpleCellAddress): Ast {
    let references: any
    if (ast.left.type === AstNodeType.CELL_REFERENCE && ast.right.type === AstNodeType.CELL_REFERENCE) {
      references = this.transformCellRange(ast.left.reference, ast.right.reference, formulaAddress)
    } else if (ast.left.type === AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION && ast.right.type === AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION) {
      references = this.transformColumnRange(ast.left.reference, ast.right.reference, formulaAddress)
    } else if (ast.left.type === AstNodeType.ROW_REFERENCE && ast.right.type === AstNodeType.ROW_REFERENCE) {
      references = this.transformRowRange(ast.left.reference, ast.right.reference, formulaAddress)
    } else {
      throw Error('WUT')
    }

    if (Array.isArray(references)) {
      return {...ast, left: references[0], right: references[1]}
    } else if (references === ErrorType.REF) {
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
  public abstract isIrreversible(): boolean
}
