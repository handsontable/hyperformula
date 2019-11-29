import {Ast, AstNodeType, RelativeDependency} from './'

const collectDependenciesFn = (ast: Ast, dependenciesSet: RelativeDependency[]) => {
  switch (ast.type) {
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
      return
    case AstNodeType.CELL_REFERENCE: {
      dependenciesSet.push(ast.reference)
      return
    }
    case AstNodeType.CELL_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push([ast.start, ast.end])
      }
      return
    }
    case AstNodeType.PERCENT_OP:
    case AstNodeType.MINUS_UNARY_OP: {
      collectDependenciesFn(ast.value, dependenciesSet)
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
      collectDependenciesFn(ast.left, dependenciesSet)
      collectDependenciesFn(ast.right, dependenciesSet)
      return
    case AstNodeType.FUNCTION_CALL:
      if (ast.procedureName !== 'COLUMNS') {
        ast.args.forEach((argAst: Ast) => collectDependenciesFn(argAst, dependenciesSet))
      }
      return
  }
}

export const collectDependencies = (ast: Ast) => {
  const result = new Array<RelativeDependency>()
  collectDependenciesFn(ast, result)
  return result
}
