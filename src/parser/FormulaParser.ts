import {EmbeddedActionsParser, ILexingResult, IOrAlt, IToken, Lexer, OrMethodOpts, tokenMatcher} from 'chevrotain'

import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {cellAddressFromString, SheetMappingFn} from './addressRepresentationConverters'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  buildCellRangeAst,
  buildCellReferenceAst,
  buildConcatenateOpAst,
  buildDivOpAst,
  buildEqualsOpAst,
  buildErrorAst,
  buildGreaterThanOpAst,
  buildGreaterThanOrEqualOpAst,
  buildLessThanOpAst,
  buildLessThanOrEqualOpAst,
  buildMinusOpAst,
  buildMinusUnaryOpAst,
  buildNotEqualOpAst,
  buildNumberAst,
  buildParenthesisAst,
  buildPercentOpAst,
  buildPlusOpAst,
  buildPlusUnaryOpAst,
  buildPowerOpAst,
  buildProcedureAst,
  buildStringAst,
  buildTimesOpAst,
  CellReferenceAst,
  ParsingErrorType,
} from './Ast'
import {CellAddress, CellReferenceType} from './CellAddress'
import {
  AdditionOp,
  BooleanOp,
  CellReference,
  ConcatenateOp,
  DivOp,
  EqualsOp,
  ErrorLiteral,
  GreaterThanOp,
  GreaterThanOrEqualOp,
  ILexerConfig,
  LessThanOp,
  LessThanOrEqualOp,
  LParen,
  MinusOp,
  MultiplicationOp,
  NotEqualOp,
  NumberLiteral,
  PercentOp,
  PlusOp,
  PowerOp,
  ProcedureName,
  RangeSeparator,
  RParen,
  StringLiteral,
  TimesOp,
  WhiteSpace,
} from './LexerConfig'

/**
 * LL(k) formula parser described using Chevrotain DSL
 *
 * It is equivalent to the grammar below:
 *
 * F -> '=' E <br/>
 * B -> K < B | K >= B ... | K <br/>
 * K -> E & K | E <br/>
 * E -> M + E | M - E | M <br/>
 * M -> W * M | W / M | W <br/>
 * W -> C * W | C <br/>
 * C -> N | R | O | A | P | num <br/>
 * N -> '(' E ')' <br/>
 * R -> A:OFFSET(..) | A:A <br/>
 * O -> OFFSET(..) | OFFSET(..):A | OFFSET(..):OFFSET(..) <br/>
 * A -> A1 | $A1 | A$1 | $A$1 <br/>
 * P -> SUM(..) <br/>
 */
export class FormulaParser extends EmbeddedActionsParser {
  /**
   * Entry rule
   */
  public formula: AstRule = this.RULE('formula', () => {
    this.CONSUME(EqualsOp)
    return this.SUBRULE(this.booleanExpression)
  })
  private lexerConfig: ILexerConfig

  /**
   * Address of the cell in which formula is located
   */
  private formulaAddress?: SimpleCellAddress

  private readonly sheetMapping: SheetMappingFn

  /**
   * Cache for positiveAtomicExpression alternatives
   */
  private atomicExpCache: OrArg | undefined

