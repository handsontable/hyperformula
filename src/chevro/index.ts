import {
  createToken,
  Lexer,
  Parser,
  IToken,
  CstNode, tokenMatcher
} from "chevrotain"

import {
  Ast,
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
const Number = createToken({name: "Number", pattern: /[1-9]\d*/})

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
  Number,
  RelativeCell,
  AdditionOp,
  MultiplicationOp
]

const FormulaLexer = new Lexer(allTokens)

// F -> '=' E
// E -> M + E | M - E | M
// M -> C * M | C / M | C
// C -> N | A | P | num
// N -> '(' E ')'
// A -> adresy
// P -> procedury

class FormulaParser extends Parser {
  constructor() {
    super(allTokens, {outputCst: false})
    this.performSelfAnalysis()
  }

  public formula = this.RULE("formula", () => {
    this.CONSUME(EqualsOp)
    return this.SUBRULE(this.additionExpression)
  })


  private additionExpression = this.RULE("additionExpression", () => {
    const lhs : Ast = this.SUBRULE(this.multiplicationExpression, {LABEL: "lhs"})
    let rhs : Ast
    let op : IToken

    this.MANY(() => {
      op = this.CONSUME(AdditionOp)
      rhs = this.SUBRULE2(this.additionExpression)
    })

    if (op! !== undefined && rhs! !== undefined) {
      if (tokenMatcher(op!, PlusOp)) {
        return buildPlusOpAst(lhs, rhs!)
      } else if (tokenMatcher(op!, MinusOp)) {
        return buildMinusOpAst(lhs, rhs!)
      } else {
        throw Error("Operator not supported")
      }
    } else {
      return lhs
    }
  })

  private multiplicationExpression = this.RULE("multiplicationExpression", () => {
    const lhs : Ast = this.SUBRULE(this.atomicExpression)
    let rhs : Ast
    let op : IToken

    this.MANY(() => {
      op = this.CONSUME(MultiplicationOp)
      rhs = this.SUBRULE2(this.multiplicationExpression)
    })

    if (op! !== undefined && rhs! !== undefined) {
      if (tokenMatcher(op!, TimesOp)) {
        return buildTimesOpAst(lhs, rhs!)
      } else {
        throw Error("Operator not supported")
      }
    } else {
      return lhs
    }
  })

  private atomicExpression = this.RULE("atomicExpression", () => {
    let result : Ast
    this.OR([
      {
        ALT: () => {
          result = this.SUBRULE(this.parenthesisExpression)
        }
      },
      {
        ALT: () => {
          const number = this.CONSUME(Number)
          result = buildNumberAst(parseInt(number.image))
        }
      },
      {
        ALT: () => {
          result = this.SUBRULE(this.relativeCellExpression)
        }
      }
    ])
    return result!
  })

  private relativeCellExpression = this.RULE("relativeCellExpression", () => {
    const address = this.CONSUME(RelativeCell)
    return buildRelativeCellAst(address.image)
  })

  private parenthesisExpression = this.RULE("parenthesisExpression", () => {
    this.CONSUME(LParen)
    const expression = this.SUBRULE(this.additionExpression)
    this.CONSUME(RParen)
    return expression
  })
}


const parser = new FormulaParser()

export function parseFormula(text: string) {
  const lexResult = FormulaLexer.tokenize(text)
  parser.input = lexResult.tokens
  return parser.formula()
}
