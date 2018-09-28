declare interface Ast {
  type: string,
  args: [Ast | number | string]
}

declare class Parser {
  constructor()
  parse(text: string) : Ast
}

export { Parser, Ast }