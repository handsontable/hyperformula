import {AstNodeType} from "./Ast";

declare interface RawAst {
  type: AstNodeType,
  args: [RawAst | number | string]
}

declare class Parser {
  constructor()
  parse(text: string) : RawAst
}

export { Parser, RawAst }
