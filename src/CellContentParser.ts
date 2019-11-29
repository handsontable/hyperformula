export type RawCellContent = string | null | undefined

export namespace CellContent {
  export class Number {
    constructor(public readonly value: number) { }
  }

  export class String {
    constructor(public readonly value: string) { }
  }

  export class Empty {
    private static instance: Empty

    public static getSingletonInstance() {
      if (!Empty.instance) {
        Empty.instance = new Empty()
      }
      return Empty.instance
    }
  }

  export class Formula {
    constructor(public readonly formula: string) { }
  }

  export class MatrixFormula {
    constructor(public readonly formula: string) { }
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

export function isMatrix(text: string): Boolean {
  return (text.length > 1) && (text[0] === '{') && (text[text.length - 1] === '}')
}

export class CellContentParser {
  public parse(content: RawCellContent): CellContent.Type {
    if (content === undefined || content === null) {
      return CellContent.Empty.getSingletonInstance()
    }
    if (isMatrix(content)) {
      return new CellContent.MatrixFormula(content.substr(1, content.length - 2))
    } else if (isFormula(content)) {
      return new CellContent.Formula(content)
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
