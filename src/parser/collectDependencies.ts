/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {Maybe} from '../Maybe'
import {
  AddressDependency,
  Ast,
  AstNodeType,
  CellRangeDependency,
  ColumnRangeDependency,
  NamedExpressionDependency,
  RelativeDependency,
  RowRangeDependency
} from './'

const collectDependenciesFn = (ast: Ast, functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>, dependenciesSet: RelativeDependency[]) => {
  switch (ast.type) {
    case AstNodeType.EMPTY:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
      return
    case AstNodeType.NAMED_EXPRESSION: {
      dependenciesSet.push(new NamedExpressionDependency(ast.namedExpression))
      return
    }
    case AstNodeType.CELL_REFERENCE: {
      dependenciesSet.push(new AddressDependency(ast.reference))
      return
    }
    case AstNodeType.CELL_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push(new CellRangeDependency(ast.start, ast.end))
      }
      return
    }
    case AstNodeType.COLUMN_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push(new ColumnRangeDependency(ast.start, ast.end))
      }
      return
    }
    case AstNodeType.ROW_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push(new RowRangeDependency(ast.start, ast.end))
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
    case AstNodeType.PARENTHESIS:
      collectDependenciesFn(ast.expression, functionsWhichDoesNotNeedArgumentsToBeComputed, dependenciesSet)
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
