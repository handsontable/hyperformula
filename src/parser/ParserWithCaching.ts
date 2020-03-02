import {IToken, tokenMatcher} from 'chevrotain'
import {SimpleCellAddress} from '../Cell'
import {RelativeDependency} from './'
import {cellAddressFromString, SheetMappingFn} from './addressRepresentationConverters'
import {Ast, AstNodeType, buildErrorAst, imageWithWhitespace, ParsingErrorType} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {Cache} from './Cache'
import {CellAddress, CellReferenceType} from './CellAddress'
import {FormulaLexer, FormulaParser, IExtendedToken} from './FormulaParser'
import {buildLexerConfig, CellReference, ILexerConfig, ProcedureName, WhiteSpace} from './LexerConfig'
import {ParserConfig} from './ParserConfig'
import {formatNumber} from './Unparser'

export interface ParsingResult {
  ast: Ast,
  dependencies: RelativeDependency[],
  hasVolatileFunction: boolean,
  hasStructuralChangeFunction: boolean,
}

/**
 * Parses formula using caching if feasible.
 */
export class ParserWithCaching {
  public statsCacheUsed: number = 0
  private cache: Cache
  private lexer: FormulaLexer
  private readonly lexerConfig: ILexerConfig
  private formulaParser: FormulaParser

  constructor(
    private readonly config: ParserConfig,
    private readonly sheetMapping: SheetMappingFn,
  ) {
    this.lexerConfig = buildLexerConfig(config)
    this.lexer = new FormulaLexer(this.lexerConfig)
    this.formulaParser = new FormulaParser(this.lexerConfig, this.sheetMapping)
    this.cache = new Cache(this.config.volatileFunctions(), this.config.structuralChangeFunctions())
  }

  /**
   * Parses a formula.
   *
   * @param text - formula to parse
   * @param formulaAddress - address with regard to which formula should be parsed. Impacts computed addresses in R0C0 format.
   */
  public parse(text: string, formulaAddress: SimpleCellAddress): ParsingResult {
    const lexerResult = this.lexer.tokenizeFormula(text)

    if (lexerResult.errors.length > 0) {
      const ast = buildErrorAst(lexerResult.errors.map((e) =>
        ({
          type: ParsingErrorType.LexingError,
          message: e.message,
        }),
      ))
      return {ast, hasVolatileFunction: false, hasStructuralChangeFunction: false, dependencies: []}
    }

    const hash = this.computeHashFromTokens(lexerResult.tokens, formulaAddress)

    let cacheResult = this.cache.get(hash)
    if (cacheResult) {
      ++this.statsCacheUsed
    } else {
      const processedTokens = bindWhitespacesToTokens(lexerResult.tokens)
      const parsingResult = this.formulaParser.parseFromTokens(processedTokens, formulaAddress)
      cacheResult = this.cache.set(hash, parsingResult)
    }
    const {ast, hasVolatileFunction, hasStructuralChangeFunction, relativeDependencies} = cacheResult

    return {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies: relativeDependencies}
  }

  public fetchCachedResult(hash: string): ParsingResult {
    const cacheResult = this.cache.get(hash)
    if (cacheResult === null) {
      throw new Error('There is no AST with such key in the cache')
    } else {
      const {ast, hasVolatileFunction, hasStructuralChangeFunction, relativeDependencies} = cacheResult
      return {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies: relativeDependencies}
    }
  }

  public computeHashFromTokens(tokens: IToken[], baseAddress: SimpleCellAddress): string {
    let hash = ''
    let idx = 0
    while (idx < tokens.length) {
      const token = tokens[idx]
      if (tokenMatcher(token, CellReference)) {
        const cellAddress = cellAddressFromString(this.sheetMapping, token.image, baseAddress)
        if (cellAddress === undefined) {
          hash = hash.concat('!REF')
        } else {
          hash = hash.concat(cellHashFromToken(cellAddress))
        }
        idx++
      } else if (tokenMatcher(token, ProcedureName)) {
        const procedureName = token.image.toUpperCase().slice(0, -1)
        const canonicalProcedureName = this.lexerConfig.functionMapping[procedureName] || procedureName
        hash = hash.concat(canonicalProcedureName, '(')
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
    return '=' + this.computeHashOfAstNode(ast)
  }

  public destroy(): void {
    this.cache.destroy()
  }

  private computeHashOfAstNode(ast: Ast): string {
    switch (ast.type) {
      case AstNodeType.NUMBER: {
        return imageWithWhitespace(formatNumber(ast.value, this.config.decimalSeparator), ast.leadingWhitespace)
      }
      case AstNodeType.STRING: {
        return imageWithWhitespace('"' + ast.value + '"', ast.leadingWhitespace)
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.computeHashOfAstNode(arg)).join(this.config.functionArgSeparator)
        const rightPart = ast.procedureName + '(' + args + imageWithWhitespace(')', ast.internalWhitespace)
        return imageWithWhitespace(rightPart, ast.leadingWhitespace)
      }
      case AstNodeType.CELL_REFERENCE: {
        return imageWithWhitespace(cellHashFromToken(ast.reference), ast.leadingWhitespace)
      }
      case AstNodeType.CELL_RANGE: {
        const start = cellHashFromToken(ast.start)
        const end = cellHashFromToken(ast.end)
        return imageWithWhitespace(start + ':' + end, ast.leadingWhitespace)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return imageWithWhitespace('-' + this.computeHashOfAstNode(ast.value), ast.leadingWhitespace)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        return imageWithWhitespace('+' + this.computeHashOfAstNode(ast.value), ast.leadingWhitespace)
      }
      case AstNodeType.PERCENT_OP: {
        return this.computeHashOfAstNode(ast.value) + imageWithWhitespace('%', ast.leadingWhitespace)
      }
      case AstNodeType.ERROR: {
        let image
        if (ast.error) {
          image = this.config.getErrorTranslationFor(ast.error.type)
        } else {
          image = '#ERR!'
        }
        return imageWithWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.PARENTHESIS: {
        const expression = this.computeHashOfAstNode(ast.expression)
        const rightPart = '(' + expression + imageWithWhitespace(')', ast.internalWhitespace)
        return imageWithWhitespace(rightPart, ast.leadingWhitespace)
      }
      default: {
        return this.computeHashOfAstNode(ast.left) + imageWithWhitespace(binaryOpTokenMap[ast.type], ast.leadingWhitespace) + this.computeHashOfAstNode(ast.right)
      }
    }
  }
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

export function bindWhitespacesToTokens(tokens: IToken[]): IExtendedToken[] {
  const processedTokens: IExtendedToken[] = []

  const first = tokens[0]
  if (!tokenMatcher(first, WhiteSpace)) {
    processedTokens.push(first)
  }

  for (let i = 1; i < tokens.length; ++i) {
    const current = tokens[i] as IExtendedToken
    if (tokenMatcher(current, WhiteSpace)) {
      continue
    }

    const previous = tokens[i - 1]
    if (tokenMatcher(previous, WhiteSpace)) {
      current.leadingWhitespace = previous
    }
    processedTokens.push(current)
  }

  return processedTokens
}
