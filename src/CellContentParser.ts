import {isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'

export enum CellContentType {
  NUMBER,
  STRING,
  FORMULA,
  MATRIX_FORMULA,
  EMPTY,
}

export class CellContentParser {
  public parse(content: string): CellContentType {
    if (isMatrix(content)) {
      return CellContentType.MATRIX_FORMULA
    } else if (isFormula(content)) {
      return CellContentType.FORMULA
    } else {
      if (content === '') {
        return CellContentType.EMPTY
      } else if (!isNaN(Number(content))) {
        return CellContentType.NUMBER
      } else {
        return CellContentType.STRING
      }
    }
  }
}
