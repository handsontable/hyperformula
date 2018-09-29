import {AstNodeType} from "../AstNodeType";

declare interface Ast {
  type: AstNodeType,
  args: [Ast | number | string]
}

declare class Parser {
  constructor()
  parse(text: string) : Ast
}

export { Parser, Ast }