  /**
   * Rule for boolean expression (e.g. 1 <= A1)
   */
  private booleanExpression: AstRule = this.RULE('booleanExpression', () => {
    let lhs: Ast = this.SUBRULE(this.concatenateExpression)

    this.MANY(() => {
      const op = this.CONSUME(BooleanOp) as IExtendedToken
      const rhs = this.SUBRULE2(this.concatenateExpression)

      if (tokenMatcher(op, EqualsOp)) {
        lhs = buildEqualsOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, NotEqualOp)) {
        lhs = buildNotEqualOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, GreaterThanOp)) {
        lhs = buildGreaterThanOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, LessThanOp)) {
        lhs = buildLessThanOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, GreaterThanOrEqualOp)) {
        lhs = buildGreaterThanOrEqualOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, LessThanOrEqualOp)) {
        lhs = buildLessThanOrEqualOpAst(lhs, rhs, op.leadingWhitespace)
      } else {
        this.ACTION(() => {
          throw Error('Operator not supported')
        })
      }
    })

    return lhs
  })

  /**
   * Rule for concatenation operator expression (e.g. "=" & A1)
   */
  private concatenateExpression: AstRule = this.RULE('concatenateExpression', () => {
    let lhs: Ast = this.SUBRULE(this.additionExpression)

    this.MANY(() => {
      const op = this.CONSUME(ConcatenateOp) as IExtendedToken
      const rhs = this.SUBRULE2(this.additionExpression)
      lhs = buildConcatenateOpAst(lhs, rhs, op.leadingWhitespace)
    })

    return lhs
  })

  /**
   * Rule for addition category operators (e.g. 1 + A1, 1 - A1)
   */
  private additionExpression: AstRule = this.RULE('additionExpression', () => {
    let lhs: Ast = this.SUBRULE(this.multiplicationExpression)

    this.MANY(() => {
      const op = this.CONSUME(AdditionOp) as IExtendedToken
      const rhs = this.SUBRULE2(this.multiplicationExpression)

      if (tokenMatcher(op, PlusOp)) {
        lhs = buildPlusOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, MinusOp)) {
        lhs = buildMinusOpAst(lhs, rhs, op.leadingWhitespace)
      } else {
        this.ACTION(() => {
          throw Error('Operator not supported')
        })
      }
    })

    return lhs
  })

  /**
   * Rule for multiplication category operators (e.g. 1 * A1, 1 / A1)
   */
  private multiplicationExpression: AstRule = this.RULE('multiplicationExpression', () => {
    let lhs: Ast = this.SUBRULE(this.powerExpression)

    this.MANY(() => {
      const op = this.CONSUME(MultiplicationOp) as IExtendedToken
      const rhs = this.SUBRULE2(this.powerExpression)

      if (tokenMatcher(op, TimesOp)) {
        lhs = buildTimesOpAst(lhs, rhs, op.leadingWhitespace)
      } else if (tokenMatcher(op, DivOp)) {
        lhs = buildDivOpAst(lhs, rhs, op.leadingWhitespace)
      } else {
        this.ACTION(() => {
          throw Error('Operator not supported')
        })
      }
    })

    return lhs
  })

  /**
   * Rule for power expression
   */
  private powerExpression: AstRule = this.RULE('powerExpression', () => {
    let lhs: Ast = this.SUBRULE(this.atomicExpression)

    this.MANY(() => {
      const op = this.CONSUME(PowerOp) as IExtendedToken
      const rhs = this.SUBRULE2(this.atomicExpression)

      if (tokenMatcher(op, PowerOp)) {
        lhs = buildPowerOpAst(lhs, rhs, op.leadingWhitespace)
      } else {
        this.ACTION(() => {
          throw Error('Operator not supported')
        })
      }
    })

    return lhs
  })

  /**
   * Rule for atomic expressions, which is positive atomic expression or negation of it
   */
  private atomicExpression: AstRule = this.RULE('atomicExpression', () => {
    return this.OR([
      {
        ALT: () => {
          const op = this.CONSUME(AdditionOp) as IExtendedToken
          const value = this.SUBRULE(this.rightUnaryOpAtomicExpression)
          if (tokenMatcher(op, PlusOp)) {
            return buildPlusUnaryOpAst(value, op.leadingWhitespace)
          } else if (tokenMatcher(op, MinusOp)) {
            return buildMinusUnaryOpAst(value, op.leadingWhitespace)
          } else {
            return buildErrorAst([])
          }
        },
      },
      {
        ALT: () => this.SUBRULE2(this.rightUnaryOpAtomicExpression),
      },
    ])
  })

  private rightUnaryOpAtomicExpression: AstRule = this.RULE('rightUnaryOpAtomicExpression', () => {
    const positiveAtomicExpression = this.SUBRULE(this.positiveAtomicExpression)

    const percentage = this.OPTION(() => {
      return this.CONSUME(PercentOp)
    }) as IExtendedToken | undefined

    if (percentage) {
      return buildPercentOpAst(positiveAtomicExpression, percentage.leadingWhitespace)
    }

    return positiveAtomicExpression
  })

  /**
   * Rule for positive atomic expressions
   */
  private positiveAtomicExpression: AstRule = this.RULE('positiveAtomicExpression', () => {
    return this.OR(this.atomicExpCache || (this.atomicExpCache = [
      {
        ALT: () => this.SUBRULE(this.parenthesisExpression),
      },
      {
        ALT: () => this.SUBRULE(this.cellRangeExpression),
      },
      {
        ALT: () => this.SUBRULE(this.offsetExpression),
      },
      {
        ALT: () => this.SUBRULE(this.cellReference),
      },
      {
        ALT: () => this.SUBRULE(this.procedureExpression),
      },
      {
        ALT: () => {
          const number = this.CONSUME(NumberLiteral) as IExtendedToken
          return buildNumberAst(number)
        },
      },
      {
        ALT: () => {
          const str = this.CONSUME(StringLiteral) as IExtendedToken
          return buildStringAst(str)
        },
      },
      {
        ALT: () => {
          const token = this.CONSUME(ErrorLiteral) as IExtendedToken
          const errString = token.image.toUpperCase()
          const errorType = this.lexerConfig.errorMapping[errString]
          if (errorType) {
            return buildCellErrorAst(new CellError(errorType), token.leadingWhitespace)
          } else {
            return buildErrorAst([{
              type: ParsingErrorType.ParserError,
              message: 'Unknown error literal',
            }])
          }
        },
      },
    ]))
  })

  /**
   * Rule for procedure expressions: SUM(1,A1)
   */
  private procedureExpression: AstRule = this.RULE('procedureExpression', () => {
    const procedureNameToken = this.CONSUME(ProcedureName) as IExtendedToken
    const procedureName = procedureNameToken.image.toUpperCase().slice(0, -1)
    const canonicalProcedureName = this.lexerConfig.functionMapping[procedureName] || procedureName
    const args: Ast[] = []
    this.MANY_SEP({
      SEP: this.lexerConfig.ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.booleanExpression))
      },
    })
    const rParenToken = this.CONSUME(RParen) as IExtendedToken
    return buildProcedureAst(canonicalProcedureName, args, procedureNameToken.leadingWhitespace, rParenToken.leadingWhitespace)
  })

  /**
   * Rule for expressions that start with OFFSET() function
   *
   * OFFSET() function can occur as cell reference or part of cell range.
   * In order to preserve LL(k) properties, expressions that starts with OFFSET() functions needs to have separate rule.
   *
   * Proper {@link Ast} node type is built depending on the presence of {@link RangeSeparator}
   */
  private offsetExpression: AstRule = this.RULE('offsetExpression', () => {
    const offsetProcedure = this.SUBRULE(this.offsetProcedureExpression)

    let end: Ast | undefined
    this.OPTION(() => {
      this.CONSUME(RangeSeparator)
      end = this.SUBRULE(this.endOfRangeExpression)
    })

    if (end !== undefined) {
      if (offsetProcedure.type === AstNodeType.CELL_REFERENCE && end.type === AstNodeType.CELL_REFERENCE) {
        return buildCellRangeAst(offsetProcedure.reference, end!.reference, offsetProcedure.leadingWhitespace)
      } else if (offsetProcedure.type === AstNodeType.CELL_RANGE) {
        return buildErrorAst([
          {
            type: ParsingErrorType.RangeOffsetNotAllowed,
            message: 'Range offset not allowed here',
          },
        ])
      }
    }

    return offsetProcedure
  })

  /**
   * Rule for OFFSET() function expression
   */
  private offsetProcedureExpression: AstRule = this.RULE('offsetProcedureExpression', () => {
    const args: Ast[] = []
    this.CONSUME(this.lexerConfig.OffsetProcedureName)
    this.CONSUME(LParen)
    this.MANY_SEP({
      SEP: this.lexerConfig.ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.booleanExpression))
      },
    })
    this.CONSUME(RParen)
    return this.handleOffsetHeuristic(args)
  })

  /**
   * Rule for cell ranges (e.g. A1:B$3, A1:OFFSET())
   */
  private cellRangeExpression: AstRule = this.RULE('cellRangeExpression', () => {
    const start = this.SUBRULE(this.cellReference) as CellReferenceAst
    this.CONSUME2(RangeSeparator)

    const sheet = this.ACTION(() => {
      return start.reference.sheet
    })

    const end = this.SUBRULE(this.endOfRangeExpression, {ARGS: [sheet]})

    if (end.type !== AstNodeType.CELL_REFERENCE) {
      return buildErrorAst([
        {
          type: ParsingErrorType.RangeOffsetNotAllowed,
          message: 'Range offset not allowed here',
        },
      ])
    }

    return buildCellRangeAst(start.reference, end.reference, start.leadingWhitespace)
  })

  /**
   * Rule for end of range expression
   *
   * End of range may be a cell reference or OFFSET() function call
   */
  private endOfRangeExpression: AstRule = this.RULE('endOfRangeExpression', (sheet) => {
    return this.OR([
      {
        ALT: () => {
          return this.SUBRULE(this.cellReference, {ARGS: [sheet]})
        },
      },
      {
        ALT: () => {
          const offsetProcedure = this.SUBRULE(this.offsetProcedureExpression)
          if (offsetProcedure.type === AstNodeType.CELL_REFERENCE) {
            return offsetProcedure
          } else {
            return buildErrorAst([
              {
                type: ParsingErrorType.RangeOffsetNotAllowed,
                message: 'Range offset not allowed here',
              },
            ])
          }
        },
      },
    ])
  })

  /**
   * Rule for cell reference expression (e.g. A1, $A1, A$1, $A$1, $Sheet42!A$17)
   */
  private cellReference: AstRule = this.RULE('cellReference', (sheet) => {
    const cell = this.CONSUME(CellReference) as IExtendedToken
    const address = this.ACTION(() => {
      return cellAddressFromString(this.sheetMapping!, cell.image, this.formulaAddress!, sheet)
    })
    if (address === undefined) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return buildCellReferenceAst(address, cell.leadingWhitespace)
    }
  })

  /**
   * Rule for parenthesis expression
   */
  private parenthesisExpression: AstRule = this.RULE('parenthesisExpression', () => {
    const lParenToken = this.CONSUME(LParen) as IExtendedToken
    const expression = this.SUBRULE(this.booleanExpression)
    const rParenToken = this.CONSUME(RParen) as IExtendedToken
    return buildParenthesisAst(expression, lParenToken.leadingWhitespace, rParenToken.leadingWhitespace)
  })

  constructor(lexerConfig: ILexerConfig, sheetMapping: SheetMappingFn) {
    super(lexerConfig.allTokens, {outputCst: false, maxLookahead: 7})
    this.lexerConfig = lexerConfig
    this.sheetMapping = sheetMapping
    this.performSelfAnalysis()
  }

  /**
   * Parses tokenized formula and builds abstract syntax tree
   *
   * @param tokens - tokenized formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public parseFromTokens(tokens: IExtendedToken[], formulaAddress: SimpleCellAddress): Ast {
    this.input = tokens

    const ast = this.formulaWithContext(formulaAddress)
    const errors = this.errors

    if (errors.length > 0) {
      return buildErrorAst(errors.map((e) =>
        ({
          type: ParsingErrorType.ParserError,
          message: e.message,
        }),
      ))
    }

    return ast
  }

  /**
   * Entry rule wrapper that sets formula address
   *
   * @param address - address of the cell in which formula is located
   */
  private formulaWithContext(address: SimpleCellAddress): Ast {
    this.formulaAddress = address
    return this.formula()
  }

  /**
   * Returns {@link CellReferenceAst} or {@link CellRangeAst} based on OFFSET function arguments
   *
   * @param args - OFFSET function arguments
   */
  private handleOffsetHeuristic(args: Ast[]): Ast {
    const cellArg = args[0]
    if (cellArg.type !== AstNodeType.CELL_REFERENCE) {
      return buildErrorAst([{
        type: ParsingErrorType.StaticOffsetError,
        message: 'First argument to OFFSET is not a reference',
      }])
    }
    const rowsArg = args[1]
    let rowShift
    if (rowsArg.type === AstNodeType.NUMBER && Number.isInteger(rowsArg.value)) {
      rowShift = rowsArg.value
    } else if (rowsArg.type === AstNodeType.PLUS_UNARY_OP && rowsArg.value.type === AstNodeType.NUMBER && Number.isInteger(rowsArg.value.value)) {
      rowShift = rowsArg.value.value
    } else if (rowsArg.type === AstNodeType.MINUS_UNARY_OP && rowsArg.value.type === AstNodeType.NUMBER && Number.isInteger(rowsArg.value.value)) {
      rowShift = -rowsArg.value.value
    } else {
      return buildErrorAst([{
        type: ParsingErrorType.StaticOffsetError,
        message: 'Second argument to OFFSET is not a static number',
      }])
    }
    const columnsArg = args[2]
    let colShift
    if (columnsArg.type === AstNodeType.NUMBER && Number.isInteger(columnsArg.value)) {
      colShift = columnsArg.value
    } else if (columnsArg.type === AstNodeType.PLUS_UNARY_OP && columnsArg.value.type === AstNodeType.NUMBER && Number.isInteger(columnsArg.value.value)) {
      colShift = columnsArg.value.value
    } else if (columnsArg.type === AstNodeType.MINUS_UNARY_OP && columnsArg.value.type === AstNodeType.NUMBER && Number.isInteger(columnsArg.value.value)) {
      colShift = -columnsArg.value.value
    } else {
      return buildErrorAst([{
        type: ParsingErrorType.StaticOffsetError,
        message: 'Third argument to OFFSET is not a static number',
      }])
    }
    const heightArg = args[3]
    let height
    if (heightArg === undefined) {
      height = 1
    } else if (heightArg.type === AstNodeType.NUMBER) {
      height = heightArg.value
      if (height < 1) {
        return buildErrorAst([{
          type: ParsingErrorType.StaticOffsetError,
          message: 'Fourth argument to OFFSET is too small number',
        }])
      } else if (!Number.isInteger(height)) {
        return buildErrorAst([{
          type: ParsingErrorType.StaticOffsetError,
          message: 'Fourth argument to OFFSET is not integer',
        }])
      }
    } else {
      return buildErrorAst([{
        type: ParsingErrorType.StaticOffsetError,
        message: 'Fourth argument to OFFSET is not a static number',
      }])
    }
    const widthArg = args[4]
    let width
    if (widthArg === undefined) {
      width = 1
    } else if (widthArg.type === AstNodeType.NUMBER) {
      width = widthArg.value
      if (width < 1) {
        return buildErrorAst([{
          type: ParsingErrorType.StaticOffsetError,
          message: 'Fifth argument to OFFSET is too small number',
        }])
      } else if (!Number.isInteger(width)) {
        return buildErrorAst([{
          type: ParsingErrorType.StaticOffsetError,
          message: 'Fifth argument to OFFSET is not integer',
        }])
      }
    } else {
      return buildErrorAst([{
        type: ParsingErrorType.StaticOffsetError,
        message: 'Fifth argument to OFFSET is not a static number',
      }])
    }

    const topLeftCorner = new CellAddress(
      this.formulaAddress!.sheet,
      cellArg.reference.col + colShift,
      cellArg.reference.row + rowShift,
      cellArg.reference.type,
    )

    let absoluteCol = topLeftCorner.col
    let absoluteRow = topLeftCorner.row

    if (cellArg.reference.type === CellReferenceType.CELL_REFERENCE_RELATIVE
      || cellArg.reference.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
      absoluteRow = absoluteRow + this.formulaAddress!.row
    }
    if (cellArg.reference.type === CellReferenceType.CELL_REFERENCE_RELATIVE
      || cellArg.reference.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
      absoluteCol = absoluteCol + this.formulaAddress!.col
    }

    if (absoluteCol < 0 || absoluteRow < 0) {
      return buildErrorAst([{
        type: ParsingErrorType.StaticOffsetOutOfRangeError,
        message: 'Resulting reference is out of the sheet',
      }])
    }
    if (width === 1 && height === 1) {
      return buildCellReferenceAst(topLeftCorner)
    } else {
      const bottomRightCorner = new CellAddress(
        this.formulaAddress!.sheet,
        topLeftCorner.col + width - 1,
        topLeftCorner.row + height - 1,
        topLeftCorner.type,
      )
      return buildCellRangeAst(topLeftCorner, bottomRightCorner)
    }
  }
}

