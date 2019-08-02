import {Config} from '../../src'
import {simpleCellAddress} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildLexerConfig, FormulaLexer, ParserWithCaching} from '../../src/parser'
import {adr} from "../testUtils";

describe('Compute hash from ast', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping()
  sheetMapping.addSheet('Sheet1')
  const lexer = new FormulaLexer(buildLexerConfig(config))
  const parser = new ParserWithCaching(config, sheetMapping.fetch)

  it('#computeHash literals', async () => {
    const formula = '=CONCATENATE("foo", 42.34)'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)

    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash function call', async () => {
    const address = adr('A1')
    const formula = '=SUM(1,2,3)'
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash simple addreess', async () => {
    const formula = '=$Sheet1.A1'
    const address = adr('D6')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash absolute col', async () => {
    const formula = '=$Sheet1.$A1'
    const address = adr('D6')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash absolute row addreess', async () => {
    const formula = '=$Sheet1.A$1'
    const address = adr('D6')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash absolute address', async () => {
    const formula = '=$Sheet1.$A$1'
    const address = adr('D6')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash cell range', async () => {
    const formula = '=$Sheet1.$A$1:B$2'
    const address = adr('D6')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash ops', async () => {
    const formula = '=-1+1-1*1/1^1&1=1<>1<1<=1>1<1'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash cell ref between strings', () => {
    const formula = '="A5"+A4+"A6"'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash cell ref in string with escape', () => {
    const formula = '="fdsaf\\"A5"'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })
})
