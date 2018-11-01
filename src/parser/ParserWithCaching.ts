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

  parse(text: string, formulaAddress: CellAddress): Ast {
    if (this.optimizationMode === 'parser') {
      const lexerResult = tokenizeFormula(text);
      const hash = computeHash(lexerResult.tokens, formulaAddress);
      let ast = this.cache.get(hash)
      
      if (ast) {
        ++this.statsCacheUsed
      } else {
        ast = parseFromTokens(lexerResult, formulaAddress)
        this.cache.set(hash, ast)
      }

      return ast
    } else {
      throw new Error("Unsupported optimization mode")
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHash = (tokens: IToken[], baseAddress: CellAddress): string => {
  let hash = ""
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (tokenMatcher(token, CellReference)) {
      if (tokens[idx+1] && tokens[idx+2] && tokenMatcher(tokens[idx+1],RangeSeparator) && tokenMatcher(tokens[idx+2], CellReference)) {
        hash = hash.concat(`${cellHashFromToken(token, baseAddress)}:${cellHashFromToken(tokens[idx+2], baseAddress)}`)
        idx += 3
      } else {
        hash = hash.concat(cellHashFromToken(token, baseAddress))
        idx++
      }
    } else {
      hash = hash.concat(token.image)
      idx++
    }
  }
  return hash
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
