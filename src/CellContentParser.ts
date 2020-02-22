import {CellError, EmptyValue, EmptyValueType, ErrorType} from './Cell'
import {Config} from './Config'
import {DateHelper} from './DateHelper'

export type RawCellContent = Date | string | number | boolean | EmptyValueType | null | undefined

export namespace CellContent {
  export class Number {
    constructor(public readonly value: number) {
      if(value === 0) { // catches when value is -0
        this.value = 0
      }
    }
  }

  export class String {
    constructor(public readonly value: string) { }
  }

  export class Boolean {
    constructor(public readonly value: boolean) { }
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
    public readonly value: CellError
    constructor(errorType: ErrorType) {
      this.value = new CellError(errorType)
    }
  }

  export type Type = Number | String | Boolean | Empty | Formula | MatrixFormula | Error
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
  return (text.length > 1) && (text.startsWith('{')) && (text.endsWith('}'))
}

export function isError(text: string, errorMapping: Record<string, ErrorType>): Boolean {
  const upperCased = text.toUpperCase()
  const errorRegex = /#[A-Za-z0-9\/]+[?!]?/
  return errorRegex.test(upperCased) && Object.prototype.hasOwnProperty.call(errorMapping, upperCased)
}

export class CellContentParser {
  constructor(private readonly config: Config, private readonly dateHelper: DateHelper) {}

  public parse(content: RawCellContent): CellContent.Type {
    if (content === undefined || content === null || content === EmptyValue) {
      return CellContent.Empty.getSingletonInstance()
    } else if (typeof content === 'number') {
      if( isNaN(content) || content === Infinity || content === -Infinity) {
        return new CellContent.Error(ErrorType.NUM)
      } else {
        return new CellContent.Number(content)
      }
    } else if (typeof content === 'boolean') {
      return new CellContent.Boolean(content)
    } else if (content instanceof Date) {
      return new CellContent.Number(this.dateHelper.dateToNumber({day: content.getDate(), month: content.getMonth() + 1, year: content.getFullYear()}))
    } else if (isMatrix(content)) {
      return new CellContent.MatrixFormula(content.substr(1, content.length - 2))
    } else if (isFormula(content)) {
      return new CellContent.Formula(content)
    } else if (isError(content, this.config.errorMapping)) {
      return new CellContent.Error(this.config.errorMapping[content.toUpperCase()])
    } else {
      const trimmedContent = content.trim()
      if (trimmedContent !== '' && !isNaN(Number(trimmedContent))) {
        return new CellContent.Number(Number(trimmedContent))
      }
      const parsedDateNumber = this.dateHelper.dateStringToDateNumber(trimmedContent)
      if (parsedDateNumber !== null) {
        return new CellContent.Number(parsedDateNumber)
      } else {
        return new CellContent.String(
          content.startsWith('\'') ? content.slice(1) : content,
        )
      }
    }
  }
}
