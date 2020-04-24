/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {IToken, tokenMatcher} from 'chevrotain'
import {ErrorType, SimpleCellAddress} from '../Cell'
import {AstNodeType, buildParsingErrorAst, RelativeDependency} from './'
import {
  cellAddressFromString,
  columnAddressFromString,
  rowAddressFromString,
  SheetMappingFn,
} from './addressRepresentationConverters'
import {Ast, imageWithWhitespace, ParsingError, ParsingErrorType, RangeSheetReferenceType} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {Cache} from './Cache'
import {FormulaLexer, FormulaParser, IExtendedToken} from './FormulaParser'
import {
  buildLexerConfig,
  CellReference,
  ColumnReference,
  ILexerConfig,
  ProcedureName,
  RowReference,
  WhiteSpace,
} from './LexerConfig'
import {ParserConfig} from './ParserConfig'
import {formatNumber} from './Unparser'
import {RowAddress} from './RowAddress'

export interface ParsingResult {
  ast: Ast,
  errors: ParsingError[],
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
    this.cache = new Cache(this.config.volatileFunctions(), this.config.structuralChangeFunctions(), this.config.functionsWhichDoesNotNeedArgumentsToBeComputed())
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
      const errors = lexerResult.errors.map((e) =>
        ({
          type: ParsingErrorType.LexingError,
          message: e.message,
        }),
      )
      return { ast: buildParsingErrorAst(), errors, hasVolatileFunction: false, hasStructuralChangeFunction: false, dependencies: [] }
    }

    const hash = this.computeHashFromTokens(lexerResult.tokens, formulaAddress)

    let cacheResult = this.cache.get(hash)
    if (cacheResult) {
      ++this.statsCacheUsed
    } else {
      const processedTokens = bindWhitespacesToTokens(lexerResult.tokens)
      const parsingResult = this.formulaParser.parseFromTokens(processedTokens, formulaAddress)

      if (parsingResult.errors.length > 0) {
        return { ...parsingResult, hasVolatileFunction: false, hasStructuralChangeFunction: false, dependencies: [] }
      } else {
        cacheResult = this.cache.set(hash, parsingResult.ast)
      }
    }
    const {ast, hasVolatileFunction, hasStructuralChangeFunction, relativeDependencies} = cacheResult

    return {ast, errors: [], hasVolatileFunction, hasStructuralChangeFunction, dependencies: relativeDependencies}
  }

  public fetchCachedResult(hash: string): ParsingResult {
    const cacheResult = this.cache.get(hash)
    if (cacheResult === null) {
      throw new Error('There is no AST with such key in the cache')
    } else {
      const {ast, hasVolatileFunction, hasStructuralChangeFunction, relativeDependencies} = cacheResult
      return {ast, errors: [], hasVolatileFunction, hasStructuralChangeFunction, dependencies: relativeDependencies}
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
          hash = hash.concat(token.image)
        } else {
          hash = hash.concat(cellAddress.hash(true))
        }
      } else if (tokenMatcher(token, ProcedureName)) {
        const procedureName = token.image.toUpperCase().slice(0, -1)
        const canonicalProcedureName = this.lexerConfig.functionMapping[procedureName] ?? procedureName
        hash = hash.concat(canonicalProcedureName, '(')
      } else if (tokenMatcher(token, ColumnReference)){
        // const [start, end] = token.image.split(':')
        const startAddress = columnAddressFromString(this.sheetMapping, token.image, baseAddress)
        // const endAddress = columnAddressFromString(this.sheetMapping, end, baseAddress)
        if (startAddress === undefined) {
          hash = hash.concat('!REF')
        } else {
          hash = hash.concat(startAddress.hash(true))
        }
      } else if (tokenMatcher(token, RowReference)){
        // const [start, end] = token.image.split(':')
        const startAddress = rowAddressFromString(this.sheetMapping, token.image, baseAddress)
        // const endAddress = rowAddressFromString(this.sheetMapping, end, baseAddress)
        if (startAddress === undefined) {
          hash = hash.concat('!REF')
        } else {
          hash = hash.concat(startAddress.hash(true))
        }
      } else {
        hash = hash.concat(token.image)
      }
      idx++
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
      case AstNodeType.EMPTY: {
        return ast.leadingWhitespace || ''
      }
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
        return imageWithWhitespace(ast.reference.hash(true), ast.leadingWhitespace)
      }
      case AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION:
      case AstNodeType.ROW_REFERENCE: {
        throw 'cant happen'
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
      case AstNodeType.RANGE_OP: {
        if ((ast.left.type === AstNodeType.CELL_REFERENCE && ast.right.type === AstNodeType.CELL_REFERENCE) || (ast.left.type === AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION && ast.right.type === AstNodeType.COLUMN_REFERENCE_OR_NAMED_EXPRESSION)) {
          const sheetReferenceType = this.rangeSheetReferenceType(ast.left.reference.sheet, ast.right.reference.sheet)
          const start = ast.left.reference.hash(sheetReferenceType !== RangeSheetReferenceType.RELATIVE)
          const end = ast.right.reference.hash(sheetReferenceType === RangeSheetReferenceType.BOTH_ABSOLUTE)
          return imageWithWhitespace(start + ':' + end, ast.leadingWhitespace)
        } else if ((ast.left.type === AstNodeType.ROW_REFERENCE || ast.left.type === AstNodeType.NUMBER) && (ast.right.type === AstNodeType.ROW_REFERENCE || ast.right.type === AstNodeType.NUMBER)) {
          const leftSheet = ast.left.type === AstNodeType.ROW_REFERENCE ? ast.left.reference.sheet : null
          const rightSheet = ast.right.type === AstNodeType.ROW_REFERENCE ? ast.right.reference.sheet : null
          const sheetReferenceType = this.rangeSheetReferenceType(leftSheet, rightSheet)
          const start = ast.left.type == AstNodeType.ROW_REFERENCE ? ast.left.reference : RowAddress.relative(null, ast.left.value)
          const end = ast.right.type == AstNodeType.ROW_REFERENCE ? ast.right.reference : RowAddress.relative(null, ast.right.value)
          return imageWithWhitespace(`${start.hash(sheetReferenceType !== RangeSheetReferenceType.RELATIVE)}:${end.hash(sheetReferenceType === RangeSheetReferenceType.BOTH_ABSOLUTE)}`, ast.leadingWhitespace)
        } else {
          throw Error('WUT')
        }
      }
      case AstNodeType.ERROR: {
        const image = this.config.translationPackage.getErrorTranslation(
          ast.error ? ast.error.type : ErrorType.ERROR
        )
        return imageWithWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.ERROR_WITH_RAW_INPUT: {
        return imageWithWhitespace(ast.rawInput, ast.leadingWhitespace)
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

  private rangeSheetReferenceType(start: number | null, end: number | null): RangeSheetReferenceType {
    if (start === null) {
      return RangeSheetReferenceType.RELATIVE
    } else if (end === null) {
      return RangeSheetReferenceType.START_ABSOLUTE
    } else {
      return RangeSheetReferenceType.BOTH_ABSOLUTE
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
