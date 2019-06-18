import {AstNodeType} from './Ast'

export const binaryOpTokenMap = {
  [AstNodeType.PLUS_OP]: "+",
  [AstNodeType.MINUS_OP]: "-",
  [AstNodeType.TIMES_OP]: "*",
  [AstNodeType.DIV_OP]: "/",
  [AstNodeType.CONCATENATE_OP]: "&",
  [AstNodeType.POWER_OP]: "^",
  [AstNodeType.EQUALS_OP]: "=",
  [AstNodeType.NOT_EQUAL_OP]: "<>",
  [AstNodeType.GREATER_THAN_OP]: ">",
  [AstNodeType.GREATER_THAN_OR_EQUAL_OP]: ">=",
  [AstNodeType.LESS_THAN_OP]: "<",
  [AstNodeType.LESS_THAN_OR_EQUAL_OP]: "<=",
}
