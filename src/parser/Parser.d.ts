import {RawAstNodeType} from "./RawAstNodeType";

declare interface RawAst {
  type: RawAstNodeType,
  args: [RawAst | number | string]
}

declare class Parser {
  constructor()
  parse(text: string) : RawAst
}

export { Parser, RawAst }
