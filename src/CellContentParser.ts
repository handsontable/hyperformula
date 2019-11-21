import {isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'

export type RawCellContent = string

export namespace CellContent {
  export class Number {
    constructor(public readonly value: number) { }
  }

  export class String {
    constructor(public readonly value: string) { }
  }

  export class Empty { }

  export class Formula {
    constructor(public readonly formula: string) { }
  }

  export class MatrixFormula {
    constructor(public readonly formula: string) { }
  }

  export type Type = Number | String | Empty | Formula | MatrixFormula
}

export class CellContentParser {
  public parse(content: RawCellContent): CellContent.Type {
    if (isMatrix(content)) {
      return new CellContent.MatrixFormula(content.substr(1, content.length - 2))
    } else if (isFormula(content)) {
      return new CellContent.Formula(content)
    } else if (content === '') {
      return new CellContent.Empty()
    } else {
      const trimmedContent = content.trim()
      if (trimmedContent !== '' && !isNaN(Number(trimmedContent))) {
        return new CellContent.Number(Number(trimmedContent))
      } else {
        return new CellContent.String(content)
      }
    }
  }
}
