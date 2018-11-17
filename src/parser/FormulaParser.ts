import {createToken, IAnyOrAlt, ILexingResult, Lexer, OrMethodOpts, Parser, tokenMatcher} from 'chevrotain'

import {absoluteCellAddress, CellAddress, cellAddressFromString, CellReferenceType, SimpleCellAddress} from '../Cell'
import {
  Ast,
  NumberAst,
  CellReferenceAst,
  buildCellRangeAst,
  buildCellReferenceAst,
  buildDivOpAst,
  buildErrorAst,
  buildMinusOpAst,
  buildMinusUnaryOpAst,
  buildNumberAst,
  buildPlusOpAst,
  buildProcedureAst,
  buildStringAst,
  buildTimesOpAst,
} from './Ast'

const EqualsOp = createToken({name: 'EqualsOp', pattern: /=/})

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
const ProcedureName = createToken({name: 'ProcedureName', pattern: /[A-Za-z]+/})

/* terminals */
const NumberLiteral = createToken({name: 'NumberLiteral', pattern: /\d+(\.\d+)?/})

/* separator */
const ArgSeparator = createToken({name: 'ArgSeparator', pattern: /;/})

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
  EqualsOp,
  PlusOp,
  MinusOp,
  TimesOp,
  DivOp,
  LParen,
  RParen,
  RangeSeparator,
  AbsoluteCell,
  AbsoluteColCell,
  AbsoluteRowCell,
  RelativeCell,
  ProcedureName,
  ArgSeparator,
  NumberLiteral,
  StringLiteral,
  AdditionOp,
  MultiplicationOp,
  CellReference,
]

// F -> '=' E
// E -> M + E | M - E | M    --->    M { + M }*
// M -> C * M | C / M | C    --->    C { * C }*
// C -> N | A:A | A | P | num
// N -> '(' E ')'
// A -> adresy
// P -> procedury
class FormulaParser extends Parser {

  public formula: AstRule = this.RULE('formula', () => {
    this.CONSUME(EqualsOp)
    return this.SUBRULE(this.additionExpression)
  })
  private formulaAddress?: SimpleCellAddress

  private atomicExpCache: OrArg | undefined
  private cellExpCache: OrArg | undefined

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

  private cellRangeExpression: AstRule = this.RULE('cellRangeExpression', () => {
    const start = this.CONSUME(CellReference)
    this.CONSUME2(RangeSeparator)
    const end = this.CONSUME3(CellReference)
    return buildCellRangeAst(cellAddressFromString(start.image, this.formulaAddress!), cellAddressFromString(end.image, this.formulaAddress!))
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
    const procedureName = this.CONSUME(ProcedureName).image
    const args: Ast[] = []
    this.CONSUME(LParen)
    this.MANY_SEP({
      SEP: ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.atomicExpression))
      },
    })
    this.CONSUME(RParen)
    if (procedureName === 'OFFSET') {
      const ref = (args[0] as CellReferenceAst).reference
      return buildCellReferenceAst({
        type: ref.type,
        col: ref.col + (args[1] as NumberAst).value,
        row: ref.row + (args[2] as NumberAst).value,
      })
    } else {
      return buildProcedureAst(procedureName, args)
    }
  })

  private cellReference: AstRule = this.RULE('cellReference', () => {
    const cell = this.CONSUME(CellReference)
    return buildCellReferenceAst(cellAddressFromString(cell.image, this.formulaAddress!))
  })

  private parenthesisExpression: AstRule = this.RULE('parenthesisExpression', () => {
    this.CONSUME(LParen)
    const expression = this.SUBRULE(this.additionExpression)
    this.CONSUME(RParen)
    return expression
  })

  constructor() {
    super(allTokens, {outputCst: false})
    this.performSelfAnalysis()
  }

  public formulaWithContext(address: SimpleCellAddress): Ast {
    this.formulaAddress = address
    return this.formula()
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
          name: e.name,
          message: e.message,
        }),
      ))
  }

  return ast
}
