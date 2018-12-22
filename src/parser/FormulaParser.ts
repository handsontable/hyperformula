import {IAnyOrAlt, ILexingResult, Lexer, OrMethodOpts, Parser, tokenMatcher, TokenType} from 'chevrotain'

import {cellAddressFromString, CellReferenceType, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {
  Ast,
  AstNodeType,
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
  buildPlusOpAst,
  buildPowerOpAst,
  buildProcedureAst,
  buildStringAst,
  buildTimesOpAst,
  CellReferenceAst,
  ParsingErrorType,
} from './Ast'
import {
  AbsoluteCell,
  AbsoluteColCell,
  AbsoluteRowCell,
  AdditionOp,
  BooleanOp,
  buildLexerConfig,
  CellReference,
  ConcatenateOp,
  DivOp,
  EqualsOp,
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
  OffsetProcedureName,
  PlusOp,
  PowerOp,
  ProcedureName,
  RangeSeparator,
  RelativeCell,
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
export class FormulaParser extends Parser {

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
      const op = this.CONSUME(BooleanOp)
      const rhs = this.SUBRULE2(this.concatenateExpression)

      if (tokenMatcher(op, EqualsOp)) {
        lhs = buildEqualsOpAst(lhs, rhs)
      } else if (tokenMatcher(op, NotEqualOp)) {
        lhs = buildNotEqualOpAst(lhs, rhs)
      } else if (tokenMatcher(op, GreaterThanOp)) {
        lhs = buildGreaterThanOpAst(lhs, rhs)
      } else if (tokenMatcher(op, LessThanOp)) {
        lhs = buildLessThanOpAst(lhs, rhs)
      } else if (tokenMatcher(op, GreaterThanOrEqualOp)) {
        lhs = buildGreaterThanOrEqualOpAst(lhs, rhs)
      } else if (tokenMatcher(op, LessThanOrEqualOp)) {
        lhs = buildLessThanOrEqualOpAst(lhs, rhs)
      } else {
        throw Error('Operator not supported')
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
      this.CONSUME(ConcatenateOp)
      const rhs = this.SUBRULE2(this.additionExpression)
      lhs = buildConcatenateOpAst(lhs, rhs)
    })

    return lhs
  })

  /**
   * Rule for addition category operators (e.g. 1 + A1, 1 - A1)
   */
  private additionExpression: AstRule = this.RULE('additionExpression', () => {
    let lhs: Ast = this.SUBRULE(this.multiplicationExpression)

    this.MANY(() => {
      const op = this.CONSUME(AdditionOp)
      const rhs = this.SUBRULE2(this.multiplicationExpression)

      if (tokenMatcher(op, PlusOp)) {
        lhs = buildPlusOpAst(lhs, rhs)
      } else if (tokenMatcher(op, MinusOp)) {
        lhs = buildMinusOpAst(lhs, rhs)
      } else {
        throw Error('Operator not supported')
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
      const op = this.CONSUME(MultiplicationOp)
      const rhs = this.SUBRULE2(this.powerExpression)

      if (tokenMatcher(op, TimesOp)) {
        lhs = buildTimesOpAst(lhs, rhs)
      } else if (tokenMatcher(op, DivOp)) {
        lhs = buildDivOpAst(lhs, rhs)
      } else {
        throw Error('Operator not supported')
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
      const op = this.CONSUME(PowerOp)
      const rhs = this.SUBRULE2(this.atomicExpression)

      if (tokenMatcher(op, PowerOp)) {
        lhs = buildPowerOpAst(lhs, rhs)
      } else {
        throw Error('Operator not supported')
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
          this.CONSUME(MinusOp)
          const value = this.SUBRULE(this.positiveAtomicExpression)
          return buildMinusUnaryOpAst(value)
        },
      },
      {
        ALT: () => this.SUBRULE2(this.positiveAtomicExpression),
      },
    ])
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
          const number = this.CONSUME(NumberLiteral)
          return buildNumberAst(parseFloat(number.image))
        },
      },
      {
        ALT: () => {
          const str = this.CONSUME(StringLiteral)
          return buildStringAst(str.image.slice(1, -1))
        },
      },
    ]))
  })

  /**
   * Rule for procedure expressions: SUM(1,A1)
   */
  private procedureExpression: AstRule = this.RULE('procedureExpression', () => {
    const procedureName = this.CONSUME(ProcedureName).image.toUpperCase()
    const args: Ast[] = []
    this.CONSUME(LParen)
    this.MANY_SEP({
      SEP: this.lexerConfig.ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.booleanExpression))
      },
    })
    this.CONSUME(RParen)
    return buildProcedureAst(procedureName, args)
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
        return buildCellRangeAst(offsetProcedure.reference, end!.reference)
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
    this.CONSUME(OffsetProcedureName)
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
    const end = this.SUBRULE(this.endOfRangeExpression)

    if (end.type !== AstNodeType.CELL_REFERENCE) {
      return buildErrorAst([
        {
          type: ParsingErrorType.RangeOffsetNotAllowed,
          message: 'Range offset not allowed here',
        },
      ])
    }

    return buildCellRangeAst(start.reference, end.reference)
  })

  /**
   * Rule for end of range expression
   *
   * End of range may be a cell reference or OFFSET() function call
   */
  private endOfRangeExpression: AstRule = this.RULE('endOfRangeExpression', () => {
    return this.OR([
      {
        ALT: () => this.SUBRULE(this.cellReference),
      },
      {
        ALT: () => {
          const offsetProcedure = this.SUBRULE(this.offsetProcedureExpression)
          if (offsetProcedure.type === AstNodeType.CELL_REFERENCE) {
            return buildCellReferenceAst(offsetProcedure.reference)
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
   * Rule for cell reference expression (e.g. A1, $A1, A$1, $A$1)
   */
  private cellReference: AstRule = this.RULE('cellReference', () => {
    const cell = this.CONSUME(CellReference)
    return buildCellReferenceAst(cellAddressFromString(cell.image, this.formulaAddress!))
  })

  /**
   * Rule for parenthesis expression
   */
  private parenthesisExpression: AstRule = this.RULE('parenthesisExpression', () => {
    this.CONSUME(LParen)
    const expression = this.SUBRULE(this.booleanExpression)
    this.CONSUME(RParen)
    return expression
  })

  constructor(lexerConfig: ILexerConfig) {
    super(lexerConfig.allTokens, {outputCst: false, maxLookahead: 7})
    this.lexerConfig = lexerConfig
    this.performSelfAnalysis()
  }

  /**
   * Entry rule wrapper that sets formula address
   *
   * @param address - address of the cell in which formula is located
   */
  public formulaWithContext(address: SimpleCellAddress): Ast {
    this.formulaAddress = address
    return this.formula()
  }

  /**
   * Parses tokenized formula and builds abstract syntax tree
   *
   * @param lexResult - tokenized formula
   * @param formulaAddress - address of the cell in which formula is located
   */
  public parseFromTokens(lexResult: ILexingResult, formulaAddress: SimpleCellAddress): Ast {
    this.input = lexResult.tokens

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

    const topLeftCorner = {
      type: cellArg.reference.type,
      row: cellArg.reference.row + rowShift,
      col: cellArg.reference.col + colShift,
    }

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
      const bottomRightCorner = {
        type: topLeftCorner.type,
        row: topLeftCorner.row + height - 1,
        col: topLeftCorner.col + width - 1,
      }
      return buildCellRangeAst(topLeftCorner, bottomRightCorner)
    }
  }
}

type AstRule = (idxInCallingRule?: number, ...args: any[]) => (Ast)
type OrArg = Array<IAnyOrAlt<any>> | OrMethodOpts<any>

export class FormulaLexer {
  private readonly lexer: Lexer

  constructor(lexerConfig: ILexerConfig) {
    this.lexer = new Lexer(lexerConfig.allTokens, { ensureOptimizations: true })
  }

  /**
   * Returns Lexer tokens from formula string
   *
   * @param text - string representation of a formula
   */
  public tokenizeFormula(text: string): ILexingResult {
    return this.lexer.tokenize(text)
  }
}
