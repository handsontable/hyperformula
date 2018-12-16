import {createToken, IAnyOrAlt, ILexingResult, Lexer, OrMethodOpts, Parser, tokenMatcher} from 'chevrotain'

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
  buildProcedureAst,
  buildStringAst,
  buildTimesOpAst,
  CellReferenceAst,
  ParsingErrorType,
} from './Ast'

/* arithmetic */
// abstract for + -
const AdditionOp = createToken({
  name: 'AdditionOp',
  pattern: Lexer.NA,
})
const PlusOp = createToken({name: 'PlusOp', pattern: /\+/, categories: AdditionOp})
const MinusOp = createToken({name: 'MinusOp', pattern: /-/, categories: AdditionOp})

// abstract for * /
const MultiplicationOp = createToken({
  name: 'MultiplicationOp',
  pattern: Lexer.NA,
})
const TimesOp = createToken({name: 'TimesOp', pattern: /\*/, categories: MultiplicationOp})
const DivOp = createToken({name: 'DivOp', pattern: /\//, categories: MultiplicationOp})

const BooleanOp = createToken({
  name: 'BooleanOp',
  pattern: Lexer.NA,
})
const EqualsOp = createToken({name: 'EqualsOp', pattern: /=/, categories: BooleanOp})
const NotEqualOp = createToken({name: 'NotEqualOp', pattern: /<>/, categories: BooleanOp})
const GreaterThanOp = createToken({name: 'GreaterThanOp', pattern: />/, categories: BooleanOp})
const LessThanOp = createToken({name: 'LessThanOp', pattern: /</, categories: BooleanOp})
const GreaterThanOrEqualOp = createToken({name: 'GreaterThanOrEqualOp', pattern: />=/, categories: BooleanOp})
const LessThanOrEqualOp = createToken({name: 'LessThanOrEqualOp', pattern: /<=/, categories: BooleanOp})

const ConcatenateOp = createToken({name: 'ConcatenateOp', pattern: /&/})

/* addresses */
export const CellReference = createToken({name: 'CellReference', pattern: Lexer.NA})
export const RelativeCell = createToken({name: 'RelativeCell', pattern: /[A-Za-z]+[0-9]+/, categories: CellReference})
export const AbsoluteColCell = createToken({name: 'AbsoluteColCell', pattern: /\$[A-Za-z]+[0-9]+/, categories: CellReference})
export const AbsoluteRowCell = createToken({name: 'AbsoluteRowCell', pattern: /[A-Za-z]+\$[0-9]+/, categories: CellReference})
export const AbsoluteCell = createToken({name: 'AbsoluteCell', pattern: /\$[A-Za-z]+\$[0-9]+/, categories: CellReference})
export const RangeSeparator = createToken({name: 'RangeSeparator', pattern: /:/})

/* parenthesis */
const LParen = createToken({name: 'LParen', pattern: /\(/})
const RParen = createToken({name: 'RParen', pattern: /\)/})

/* prcoedures */
const OffsetProcedureName = createToken({name: 'OffsetProcedureName', pattern: /OFFSET/i })
const ProcedureName = createToken({name: 'ProcedureName', pattern: /[A-Za-z]+/})

/* terminals */
const NumberLiteral = createToken({name: 'NumberLiteral', pattern: /\d+(\.\d+)?/})

/* separator */
const ArgSeparator = createToken({name: 'ArgSeparator', pattern: Config.FUNCTION_ARG_SEPARATOR})

/* string literal */
const StringLiteral = createToken({name: 'StringLiteral', pattern: /"([^"\\]*(\\.[^"\\]*)*)"/})

/* skipping whitespaces */
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED,
})

/* order is important, first pattern is used */
const allTokens = [
  WhiteSpace,
  PlusOp,
  MinusOp,
  TimesOp,
  DivOp,
  EqualsOp,
  NotEqualOp,
  GreaterThanOrEqualOp,
  LessThanOrEqualOp,
  GreaterThanOp,
  LessThanOp,
  LParen,
  RParen,
  RangeSeparator,
  AbsoluteCell,
  AbsoluteColCell,
  AbsoluteRowCell,
  RelativeCell,
  OffsetProcedureName,
  ProcedureName,
  ArgSeparator,
  NumberLiteral,
  StringLiteral,
  ConcatenateOp,
  BooleanOp,
  AdditionOp,
  MultiplicationOp,
  CellReference,
]

// F -> '=' E
// B -> K < B | K >= B ... | K
// K -> E & K | E
// E -> M + E | M - E | M
// M -> C * M | C / M | C
// C -> N | R | O | A | P | num
// R -> A:OFFSET(..) | A:A
// O -> OFFSET(..) | OFFSET(..):A | OFFSET(..):OFFSET(..)
// N -> '(' E ')'
// A -> adresy
// P -> procedury
class FormulaParser extends Parser {

  public formula: AstRule = this.RULE('formula', () => {
    this.CONSUME(EqualsOp)
    return this.SUBRULE(this.booleanExpression)
  })
  private formulaAddress?: SimpleCellAddress

  private atomicExpCache: OrArg | undefined

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

  private concatenateExpression: AstRule = this.RULE('concatenateExpression', () => {
    let lhs: Ast = this.SUBRULE(this.additionExpression)

    this.MANY(() => {
      this.CONSUME(ConcatenateOp)
      const rhs = this.SUBRULE2(this.additionExpression)
      lhs = buildConcatenateOpAst(lhs, rhs)
    })

    return lhs
  })

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

  private multiplicationExpression: AstRule = this.RULE('multiplicationExpression', () => {
    let lhs: Ast = this.SUBRULE(this.atomicExpression)

    this.MANY(() => {
      const op = this.CONSUME(MultiplicationOp)
      const rhs = this.SUBRULE2(this.atomicExpression)

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

  private procedureExpression: AstRule = this.RULE('procedureExpression', () => {
    const procedureName = this.CONSUME(ProcedureName).image.toUpperCase()
    const args: Ast[] = []
    this.CONSUME(LParen)
    this.MANY_SEP({
      SEP: ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.booleanExpression))
      },
    })
    this.CONSUME(RParen)
    return buildProcedureAst(procedureName, args)
  })

  private offsetProcedureExpression: AstRule = this.RULE('offsetProcedureExpression', () => {
    const args: Ast[] = []
    this.CONSUME(OffsetProcedureName)
    this.CONSUME(LParen)
    this.MANY_SEP({
      SEP: ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.booleanExpression))
      },
    })
    this.CONSUME(RParen)
    return this.handleOffsetHeuristic(args)
  })

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

  private cellReference: AstRule = this.RULE('cellReference', () => {
    const cell = this.CONSUME(CellReference)
    return buildCellReferenceAst(cellAddressFromString(cell.image, this.formulaAddress!))
  })

  private parenthesisExpression: AstRule = this.RULE('parenthesisExpression', () => {
    this.CONSUME(LParen)
    const expression = this.SUBRULE(this.booleanExpression)
    this.CONSUME(RParen)
    return expression
  })

  constructor() {
    super(allTokens, {outputCst: false, maxLookahead: 7})
    this.performSelfAnalysis()
  }

  public formulaWithContext(address: SimpleCellAddress): Ast {
    this.formulaAddress = address
    return this.formula()
  }

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

const FormulaLexer = new Lexer(allTokens, {ensureOptimizations: true})
const parser = new FormulaParser()

export function tokenizeFormula(text: string): ILexingResult {
  return FormulaLexer.tokenize(text)
}

export function parseFromTokens(lexResult: ILexingResult, formulaAddress: SimpleCellAddress): Ast {
  parser.input = lexResult.tokens

  const ast = parser.formulaWithContext(formulaAddress)
  const errors = parser.errors

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
