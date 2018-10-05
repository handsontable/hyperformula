import {
  createToken,
  Lexer,
  Parser,
  IToken,
  CstNode
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

export class FormulaParser extends Parser {
  constructor() {
    super(allTokens)
    this.performSelfAnalysis()
  }

  public formula = this.RULE("formula", () => {
    this.CONSUME(EqualsOp)
    this.SUBRULE(this.additionExpression)
  })

  private additionExpression = this.RULE("additionExpression", () => {
    this.SUBRULE(this.multiplicationExpression, {LABEL: "lhs"})
    this.MANY(() => {
      this.CONSUME(AdditionOp)
      this.SUBRULE2(this.additionExpression, {LABEL: "rhs"})
    })
  })

  private multiplicationExpression = this.RULE("multiplicationExpression", () => {
    this.SUBRULE(this.atomicExpression, {LABEL: "lhs"})
    this.MANY(() => {
      this.CONSUME(MultiplicationOp)
      this.SUBRULE2(this.multiplicationExpression, {LABEL: "rhs"})
    })
  })

  private atomicExpression = this.RULE("atomicExpression", () => {
    this.OR([
      {ALT: () => this.SUBRULE(this.parenthesisExpression)},
      {ALT: () => this.CONSUME(Number)},
      {ALT: () => this.SUBRULE(this.relativeCellExpression)}
    ])
  })

  private relativeCellExpression = this.RULE("relativeCellExpression", () => {
    this.CONSUME(RelativeCell)
  })

  private parenthesisExpression = this.RULE("parenthesisExpression", () => {
    this.CONSUME(LParen)
    this.SUBRULE(this.additionExpression)
    this.CONSUME(RParen)
  })
}

export const parser = new FormulaParser()

export const Vistor = parser.getBaseCstVisitorConstructor()

interface AdditionExpression {
  lhs: CstNode
  AdditionOp?: IToken[]
  rhs?: CstNode
}

interface MultiplicationExpresion {
  lhs: CstNode
  MultiplicationOp?: IToken[]
  rhs?: CstNode
}

interface RelativeCellExpression {
  RelativeCell: IToken[]
}

interface AtomicCellExpression {
  Number?: IToken[]
  relativeCellExpression?: CstNode
  parenthesisExpression?: CstNode
}

export class AstBuilder extends Vistor {
  constructor() {
    super()
    this.validateVisitor()
  }

  additionExpression(ctx: AdditionExpression): Ast {
    const lresult = this.visit(ctx.lhs)
    if (ctx.rhs != undefined && ctx.AdditionOp != undefined) {
      const rresult = this.visit(ctx.rhs)
      switch (ctx.AdditionOp[0].tokenType!.tokenName) {
        case "PlusOp":
          return buildPlusOpAst(lresult, rresult)
        case "MinusOp":
          return buildMinusOpAst(lresult, rresult)
        default:
          throw Error("Expression not handled")
      }
    } else {
      return lresult
    }
  }

  multiplicationExpression(ctx: MultiplicationExpresion): Ast {
    const lresult = this.visit(ctx.lhs)
    if (ctx.rhs != undefined && ctx.MultiplicationOp != undefined) {
      const rresult = this.visit(ctx.rhs)
      switch (ctx.MultiplicationOp[0].tokenType!.tokenName) {
        case "TimesOp":
          return buildTimesOpAst(lresult, rresult)
        default:
          throw Error("Expression not handled")
      }
    } else {
      return lresult
    }
  }

  relativeCellExpression(ctx: RelativeCellExpression): Ast {
    return buildRelativeCellAst(ctx.RelativeCell[0].image)
  }

  atomicExpression(ctx: AtomicCellExpression): Ast {
    if (ctx.relativeCellExpression != undefined) {
      return this.visit(ctx.relativeCellExpression)
    }
    if (ctx.parenthesisExpression != undefined) {
      return this.visit(ctx.parenthesisExpression)
    }
    if (ctx.Number != undefined) {
      return buildNumberAst(parseInt(ctx.Number[0].image))
    }

    throw Error("WUT")
  }

  parenthesisExpression(ctx: { additionExpression: CstNode }): Ast {
    return this.visit(ctx.additionExpression)
  }

  formula(ctx: { additionExpression: CstNode }): Ast {
    return this.visit(ctx.additionExpression)
  }
}

export function parseFormula(text: string) {
  const lexResult = FormulaLexer.tokenize(text)
  parser.input = lexResult.tokens
  return parser.formula()
}
