/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {Maybe} from '../Maybe'
import {Ast, AstNodeType, RelativeDependency} from './'
import {RelativeDependencyType} from './RelativeDependency'

const collectDependenciesFn = (ast: Ast, functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>, dependenciesSet: RelativeDependency[]) => {
  switch (ast.type) {
    case AstNodeType.EMPTY:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
      return
    case AstNodeType.CELL_REFERENCE: {
      dependenciesSet.push({
        type: RelativeDependencyType.CellAddress,
        dependency: ast.reference
      })
      return
    }
    case AstNodeType.CELL_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push({
          type: RelativeDependencyType.CellRange,
          dependency: [ast.start, ast.end]
        })
      }
      return
    }
    case AstNodeType.COLUMN_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push({
          type: RelativeDependencyType.ColumnRange,
          dependency: [ast.start, ast.end]
        })
      }
      return
    }
    case AstNodeType.ROW_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push({
          type: RelativeDependencyType.RowRange,
          dependency: [ast.start, ast.end]
        })
      }
      return
    }
    case AstNodeType.PERCENT_OP:
    case AstNodeType.PLUS_UNARY_OP:
    case AstNodeType.MINUS_UNARY_OP: {
      collectDependenciesFn(ast.value, functionsWhichDoesNotNeedArgumentsToBeComputed, dependenciesSet)
      return
    }
    case AstNodeType.CONCATENATE_OP:
    case AstNodeType.EQUALS_OP:
    case AstNodeType.NOT_EQUAL_OP:
    case AstNodeType.LESS_THAN_OP:
    case AstNodeType.GREATER_THAN_OP:
    case AstNodeType.LESS_THAN_OR_EQUAL_OP:
    case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
    case AstNodeType.MINUS_OP:
    case AstNodeType.PLUS_OP:
    case AstNodeType.TIMES_OP:
    case AstNodeType.DIV_OP:
    case AstNodeType.POWER_OP:
      collectDependenciesFn(ast.left, functionsWhichDoesNotNeedArgumentsToBeComputed, dependenciesSet)
      collectDependenciesFn(ast.right, functionsWhichDoesNotNeedArgumentsToBeComputed, dependenciesSet)
      return
    case AstNodeType.FUNCTION_CALL:
      if (!functionsWhichDoesNotNeedArgumentsToBeComputed.has(ast.procedureName)) {
        ast.args.forEach((argAst: Ast) =>
          collectDependenciesFn(argAst, functionsWhichDoesNotNeedArgumentsToBeComputed, dependenciesSet)
        )
      }
      return
  }
}

export const collectDependencies = (ast: Ast, functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>) => {
  const result = new Array<RelativeDependency>()
  collectDependenciesFn(ast, functionsWhichDoesNotNeedArgumentsToBeComputed, result)
  return result
}