type AstRule = (idxInCallingRule?: number, ...args: any[]) => (Ast)
type OrArg = IOrAlt[] | OrMethodOpts

export interface IExtendedToken extends IToken {
  leadingWhitespace?: IToken
}

export class FormulaLexer {
  private readonly lexer: Lexer

  constructor(private lexerConfig: ILexerConfig) {
    this.lexer = new Lexer(lexerConfig.allTokens, {ensureOptimizations: true})
  }

  /**
   * Returns Lexer tokens from formula string
   *
   * @param text - string representation of a formula
   */
  public tokenizeFormula(text: string): ILexingResult {
    const tokens = this.lexer.tokenize(text)
    this.skipWhitespacesInsideRanges(tokens)
    this.skipWhitespacesBeforeArgSeparators(tokens)
    this.trimTrailingWhitespaces(tokens)
    return tokens
  }

  private skipWhitespacesInsideRanges(lexingResult: ILexingResult): void {
    const tokens = lexingResult.tokens
    if (tokens.length < 3) {
      return
    }

    let i = 0
    while (i < tokens.length - 2) {
      if ((tokenMatcher(tokens[i], CellReference) || tokenMatcher(tokens[i], RangeSeparator))
        && tokenMatcher(tokens[i + 1], WhiteSpace)
        && (tokenMatcher(tokens[i + 2], CellReference) || tokenMatcher(tokens[i + 2], RangeSeparator))) {
        tokens.splice(i + 1, 1)
      }
      ++i
    }
  }

  private skipWhitespacesBeforeArgSeparators(lexingResult: ILexingResult): void {
    const tokens = lexingResult.tokens
    if (tokens.length < 2) {
      return
    }

    let i = 0
    while (i < tokens.length - 2) {
      if (tokenMatcher(tokens[i], WhiteSpace) && tokenMatcher(tokens[i + 1], this.lexerConfig.ArgSeparator)) {
        tokens.splice(i, 1)
      } else {
        ++i
      }
    }
  }

  private trimTrailingWhitespaces(lexingResult: ILexingResult): void {
    const tokens = lexingResult.tokens
    if (tokens.length > 0 && tokenMatcher(tokens[tokens.length - 1], WhiteSpace)) {
      tokens.pop()
    }
  }
}
