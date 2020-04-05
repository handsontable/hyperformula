import {EmbeddedActionsParser, ILexingResult, IOrAlt, IToken, Lexer, OrMethodOpts, tokenMatcher} from 'chevrotain'

import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {
  cellAddressFromString,
  columnAddressFromString,
  rowAddressFromString,
  SheetMappingFn,
} from './addressRepresentationConverters'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  buildCellRangeAst,
  buildCellReferenceAst,
  buildColumnRangeAst,
  buildConcatenateOpAst,
  buildDivOpAst,
  buildEqualsOpAst,
  buildErrorWithRawInputAst,
  buildGreaterThanOpAst,
  buildGreaterThanOrEqualOpAst,
  buildLessThanOpAst,
  buildLessThanOrEqualOpAst,
  buildMinusOpAst,
  buildMinusUnaryOpAst,
  buildNotEqualOpAst,
  buildNumberAst,
  buildParenthesisAst,
  buildParsingErrorAst,
  buildPercentOpAst,
  buildPlusOpAst,
  buildPlusUnaryOpAst,
  buildPowerOpAst,
  buildProcedureAst, 
  buildRowRangeAst,
  buildStringAst,
  buildTimesOpAst,
  CellReferenceAst,
  ErrorAst,
  parsingError,
  ParsingError,
  ParsingErrorType,
  RangeSheetReferenceType,
} from './Ast'
import {CellAddress, CellReferenceType} from './CellAddress'
import {
  AdditionOp,
  BooleanOp,
  CellReference,
  ColumnRange,
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
  PercentOp,
  PlusOp,
  PowerOp,
  ProcedureName,
  RangeSeparator, 
  RowRange,
  RParen,
  StringLiteral,
  TimesOp,
  WhiteSpace,
} from './LexerConfig'

