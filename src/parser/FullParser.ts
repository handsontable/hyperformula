import {Parser, RawAst} from './Parser'

export class FullParser {
  private parser: Parser

  constructor() {
    this.parser = new Parser()
  }

  parse(text: string) : RawAst {
    const rawAst = this.parser.parse(text)
    return rawAst
  }
}

