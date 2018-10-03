import {Parser, RawAst} from './Parser'
import {Ast, buildNumberAst, buildPlusOpAst, buildMinusOpAst, buildTimesOpAst, buildRelativeCellAst, AstNodeType} from "./Ast";

export class FullParser {
  private parser: Parser

  constructor() {
    this.parser = new Parser()
  }

  parse(text: string) : Ast {
    const rawAst = this.parser.parse(text)
    return buildAst(rawAst)
  }
}

function buildAst(rawAst: RawAst) : Ast {
  switch (rawAst.type) {
    case AstNodeType.RELATIVE_CELL:
      return buildRelativeCellAst(rawAst.args[0] as string)
    case AstNodeType.PLUS_OP:
      return buildPlusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case AstNodeType.MINUS_OP:
      return buildMinusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case AstNodeType.TIMES_OP:
      return buildTimesOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case AstNodeType.NUMBER:
      return buildNumberAst(rawAst.args[0] as number)
    default:
      throw Error("Unsupported AST node type")
  }
}
