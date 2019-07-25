import assert from 'assert'
import {IToken, tokenMatcher} from 'chevrotain'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {Config} from '../Config'
import {Ast, AstNodeType, buildErrorAst, ParsingErrorType} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {Cache, RelativeDependency} from './Cache'
import {CellAddress, CellReferenceType} from './CellAddress'
import {cellAddressFromString, SheetMappingFn} from './cellAddressFromString'
import {FormulaLexer, FormulaParser} from './FormulaParser'
import {buildLexerConfig, CellReference, ILexerConfig} from './LexerConfig'

/**
 * Parses formula using caching if feasible.
 */
export class ParserWithCaching {
  public statsCacheUsed: number = 0
  private cache: Cache = new Cache()
  private lexer: FormulaLexer
  private readonly lexerConfig: ILexerConfig
  private formulaParser: FormulaParser

  constructor(
    private readonly config: Config,
    private readonly sheetMapping: SheetMappingFn,
  ) {
    this.lexerConfig = buildLexerConfig(config)
    this.lexer = new FormulaLexer(this.lexerConfig)
    this.formulaParser = new FormulaParser(this.lexerConfig, this.sheetMapping)
  }

  /**
   * Parses a formula.
   *
   * @param text - formula to parse
   * @param formulaAddress - address with regard to which formula should be parsed. Impacts computed addresses in R0C0 format.
   */
  public parse(text: string, formulaAddress: SimpleCellAddress): { ast: Ast, hasVolatileFunction: boolean, hash: string } {
    const lexerResult = this.lexer.tokenizeFormula(text)

    if (lexerResult.errors.length > 0) {
      const ast = buildErrorAst(lexerResult.errors.map((e) =>
          ({
            type: ParsingErrorType.LexingError,
            message: e.message,
          }),
      ))
      return { ast, hasVolatileFunction: false, hash: '' }
    }

    const hash = this.computeHash(lexerResult.tokens, formulaAddress)

    let cacheResult = this.cache.get(hash)
    if (cacheResult) {
      ++this.statsCacheUsed
    } else {
      const parsingResult = this.formulaParser.parseFromTokens(lexerResult, formulaAddress)
      cacheResult = this.cache.set(hash, parsingResult)
    }
    const { ast, hasVolatileFunction } = cacheResult

    return { ast, hasVolatileFunction, hash }
  }

  public computeHash(tokens: IToken[], baseAddress: SimpleCellAddress): string {
    let hash = ''
    let idx = 0
    while (idx < tokens.length) {
      const token = tokens[idx]
      if (tokenMatcher(token, CellReference)) {
        const cellAddress = cellAddressFromString(this.sheetMapping, token.image, baseAddress)
        hash = hash.concat(cellHashFromToken(cellAddress))
        idx++
      } else {
        hash = hash.concat(token.image)
        idx++
      }
    }
    return hash
  }

  public rememberNewAst(ast: Ast): Ast {
    const hash = this.computeHashFromAst(ast)
    return this.cache.maybeSetAndThenGet(hash, ast)
  }

  public computeHashFromAst(ast: Ast): string {
    return '=' + this.doHash(ast)
  }

  public getCache(): Cache {
    return this.cache
  }

  public getAbsolutizedParserResult(hash: string, baseAddress: SimpleCellAddress): { ast: Ast, dependencies: CellDependency[] } {
    const cacheElem = this.cache.get(hash)!
    assert.ok(cacheElem, `Hash ${hash} not present in cache`)
    return {
      ast: cacheElem.ast,
      dependencies: absolutizeDependencies(cacheElem.relativeDependencies, baseAddress),
    }
  }

  private doHash(ast: Ast): string {
    switch (ast.type) {
      case AstNodeType.NUMBER: {
        return ast.value.toString()
      }
      case AstNodeType.STRING: {
        return '"' + ast.value + '"'
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.doHash(arg)).join(this.config.functionArgSeparator)
        return ast.procedureName + '(' + args + ')'
      }
      case AstNodeType.CELL_REFERENCE: {
        return cellHashFromToken(ast.reference)
      }
      case AstNodeType.CELL_RANGE: {
        const start = cellHashFromToken(ast.start)
        const end = cellHashFromToken(ast.end)
        return start + ':' + end
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return '-' + this.doHash(ast.value)
      }
      case AstNodeType.ERROR: {
        return '!ERR'
      }
      default: {
        return this.doHash(ast.left) + binaryOpTokenMap[ast.type] + this.doHash(ast.right)
      }
    }
  }
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

/**
 * Converts dependencies from maybe relative addressing to absolute addressing.
 *
 * @param deps - list of addresses in R0C0 format
 * @param baseAddress - base address with regard to which make a convertion
 */
export const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map((dep) => {
    if (Array.isArray(dep)) {
      return new AbsoluteCellRange(dep[0].toSimpleCellAddress(baseAddress), dep[1].toSimpleCellAddress(baseAddress))
    } else {
      return dep.toSimpleCellAddress(baseAddress)
    }
  })
}

export const cellHashFromToken = (cellAddress: CellAddress): string => {
  switch (cellAddress.type) {
    case CellReferenceType.CELL_REFERENCE_RELATIVE: {
      return `#${cellAddress.sheet}#${cellAddress.row}R${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE: {
      return `#${cellAddress.sheet}#${cellAddress.row}A${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL: {
      return `#${cellAddress.sheet}#${cellAddress.row}AC${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW: {
      return `#${cellAddress.sheet}#${cellAddress.row}AR${cellAddress.col}`
    }
  }
}
