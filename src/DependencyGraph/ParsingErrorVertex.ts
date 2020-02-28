import {ParsingError} from '../parser/Ast'

export class ParsingErrorVertex {
  constructor(
    public readonly errors: ParsingError,
    public readonly rawInput: string
  ) {}
}
