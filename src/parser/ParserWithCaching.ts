import {parseFromTokens, RangeSeparator, CellReference, RelativeCell, tokenizeFormula} from "./FormulaParser";
import {IToken, tokenMatcher} from "chevrotain"
import {Ast} from "./Ast";
import {absoluteCellAddress, CellAddress, CellDependency, relativeCellAddress, cellAddressFromString, CellReferenceType} from "../Cell"

export class ParserWithCaching {
  private cache: Map<string, Ast> = new Map()
  public statsCacheUsed: number = 0
  private optimizationMode: string

  constructor(optimizationMode = 'parser') {
    this.optimizationMode = optimizationMode
  }

  parse(text: string, formulaAddress: CellAddress): { ast: Ast, dependencies: CellDependency[] } {
    if (this.optimizationMode === 'parser') {
      const lexerResult = tokenizeFormula(text);
      const { hash, dependencies } = computeHash(lexerResult.tokens, formulaAddress);
      let ast = this.cache.get(hash)
      
      if (ast) {
        ++this.statsCacheUsed
      } else {
        ast = parseFromTokens(lexerResult, formulaAddress)
        this.cache.set(hash, ast)
      }

      return { ast, dependencies }
    } else {
      throw new Error("Unsupported optimization mode")
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHash = (tokens: IToken[], baseAddress: CellAddress): { hash: string, dependencies: CellDependency[] } => {
  let hash = ""
  let dependencies: CellDependency[] = []
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (tokenMatcher(token, CellReference)) {
      if (tokens[idx+1] && tokens[idx+2] && tokenMatcher(tokens[idx+1],RangeSeparator) && tokenMatcher(tokens[idx+2], CellReference)) {
        hash = hash.concat(`${cellHashFromToken(token, baseAddress)}:${cellHashFromToken(tokens[idx+2], baseAddress)}`)
        dependencies.push([absoluteCellAddressFromString(token.image), absoluteCellAddressFromString(tokens[idx+2].image)])
        idx += 3
      } else {
        hash = hash.concat(cellHashFromToken(token, baseAddress))
        dependencies.push(absoluteCellAddressFromString(token.image))
        idx++
      }
    } else {
      hash = hash.concat(token.image)
      idx++
    }
  }
  return { hash, dependencies }
}

const cellHashFromToken = (token: IToken, baseAddress: CellAddress): string => {
  const cellAddress = cellAddressFromString(token.image, baseAddress)
  switch(cellAddress.type) {
    case CellReferenceType.CELL_REFERENCE_RELATIVE: {
      return `#${cellAddress.row}R${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE: {
      return `#${cellAddress.row}A${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL: {
      return `#${cellAddress.row}AC${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW: {
      return `#${cellAddress.row}AR${cellAddress.col}`
    }
  }
}

const absoluteCellAddressFromString = (stringAddress: string): CellAddress => {
  const result = stringAddress.match(/\$?([A-Z]+)\$?([0-9]+)/)!

    let col
  if (result[1].length === 1) {
    col = result[1].charCodeAt(0) - 65
  } else {
    col = result[1].split("").reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.charCodeAt(0) - 64)
    }, 0) - 1;
  }

  const row = Number(result[2] as string) - 1
  return absoluteCellAddress(col, row)
}
