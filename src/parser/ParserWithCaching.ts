import {CellDependency, getAbsoluteAddress, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {Ast, AstNodeType, buildErrorAst, ParsingErrorType} from './Ast'
import {Cache, RelativeDependency} from './Cache'
import {computeHash} from './computeHash'
import {FormulaLexer, FormulaParser} from './FormulaParser'
import {buildLexerConfig, ILexerConfig} from './LexerConfig'

export class ParserWithCaching {
  public statsCacheUsed: number = 0
  private cache: Cache = new Cache()
  private lexer: FormulaLexer
  private lexerConfig: ILexerConfig
  private formulaParser: FormulaParser

  constructor(
    private readonly config: Config,
  ) {
    this.lexerConfig = buildLexerConfig(config) 
    this.lexer = new FormulaLexer(this.lexerConfig)
    this.formulaParser = new FormulaParser(this.lexerConfig)
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
      const ast = this.formulaParser.parseFromTokens(lexerResult, formulaAddress)
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
