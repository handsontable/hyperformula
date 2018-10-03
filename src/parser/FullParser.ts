import {Parser, RawAst} from './Parser'
import {Ast} from './Ast'
import {buildAst} from './AstBuilder'

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

