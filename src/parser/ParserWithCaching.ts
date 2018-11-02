import {parseFromTokens, RangeSeparator, CellReference, RelativeCell, tokenizeFormula} from "./FormulaParser";
import {IToken, tokenMatcher} from "chevrotain"
import {Ast, AstNodeType} from "./Ast";
import {absoluteCellAddress, getAbsoluteAddress, simpleCellAddressFromString, CellAddress, SimpleCellAddress, CellDependency, relativeCellAddress, cellAddressFromString, CellReferenceType} from "../Cell"

export class ParserWithCaching {
  private cache: Map<string, Ast> = new Map()
  public statsCacheUsed: number = 0
  private optimizationMode: string

  constructor(optimizationMode = 'parser') {
    this.optimizationMode = optimizationMode
  }

  parse(text: string, formulaAddress: SimpleCellAddress): { ast: Ast, dependencies: CellDependency[] } {
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

      if (ast.type === AstNodeType.ERROR) {
        return { ast, dependencies: [] }
      } else {
        return { ast, dependencies }
      }
    } else {
      throw new Error("Unsupported optimization mode")
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHash = (tokens: IToken[], baseAddress: SimpleCellAddress): { hash: string, dependencies: CellDependency[] } => {
  let hash = ""
  let dependencies: CellDependency[] = []
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (tokenMatcher(token, CellReference)) {
      if (tokens[idx+1] && tokens[idx+2] && tokenMatcher(tokens[idx+1],RangeSeparator) && tokenMatcher(tokens[idx+2], CellReference)) {
        const cellAddress1 = cellAddressFromString(token.image, baseAddress)
        const cellAddress2 = cellAddressFromString(tokens[idx+2].image, baseAddress)
        hash = hash.concat(`${cellHashFromToken(cellAddress1)}:${cellHashFromToken(cellAddress2)}`)
        dependencies.push([getAbsoluteAddress(cellAddress1, baseAddress), getAbsoluteAddress(cellAddress2, baseAddress)])
        idx += 3
      } else {
        const cellAddress = cellAddressFromString(token.image, baseAddress)
        hash = hash.concat(cellHashFromToken(cellAddress))
        dependencies.push(getAbsoluteAddress(cellAddress, baseAddress))
        idx++
      }
    } else {
      hash = hash.concat(token.image)
      idx++
    }
  }
  return { hash, dependencies }
}

const cellHashFromToken = (cellAddress: CellAddress): string => {
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
