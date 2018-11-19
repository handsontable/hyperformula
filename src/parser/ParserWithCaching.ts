import {IToken, tokenMatcher} from 'chevrotain'
import {absoluteCellAddress, CellAddress, cellAddressFromString, CellDependency, CellReferenceType, getAbsoluteAddress, relativeCellAddress, SimpleCellAddress, simpleCellAddressFromString} from '../Cell'
import {Ast, AstNodeType} from './Ast'
import {CellReference, parseFromTokens, RangeSeparator, RelativeCell, tokenizeFormula} from './FormulaParser'

type RelativeDependency = CellAddress | [CellAddress, CellAddress]

export class ParserWithCaching {
  public statsCacheUsed: number = 0
  private cache: Map<string, [Ast, RelativeDependency[]]> = new Map()
  private optimizationMode: string

  constructor(optimizationMode = 'parser') {
    this.optimizationMode = optimizationMode
  }

  public parse(text: string, formulaAddress: SimpleCellAddress): { ast: Ast, dependencies: CellDependency[] } {
    if (this.optimizationMode === 'parser') {
      const lexerResult = tokenizeFormula(text)
      const hash = computeHash(lexerResult.tokens, formulaAddress)
      const cacheResult = this.cache.get(hash)

      let ast, dependencies
      if (cacheResult) {
        ast = cacheResult[0]
        dependencies = absolutizeDependencies(cacheResult[1], formulaAddress)
        ++this.statsCacheUsed
      } else {
        ast = parseFromTokens(lexerResult, formulaAddress)
        const astRelativeDependencies: RelativeDependency[] = []
        collectDependencies(ast, astRelativeDependencies)
        dependencies = absolutizeDependencies(astRelativeDependencies, formulaAddress)
        this.cache.set(hash, [ast, astRelativeDependencies])
      }

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

const collectDependencies = (ast: Ast, dependenciesSet: RelativeDependency[]) => {
  switch (ast.type) {
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
      return
    case AstNodeType.CELL_REFERENCE: {
      dependenciesSet.push(ast.reference)
      return
    }
    case AstNodeType.CELL_RANGE: {
      dependenciesSet.push([ast.start, ast.end])
      return
    }
    case AstNodeType.MINUS_UNARY_OP: {
      collectDependencies(ast.value, dependenciesSet)
      return
    }
    case AstNodeType.MINUS_OP:
    case AstNodeType.PLUS_OP:
    case AstNodeType.TIMES_OP:
    case AstNodeType.DIV_OP:
      collectDependencies(ast.left, dependenciesSet)
      collectDependencies(ast.right, dependenciesSet)
      return
    case AstNodeType.FUNCTION_CALL:
      ast.args.forEach((argAst: Ast) => collectDependencies(argAst, dependenciesSet))
  }
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
