import {Parser, RawAst} from './Parser'
import {
  Ast,
  buildNumberAst,
  buildPlusOpAst,
  buildMinusOpAst,
  buildTimesOpAst,
  buildRelativeCellAst,
  AstNodeType
} from "./Ast";
import {parseFormula, AstBuilder} from "../chevro";

export class FullParser {
  private parser: Parser
  private builder: AstBuilder

  constructor() {
    this.parser = new Parser()
    this.builder = new AstBuilder()
  }

  parse(text: string): Ast {
    const cst = parseFormula(text)
    const ast = this.builder.visit(cst)
    return ast
  }
}

function buildAst(rawAst: RawAst): Ast {
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

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}
