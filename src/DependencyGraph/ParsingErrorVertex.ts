import {CellError, ErrorType} from '../Cell'
import {ParsingError} from '../parser/Ast'

export class ParsingErrorVertex {
  constructor(
    public readonly errors: ParsingError,
    public readonly rawInput: string
  ) {}

  public getCellValue(): CellError {
    return new CellError(ErrorType.ERROR, 'Parsing error')
  }

  public getFormula(): string {
    return this.rawInput
  }
}
