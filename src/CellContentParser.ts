import {ErrorType} from './Cell'
import {Config} from './Config'

export type RawCellContent = string | null | undefined

export namespace CellContent {
  export class Number {
    constructor(public readonly value: number) { }
  }

  export class String {
    constructor(public readonly value: string) { }
  }

  export class Empty {

    public static getSingletonInstance() {
      if (!Empty.instance) {
        Empty.instance = new Empty()
      }
      return Empty.instance
    }
    private static instance: Empty
  }

  export class Formula {
    constructor(public readonly formula: string) { }
  }

  export class MatrixFormula {
    constructor(public readonly formula: string) { }
  }

  export class Error {
    constructor(public readonly error: string) {
    }
  }

  export type Type = Number | String | Empty | Formula | MatrixFormula
}

/**
 * Checks whether string looks like formula or not.
 *
 * @param text - formula
 */
export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export function isMatrix(text: RawCellContent): Boolean {
  if (typeof text !== 'string') {
    return false
  }
  return (text.length > 1) && (text[0] === '{') && (text[text.length - 1] === '}')
}

export function isError(text: string): Boolean {
  return false
}

export class CellContentParser {
  constructor(private readonly config: Config) {}

  public parse(content: RawCellContent): CellContent.Type {
    if (content === undefined || content === null) {
      return CellContent.Empty.getSingletonInstance()
    }
    if (isMatrix(content)) {
      return new CellContent.MatrixFormula(content.substr(1, content.length - 2))
    } else if (isFormula(content)) {
      return new CellContent.Formula(content)
    } else if (isError(content)) {
      return new CellContent.Error(content)
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