export interface FormulaParserResult {
  ast: Ast,
  errors: ParsingError[],
}

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
  private lexerConfig: ILexerConfig

  /**
   * Address of the cell in which formula is located
   */
  private formulaAddress: SimpleCellAddress

  private customParsingError?: ParsingError

  private readonly sheetMapping: SheetMappingFn

  /**
   * Cache for positiveAtomicExpression alternatives
   */
  private atomicExpCache: Maybe<OrArg>

  constructor(lexerConfig: ILexerConfig, sheetMapping: SheetMappingFn) {
    super(lexerConfig.allTokens, {outputCst: false, maxLookahead: 7})
    this.lexerConfig = lexerConfig
    this.sheetMapping = sheetMapping
    this.formulaAddress = simpleCellAddress(0, 0, 0)
    this.performSelfAnalysis()
  }

  /**
   * Parses tokenized formula and builds abstract syntax tree
   *
   * @param tokens - tokenized formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public parseFromTokens(tokens: IExtendedToken[], formulaAddress: SimpleCellAddress): FormulaParserResult {
    this.input = tokens

    let ast = this.formulaWithContext(formulaAddress)

    let errors: ParsingError[] = []

    if (this.customParsingError) {
      errors.push(this.customParsingError)
    }

    errors = errors.concat(
      this.errors.map((e) => ({
        type: ParsingErrorType.ParserError,
        message: e.message,
      }))
    )

    if (errors.length > 0) {
      ast = buildParsingErrorAst()
    }

    return {
      ast,
      errors
    }
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

  public reset() {
    super.reset()
    this.customParsingError = undefined
  }

  /**
   * Entry rule
   */
  public formula: AstRule = this.RULE('formula', () => {
    this.CONSUME(EqualsOp)
    return this.SUBRULE(this.booleanExpression)
  })

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
            this.customParsingError = parsingError(ParsingErrorType.ParserError, 'Mismatched token type')
            return this.customParsingError
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
    }) as Maybe<IExtendedToken>

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
        ALT: () => this.SUBRULE(this.columnRangeExpression),
      },
      {
        ALT: () => this.SUBRULE(this.rowRangeExpression),
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
          const number = this.CONSUME(this.lexerConfig.NumberLiteral) as IExtendedToken
          return buildNumberAst(this.numericStringToNumber(number.image), number.leadingWhitespace)
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
            return this.parsingError(ParsingErrorType.ParserError, 'Unknown error literal')
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
    const canonicalProcedureName = this.lexerConfig.functionMapping[procedureName] ?? procedureName
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

    let end: Maybe<Ast>
    this.OPTION(() => {
      this.CONSUME(RangeSeparator)
      if (offsetProcedure.type === AstNodeType.CELL_RANGE) {
        end = this.parsingError(ParsingErrorType.RangeOffsetNotAllowed, 'Range offset not allowed here')
      } else {
        end = this.SUBRULE(this.endOfRangeWithOffsetStartExpression, {ARGS: [offsetProcedure]})
      }
    })

    if (end !== undefined) {
      return end
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
    const start = this.CONSUME(CellReference)
    this.CONSUME2(RangeSeparator)
    return this.SUBRULE(this.endOfRangeExpression, { ARGS: [start]})
  })

  /*
  * Rule for column range, e.g. A:B, Sheet1!A:B, Sheet1!A:Sheet1!B
  * */
  private columnRangeExpression: AstRule = this.RULE('columnRangeExpression', () => {
    const range = this.CONSUME(ColumnRange) as IExtendedToken
    const [startImage, endImage] = range.image.split(':')

    const start = this.ACTION(() => {
      return columnAddressFromString(this.sheetMapping, startImage, this.formulaAddress)
    })
    let end = this.ACTION(() => {
      return columnAddressFromString(this.sheetMapping, endImage, this.formulaAddress)
    })

    if (start === undefined || end === undefined) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    }
    if (start.sheet === null && end.sheet !== null) {
      return this.parsingError(ParsingErrorType.ParserError, 'Malformed range expression')
    }

    const sheetReferenceType = this.rangeSheetReferenceType(start.sheet, end.sheet)

    if (start.sheet !== null && end.sheet === null) {
      end = end.withAbsoluteSheet(start.sheet)
    }

    return buildColumnRangeAst(start, end, sheetReferenceType, range.leadingWhitespace)
  })

  /*
* Rule for row range, e.g. 1:2, Sheet1!1:2, Sheet1!1:Sheet1!2
* */
  private rowRangeExpression: AstRule = this.RULE('rowRangeExpression', () => {
    const range = this.CONSUME(RowRange) as IExtendedToken
    const [startImage, endImage] = range.image.split(':')

    const start = this.ACTION(() => {
      return rowAddressFromString(this.sheetMapping, startImage, this.formulaAddress)
    })
    let end = this.ACTION(() => {
      return rowAddressFromString(this.sheetMapping, endImage, this.formulaAddress)
    })

    if (start === undefined || end === undefined) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    }
    if (start.sheet === null && end.sheet !== null) {
      return this.parsingError(ParsingErrorType.ParserError, 'Malformed range expression')
    }

    const sheetReferenceType = this.rangeSheetReferenceType(start.sheet, end.sheet)

    if (start.sheet !== null && end.sheet === null) {
      end = end.withAbsoluteSheet(start.sheet)
    }

    return buildRowRangeAst(start, end, sheetReferenceType, range.leadingWhitespace)
  })

  /**
   * Rule for cell reference expression (e.g. A1, $A1, A$1, $A$1, $Sheet42!A$17)
   */
  private cellReference: AstRule = this.RULE('cellReference', () => {
    const cell = this.CONSUME(CellReference) as IExtendedToken
    const address = this.ACTION(() => {
      return cellAddressFromString(this.sheetMapping, cell.image, this.formulaAddress)
    })
    if (address === undefined) {
      return buildErrorWithRawInputAst(cell.image, new CellError(ErrorType.REF), cell.leadingWhitespace)
    } else {
      return buildCellReferenceAst(address, cell.leadingWhitespace)
    }
  })

  /**
   * Rule for end of range expression
   *
   * End of range may be a cell reference or OFFSET() function call
   */
  private endOfRangeExpression: AstRule = this.RULE('endOfRangeExpression', (start: IExtendedToken) => {
    return this.OR([
      {
        ALT: () => {
          return this.SUBRULE(this.endRangeReference, {ARGS: [start]})
        },
      },
      {
        ALT: () => {
          const offsetProcedure = this.SUBRULE(this.offsetProcedureExpression)
          const startAddress = this.ACTION(() => {
            return cellAddressFromString(this.sheetMapping, start.image, this.formulaAddress)
          })
          if (startAddress === undefined) {
            return buildCellErrorAst(new CellError(ErrorType.REF))
          }
          if (offsetProcedure.type === AstNodeType.CELL_REFERENCE) {
            let end = offsetProcedure.reference
            let sheetReferenceType = RangeSheetReferenceType.RELATIVE
            if (startAddress.sheet !== null) {
              sheetReferenceType = RangeSheetReferenceType.START_ABSOLUTE
              end = end.withAbsoluteSheet(startAddress.sheet)
            }
            return buildCellRangeAst(startAddress, end, sheetReferenceType, start.leadingWhitespace?.image)
          } else {
            return this.parsingError(ParsingErrorType.RangeOffsetNotAllowed, 'Range offset not allowed here')
          }
        },
      },
    ])
  })

  /**
   * Rule for end of range expression
   *
   * End of range may be a cell reference or OFFSET() function call
   */
  private endOfRangeWithOffsetStartExpression: AstRule = this.RULE('endOfRangeWithOffsetStartExpression', (start: CellReferenceAst) => {
    return this.OR([
      {
        ALT: () => {
          return this.SUBRULE(this.endRangeWithOffsetStartReference, {ARGS: [start]})
        },
      },
      {
        ALT: () => {
          const offsetProcedure = this.SUBRULE(this.offsetProcedureExpression)
          if (offsetProcedure.type === AstNodeType.CELL_REFERENCE) {
            let end = offsetProcedure.reference
            let sheetReferenceType = RangeSheetReferenceType.RELATIVE
            if (start.reference.sheet !== null) {
              sheetReferenceType = RangeSheetReferenceType.START_ABSOLUTE
              end = end.withAbsoluteSheet(start.reference.sheet)
            }
            return buildCellRangeAst(start.reference, end, sheetReferenceType, start.leadingWhitespace)
          } else {
            return this.parsingError(ParsingErrorType.RangeOffsetNotAllowed, 'Range offset not allowed here')
          }
        },
      },
    ])
  })


  /**
   * Rule for end range reference expression with additional checks considering range start
   */
  private endRangeReference: AstRule = this.RULE('endRangeReference', (start: IExtendedToken) => {
    const end = this.CONSUME(CellReference) as IExtendedToken

    const startAddress = this.ACTION(() => {
      return cellAddressFromString(this.sheetMapping, start.image, this.formulaAddress)
    })
    const endAddress = this.ACTION(() => {
      return cellAddressFromString(this.sheetMapping, end.image, this.formulaAddress)
    })

    if (startAddress === undefined || endAddress === undefined) {
      return this.ACTION(() => {
        return buildErrorWithRawInputAst(`${start.image}:${end.image}`, new CellError(ErrorType.REF), start.leadingWhitespace)
      })
    }

    return this.buildCellRange(startAddress, endAddress, start.leadingWhitespace?.image)
  })

  /**
   * Rule for end range reference expression starting with offset procedure with additional checks considering range start
   */
  private endRangeWithOffsetStartReference: AstRule = this.RULE('endRangeWithOffsetStartReference', (start: CellReferenceAst) => {
    const end = this.CONSUME(CellReference) as IExtendedToken

    const endAddress = this.ACTION(() => {
      return cellAddressFromString(this.sheetMapping, end.image, this.formulaAddress)
    })

    if (endAddress === undefined) {
      return this.ACTION(() => {
        return buildCellErrorAst(new CellError(ErrorType.REF))
      })
    }

    return this.buildCellRange(start.reference, endAddress, start.leadingWhitespace)
  })

  private buildCellRange(startAddress: CellAddress, endAddress: CellAddress, leadingWhitespace?: string): Ast {
    if (startAddress.sheet === null && endAddress.sheet !== null) {
      return this.parsingError(ParsingErrorType.ParserError, 'Malformed range expression')
    }

    const sheetReferenceType = this.rangeSheetReferenceType(startAddress.sheet, endAddress.sheet)

    if (startAddress.sheet !== null && endAddress.sheet === null) {
      endAddress = endAddress.withAbsoluteSheet(startAddress.sheet)
    }

    return buildCellRangeAst(startAddress, endAddress, sheetReferenceType, leadingWhitespace)
  }

  /**
   * Rule for parenthesis expression
   */
  private parenthesisExpression: AstRule = this.RULE('parenthesisExpression', () => {
    const lParenToken = this.CONSUME(LParen) as IExtendedToken
    const expression = this.SUBRULE(this.booleanExpression)
    const rParenToken = this.CONSUME(RParen) as IExtendedToken
    return buildParenthesisAst(expression, lParenToken.leadingWhitespace, rParenToken.leadingWhitespace)
  })

  /**
   * Returns {@link CellReferenceAst} or {@link CellRangeAst} based on OFFSET function arguments
   *
   * @param args - OFFSET function arguments
   */
  private handleOffsetHeuristic(args: Ast[]): Ast {
    const cellArg = args[0]
    if (cellArg.type !== AstNodeType.CELL_REFERENCE) {
      return this.parsingError(ParsingErrorType.StaticOffsetError, 'First argument to OFFSET is not a reference')
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
      return this.parsingError(ParsingErrorType.StaticOffsetError, 'Second argument to OFFSET is not a static number')
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
      return this.parsingError(ParsingErrorType.StaticOffsetError, 'Third argument to OFFSET is not a static number')
    }
    const heightArg = args[3]
    let height
    if (heightArg === undefined) {
      height = 1
    } else if (heightArg.type === AstNodeType.NUMBER) {
      height = heightArg.value
      if (height < 1) {
        return this.parsingError(ParsingErrorType.StaticOffsetError, 'Fourth argument to OFFSET is too small number')
      } else if (!Number.isInteger(height)) {
        return this.parsingError(ParsingErrorType.StaticOffsetError, 'Fourth argument to OFFSET is not integer')
      }
    } else {
      return this.parsingError(ParsingErrorType.StaticOffsetError, 'Fourth argument to OFFSET is not a static number')
    }
    const widthArg = args[4]
    let width
    if (widthArg === undefined) {
      width = 1
    } else if (widthArg.type === AstNodeType.NUMBER) {
      width = widthArg.value
      if (width < 1) {
        return this.parsingError(ParsingErrorType.StaticOffsetError, 'Fifth argument to OFFSET is too small number')
      } else if (!Number.isInteger(width)) {
        return this.parsingError(ParsingErrorType.StaticOffsetError, 'Fifth argument to OFFSET is not integer')
      }
    } else {
      return this.parsingError(ParsingErrorType.StaticOffsetError, 'Fifth argument to OFFSET is not a static number')
    }

    const topLeftCorner = new CellAddress(
      null,
      cellArg.reference.col + colShift,
      cellArg.reference.row + rowShift,
      cellArg.reference.type,
    )

    let absoluteCol = topLeftCorner.col
    let absoluteRow = topLeftCorner.row

    if (cellArg.reference.type === CellReferenceType.CELL_REFERENCE_RELATIVE
      || cellArg.reference.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
      absoluteRow = absoluteRow + this.formulaAddress.row
    }
    if (cellArg.reference.type === CellReferenceType.CELL_REFERENCE_RELATIVE
      || cellArg.reference.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      absoluteCol = absoluteCol + this.formulaAddress.col
    }

    if (absoluteCol < 0 || absoluteRow < 0) {
      return buildCellErrorAst(new CellError(ErrorType.REF, 'Resulting reference is out of the sheet'))
    }
    if (width === 1 && height === 1) {
      return buildCellReferenceAst(topLeftCorner)
    } else {
      const bottomRightCorner = new CellAddress(
        null,
        topLeftCorner.col + width - 1,
        topLeftCorner.row + height - 1,
        topLeftCorner.type,
      )
      return buildCellRangeAst(topLeftCorner, bottomRightCorner, RangeSheetReferenceType.RELATIVE)
    }
  }

  private parsingError(type: ParsingErrorType, message: string): ErrorAst {
    this.customParsingError = parsingError(type, message)
    return buildParsingErrorAst()
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

  public numericStringToNumber = (input: string): number => {
    const normalized = input.replace(this.lexerConfig.decimalSeparator, '.')
    return Number(normalized)
  }
}

type AstRule = (idxInCallingRule?: number, ...args: any[]) => (Ast)
type OrArg = IOrAlt[] | OrMethodOpts

export interface IExtendedToken extends IToken {
  leadingWhitespace?: IToken,
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
