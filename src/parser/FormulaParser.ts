import {
  createToken,
  Lexer,
  Parser,
  ILexingResult,
  tokenMatcher,
  IAnyOrAlt,
  OrMethodOpts
} from "chevrotain"

import {
  TemplateAst as Ast,
  buildDivOpAst,
  buildMinusOpAst,
  buildNumberAst,
  buildStringAst,
  buildPlusOpAst,
  buildProcedureAst,
  buildCellReferenceAst,
  buildCellRangeAst,
  buildTimesOpAst,
  CellReferenceAst,
  buildErrorAst
} from "./Ast"

const EqualsOp = createToken({name: "EqualsOp", pattern: /=/})

/* arithmetic */
// abstract for + -
const AdditionOp = createToken({
  name: "AdditionOp",
  pattern: Lexer.NA
})
const PlusOp = createToken({name: "PlusOp", pattern: /\+/, categories: AdditionOp})
const MinusOp = createToken({name: "MinusOp", pattern: /-/, categories: AdditionOp})

// abstract for * /
const MultiplicationOp = createToken({
  name: "MultiplicationOp",
  pattern: Lexer.NA
})
const TimesOp = createToken({name: "TimesOp", pattern: /\*/, categories: MultiplicationOp})
const DivOp = createToken({name: "DivOp", pattern: /\//, categories: MultiplicationOp})

/* addresses */
export const RelativeCell = createToken({name: "RelativeCell", pattern: /[A-Za-z]+[0-9]+/})
export const RangeSeparator = createToken({name: "RangeSeparator", pattern: /:/})

/* parenthesis */
const LParen = createToken({name: "LParen", pattern: /\(/})
const RParen = createToken({name: "RParen", pattern: /\)/})

/* prcoedures */
const ProcedureName = createToken({name: "ProcedureName", pattern: /[A-Za-z]+/})

/* terminals */
const NumberLiteral = createToken({name: "NumberLiteral", pattern: /(\d+(\.\d+)?)/})

/* separator */
const ArgSeparator = createToken({name: "ArgSeparator", pattern: /;/})

/* string literal */
const StringLiteral = createToken({name: "StringLiteral", pattern: /'([^'\\]*(\\.[^'\\]*)*)'/})

/* skipping whitespaces */
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED
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
  RelativeCell,
  ProcedureName,
  ArgSeparator,
  NumberLiteral,
  StringLiteral,
  AdditionOp,
  MultiplicationOp
]

// F -> '=' E
// E -> M + E | M - E | M    --->    M { + M }*
// M -> C * M | C / M | C    --->    C { * C }*
// C -> N | A:A | A | P | num
// N -> '(' E ')'
// A -> adresy
// P -> procedury
class FormulaParser extends Parser {
  private cellCounter = 0

  private atomicExpCache : OrArg | undefined

  constructor() {
    super(allTokens, {outputCst: false})
    this.performSelfAnalysis()
  }

  public reset() {
    super.reset()
    this.cellCounter = 0
  }

  public formula: AstRule = this.RULE("formula", () => {
    this.CONSUME(EqualsOp)
    return this.SUBRULE(this.additionExpression)
  })

  private additionExpression: AstRule = this.RULE("additionExpression", () => {
    let lhs: Ast = this.SUBRULE(this.multiplicationExpression)

    this.MANY(() => {
      const op = this.CONSUME(AdditionOp)
      const rhs = this.SUBRULE2(this.multiplicationExpression)

      if (tokenMatcher(op, PlusOp)) {
        lhs = buildPlusOpAst(lhs, rhs)
      } else if (tokenMatcher(op, MinusOp)) {
        lhs = buildMinusOpAst(lhs, rhs)
      } else {
        throw Error("Operator not supported")
      }
    })

    return lhs
  })


  private multiplicationExpression: AstRule = this.RULE("multiplicationExpression", () => {
    let lhs: Ast = this.SUBRULE(this.atomicExpression)

    this.MANY(() => {
      const op = this.CONSUME(MultiplicationOp)
      const rhs = this.SUBRULE2(this.atomicExpression)

      if (tokenMatcher(op, TimesOp)) {
        lhs = buildTimesOpAst(lhs, rhs)
      } else if (tokenMatcher(op, DivOp)) {
        lhs = buildDivOpAst(lhs, rhs)
      } else {
        throw Error("Operator not supported")
      }
    })

    return lhs
  })

  private cellRangeExpression: AstRule = this.RULE("cellRangeExpression", () => {
    this.CONSUME(RelativeCell)
    this.CONSUME2(RangeSeparator)
    this.CONSUME3(RelativeCell)
    return buildCellRangeAst(this.cellCounter++)
  })

  private atomicExpression: AstRule = this.RULE("atomicExpression", () => {
    return this.OR(this.atomicExpCache || (this.atomicExpCache = [
      {
        ALT: () => this.SUBRULE(this.parenthesisExpression)
      },
      {
        ALT: () => this.SUBRULE(this.cellRangeExpression)
      },
      {
        ALT: () => this.SUBRULE(this.relativeCellExpression)
      },
      {
        ALT: () => this.SUBRULE(this.procedureExpression)
      },
      {
        ALT: () => {
          const number = this.CONSUME(NumberLiteral)
          return buildNumberAst(parseFloat(number.image))
        }
      },
      {
        ALT: () => {
          const str = this.CONSUME(StringLiteral)
          return buildStringAst(str.image.slice(1, -1))
        }
      }
    ]))
  })

  private procedureExpression: AstRule = this.RULE("procedureExpression", () => {
    const procedureName = this.CONSUME(ProcedureName).image
    let args: Ast[] = []
    this.CONSUME(LParen)
    this.MANY_SEP({
      SEP: ArgSeparator,
      DEF: () => {
        args.push(this.SUBRULE(this.atomicExpression))
      }
    })
    this.CONSUME(RParen)
    return buildProcedureAst(procedureName, args)
  })

  private relativeCellExpression: CellReferenceAstRule = this.RULE("relativeCellExpression", () => {
    this.CONSUME(RelativeCell)
    return buildCellReferenceAst(this.cellCounter++)
  })

  private parenthesisExpression: AstRule = this.RULE("parenthesisExpression", () => {
    this.CONSUME(LParen)
    const expression = this.SUBRULE(this.additionExpression)
    this.CONSUME(RParen)
    return expression
  })
}


type AstRule = (idxInCallingRule?: number, ...args: any[]) => (Ast)
type CellReferenceAstRule = (idxInCallingRule?: number, ...args: any[]) => (CellReferenceAst)
type OrArg = IAnyOrAlt<any>[] | OrMethodOpts<any>

const FormulaLexer = new Lexer(allTokens, {ensureOptimizations: true})
const parser = new FormulaParser()

export function tokenizeFormula(text: string): ILexingResult {
  return FormulaLexer.tokenize(text)
}

export function parseFromTokens(lexResult: ILexingResult): Ast {
  parser.input = lexResult.tokens

  const ast = parser.formula()
  const errors = parser.errors

  if (errors.length > 0) {
    return buildErrorAst(errors.map(e =>
        ({
          name: e.name,
          message: e.message
        })
    ))
  }

  return ast
}

export function parseFormula(text: string): Ast {
  const lexResult = FormulaLexer.tokenize(text)
  return parseFromTokens(lexResult)
}
