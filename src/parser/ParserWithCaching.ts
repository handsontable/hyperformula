import {IToken, tokenMatcher} from 'chevrotain'
import {absoluteCellAddress, CellAddress, cellAddressFromString, CellDependency, CellReferenceType, getAbsoluteAddress, relativeCellAddress, SimpleCellAddress, simpleCellAddressFromString} from '../Cell'
import {Ast, AstNodeType} from './Ast'
import {Cache, RelativeDependency} from './Cache'
import {CellReference, parseFromTokens, RangeSeparator, RelativeCell, tokenizeFormula} from './FormulaParser'

export class ParserWithCaching {
  public statsCacheUsed: number = 0
  private cache: Cache = new Cache()
  private optimizationMode: string

  constructor(optimizationMode = 'parser') {
    this.optimizationMode = optimizationMode
  }

  public parse(text: string, formulaAddress: SimpleCellAddress): { ast: Ast, dependencies: CellDependency[] } {
    if (this.optimizationMode === 'parser') {
      const lexerResult = tokenizeFormula(text)
      const hash = computeHash(lexerResult.tokens, formulaAddress)

      let cacheResult = this.cache.get(hash)
      if (cacheResult) {
        ++this.statsCacheUsed
      } else {
        const ast = parseFromTokens(lexerResult, formulaAddress)
        cacheResult = this.cache.set(hash, ast)
      }
      const { ast, relativeDependencies } = cacheResult
      const dependencies = absolutizeDependencies(relativeDependencies, formulaAddress)

      if (ast.type === AstNodeType.ERROR) {
        return { ast, dependencies: [] }
      } else {
        return { ast, dependencies }
      }
    } else {
      throw new Error('Unsupported optimization mode')
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHash = (tokens: IToken[], baseAddress: SimpleCellAddress): string => {
  let hash = ''
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (tokenMatcher(token, CellReference)) {
      const cellAddress = cellAddressFromString(token.image, baseAddress)
      hash = hash.concat(cellHashFromToken(cellAddress))
      idx++
    } else {
      hash = hash.concat(token.image)
      idx++
    }
  }
  return hash
}

const cellHashFromToken = (cellAddress: CellAddress): string => {
  switch (cellAddress.type) {
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

const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map((dep) => {
    if (Array.isArray(dep)) {
      return [getAbsoluteAddress(dep[0], baseAddress), getAbsoluteAddress(dep[1], baseAddress)] as CellDependency
    } else {
      return getAbsoluteAddress(dep, baseAddress)
    }
  })
}
