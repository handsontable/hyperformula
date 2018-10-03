import {Parser, RawAst} from './Parser'
import {Ast, buildNumberAst, buildPlusOpAst, buildMinusOpAst, buildTimesOpAst, buildRelativeCellAst} from "./Ast";
import {RawAstNodeType} from "./RawAstNodeType"

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
    case RawAstNodeType.RELATIVE_CELL:
      return buildRelativeCellAst(rawAst.args[0] as string)
    case RawAstNodeType.PLUS_OP:
      return buildPlusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case RawAstNodeType.MINUS_OP:
      return buildMinusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case RawAstNodeType.TIMES_OP:
      return buildTimesOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case RawAstNodeType.NUMBER:
      return buildNumberAst(rawAst.args[0] as number)
    default:
      throw Error("Unsupported AST node type")
  }
}
