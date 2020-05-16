/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

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
import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {NamedExpressionRangeDependency} from './RelativeDependency'


const collectDependenciesFn = (ast: Ast, functionRegistry: FunctionRegistry, dependenciesSet: RelativeDependency[]) => {
  switch (ast.type) {
    case AstNodeType.EMPTY:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
      return
    case AstNodeType.NAMED_EXPRESSION: {
      dependenciesSet.push(new NamedExpressionDependency(ast.expressionName))
      return
    }
    case AstNodeType.NAMED_EXPRESSION_RANGE: {
      dependenciesSet.push(new NamedExpressionRangeDependency(ast.start.expressionName, ast.end.expressionName))
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
      collectDependenciesFn(ast.value, functionRegistry, dependenciesSet)
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
      collectDependenciesFn(ast.left, functionRegistry, dependenciesSet)
      collectDependenciesFn(ast.right, functionRegistry, dependenciesSet)
      return
    case AstNodeType.PARENTHESIS:
      collectDependenciesFn(ast.expression, functionRegistry, dependenciesSet)
      return
    case AstNodeType.FUNCTION_CALL:
      if (!functionRegistry.doesFunctionNeedArgumentToBeComputed(ast.procedureName)) {
        ast.args.forEach((argAst: Ast) =>
          collectDependenciesFn(argAst, functionRegistry, dependenciesSet)
        )
      }
      return
  }
}

export const collectDependencies = (ast: Ast, functionRegistry: FunctionRegistry) => {
  const result = new Array<RelativeDependency>()
  collectDependenciesFn(ast, functionRegistry, result)
  return result
}
