import {IToken, tokenMatcher} from 'chevrotain'
import {SimpleCellAddress} from '../Cell'
import {RelativeDependency} from './'
import {cellAddressFromString, SheetMappingFn} from './addressRepresentationConverters'
import {Ast, AstNodeType, buildErrorAst, ParsingErrorType} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {Cache} from './Cache'
import {CellAddress, CellReferenceType} from './CellAddress'
import {FormulaLexer, FormulaParser} from './FormulaParser'
import {buildLexerConfig, CellReference, ILexerConfig, ProcedureName} from './LexerConfig'
import {ParserConfig} from './ParserConfig'

export interface ParsingResult {
  ast: Ast,
  hash: string,
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
      return { ast, hasVolatileFunction: false, hasStructuralChangeFunction: false, hash: '', dependencies: [] }
    }

    const hash = this.computeHashFromTokens(lexerResult.tokens, formulaAddress)

    let cacheResult = this.cache.get(hash)
    if (cacheResult) {
      ++this.statsCacheUsed
    } else {
      const parsingResult = this.formulaParser.parseFromTokens(lexerResult, formulaAddress)
      cacheResult = this.cache.set(hash, parsingResult)
    }
    const { ast, hasVolatileFunction, hasStructuralChangeFunction, relativeDependencies } = cacheResult

    return { ast, hasVolatileFunction, hasStructuralChangeFunction, hash, dependencies: relativeDependencies }
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
        return ast.value.toString()
      }
      case AstNodeType.STRING: {
        return '"' + ast.value + '"'
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.computeHashOfAstNode(arg)).join(this.config.functionArgSeparator)
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
        return '-' + this.computeHashOfAstNode(ast.value)
      }
      case AstNodeType.PERCENT_OP: {
        return this.computeHashOfAstNode(ast.value) + '%'
      }
      case AstNodeType.ERROR: {
        return '!ERR'
      }
      case AstNodeType.PARENTHESIS: {
        return '(' + this.computeHashOfAstNode(ast.expression) + ')'
      }
      default: {
        return this.computeHashOfAstNode(ast.left) + binaryOpTokenMap[ast.type] + this.computeHashOfAstNode(ast.right)
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
