import {CellDependency, getAbsoluteAddress, SimpleCellAddress} from '../Cell'
import {Ast, AstNodeType, buildErrorAst, ParsingErrorType} from './Ast'
import {Cache, RelativeDependency} from './Cache'
import {computeHash} from './computeHash'
import {FormulaLexer, parseFromTokens} from './FormulaParser'

export class ParserWithCaching {
  public statsCacheUsed: number = 0
  private cache: Cache = new Cache()
  private lexer: FormulaLexer

  constructor() {
    this.lexer = new FormulaLexer()
  }

  public parse(text: string, formulaAddress: SimpleCellAddress): { ast: Ast, dependencies: CellDependency[] } {
    const lexerResult = this.lexer.tokenizeFormula(text)

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
