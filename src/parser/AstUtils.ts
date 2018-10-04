import {Ast, AstNodeType} from "./Ast";

export function getFormulaDependencies(ast: Ast) : Array<string> {
  switch (ast.type) {
    case AstNodeType.RELATIVE_CELL: {
      return [ast.address];
    }
    case AstNodeType.PLUS_OP:
    case AstNodeType.MINUS_OP:
    case AstNodeType.TIMES_OP: {
      return getFormulaDependencies(ast.left).concat(getFormulaDependencies(ast.right))
    }
    case AstNodeType.NUMBER: {
      return []
    }
  }
}
