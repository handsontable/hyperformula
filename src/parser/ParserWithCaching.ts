import {CellDependency, getAbsoluteAddress, SimpleCellAddress} from 'src/Cell'
import {Ast, AstNodeType, buildErrorAst, ParsingErrorType} from './Ast'
import {Cache, RelativeDependency} from './Cache'
import {computeHash} from './computeHash'
import {parseFromTokens, tokenizeFormula} from './FormulaParser'

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

      if (lexerResult.errors.length > 0) {
        const ast = buildErrorAst(lexerResult.errors.map((e) =>
            ({
              type: ParsingErrorType.LexingError,
              message: e.message,
            }),
        ))
        return { ast, dependencies: [] }
      }

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

const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map((dep) => {
    if (Array.isArray(dep)) {
      return [getAbsoluteAddress(dep[0], baseAddress), getAbsoluteAddress(dep[1], baseAddress)] as CellDependency
    } else {
      return getAbsoluteAddress(dep, baseAddress)
    }
  })
}
