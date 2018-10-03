import {Parser, RawAst} from './Parser'
import {Ast, MinusOpAst, PlusOpAst, TimesOpAst, RelativeCellAst, NumberAst} from "./Ast";
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
      return new RelativeCellAst(rawAst.args[0] as string)
    case RawAstNodeType.PLUS_OP:
      return new PlusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case RawAstNodeType.MINUS_OP:
      return new MinusOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case RawAstNodeType.TIMES_OP:
      return new TimesOpAst(buildAst(rawAst.args[0] as RawAst), buildAst(rawAst.args[1] as RawAst))
    case RawAstNodeType.NUMBER:
      return new NumberAst(rawAst.args[0] as string)
    default:
      throw Error("Unsupported AST node type")
  }
}

function processArgs(args : Array<RawAst>) : Array<Ast> {
  return args.map((value) => {
    return buildAst(value as RawAst)
  })
};
