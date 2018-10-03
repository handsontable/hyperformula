import {RawAst} from "./parser";
import {AstNodeType, MinusOpAst, PlusOpAst, RelativeCellAst, NumberAst, Ast} from "../AstNodeType";


export function buildAst(rawAst: RawAst) : Ast {
  switch (rawAst.type) {
    case AstNodeType.RELATIVE_CELL:
      return new RelativeCellAst(rawAst.args as Array<string>)
    case AstNodeType.PLUS_OP:
      return new PlusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case AstNodeType.MINUS_OP:
      return new MinusOpAst(buildAst(rawAst.args[0] as RawAst), processArgs(rawAst.args as Array<RawAst>))
    case AstNodeType.NUMBER:
      return new NumberAst(rawAst.args as Array<string>)
    default:
      throw Error("Unsupported AST node type")
  }
}

function processArgs(args : Array<RawAst>) : Array<Ast> {
  return args.map((value) => {
    return buildAst(value as RawAst)
  })
};
