import {
  createToken,
  Lexer,
  Parser,
  IToken,
  ILexingResult,
  tokenMatcher
} from "chevrotain"

import {
  Ast, buildDivOpAst,
  buildMinusOpAst,
  buildNumberAst,
  buildPlusOpAst,
  buildRelativeCellAst,
  buildTimesOpAst
} from "../parser/Ast"

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
const RelativeCell = createToken({name: "RelativeCell", pattern: /[A-Za-z]+[0-9]+/})

/* parenthesis */
const LParen = createToken({name: "LParen", pattern: /\(/})
const RParen = createToken({name: "RParen", pattern: /\)/})

/* terminals */
const NumberLiteral = createToken({name: "NumberLiteral", pattern: /(\d+(\.\d+)?)/})

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
  NumberLiteral,
  RelativeCell,
  AdditionOp,
  MultiplicationOp
]

// F -> '=' E
// E -> M + E | M - E | M    --->    M { + M }*
// M -> C * M | C / M | C    --->    C { * C }*
// C -> N | A | P | num
// N -> '(' E ')'
// A -> adresy
// P -> procedury
class FormulaParser extends Parser {
  constructor() {
    super(allTokens, {outputCst: false})
    this.performSelfAnalysis()
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

  private atomicExpression: AstRule = this.RULE("atomicExpression", () => {
    return this.OR([
      {
        ALT: () => this.SUBRULE(this.parenthesisExpression)
      },
      {
        ALT: () => {
          const number = this.CONSUME(NumberLiteral)
          return buildNumberAst(parseFloat(number.image))
        }
      },
      {
        ALT: () => this.SUBRULE(this.relativeCellExpression)
      }
    ])
  })

  private relativeCellExpression: AstRule = this.RULE("relativeCellExpression", () => {
    const address = this.CONSUME(RelativeCell)
    return buildRelativeCellAst(address.image)
  })

  private parenthesisExpression: AstRule = this.RULE("parenthesisExpression", () => {
    this.CONSUME(LParen)
    const expression = this.SUBRULE(this.additionExpression)
    this.CONSUME(RParen)
    return expression
  })
}


type AstRule = (idxInCallingRule?: number, ...args: any[]) => (Ast)

const FormulaLexer = new Lexer(allTokens, {ensureOptimizations: true})
const parser = new FormulaParser()

export function tokenizeFormula(text: string): ILexingResult {
  return FormulaLexer.tokenize(text)
}

export function parseFormula(text: string) {
  const lexResult = FormulaLexer.tokenize(text)
  parser.input = lexResult.tokens
  return parser.formula()
}
