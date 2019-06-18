import {buildLexerConfig, CellReferenceAst, FormulaLexer, ParserWithCaching} from "../../src/parser";
import {Config} from "../../src";
import {SheetMapping} from "../../src/SheetMapping";
import {CellAddress} from "../../src/parser/CellAddress";
import {simpleCellAddress} from "../../src/Cell";

describe('Compute hash from ast', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping()
  sheetMapping.addSheet("Sheet1")
  const lexer = new FormulaLexer(buildLexerConfig(config))
  const parser = new ParserWithCaching(config, sheetMapping.fetch)

  it('#computeHash', async () => {
    const address = simpleCellAddress(0, 0, 0)
    const formula = '=1+SUM(1,2,3)*3'
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash simple addreess', async () => {
    const formula = '=$Sheet1.A1'
    const address = simpleCellAddress(0, 3, 5)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash absolute col', async () => {
    const formula = '=$Sheet1.$A1'
    const address = simpleCellAddress(0, 3, 5)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash absolute row addreess', async () => {
    const formula = '=$Sheet1.A$1'
    const address = simpleCellAddress(0, 3, 5)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash absolute address', async () => {
    const formula = '=$Sheet1.$A$1'
    const address = simpleCellAddress(0, 3, 5)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash cell range', async () => {
    const formula = '=$Sheet1.$A$1:B$2'
    const address = simpleCellAddress(0, 3, 5)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash ops', async () => {
    const formula = '=-1+1-1*1/1^1&1=1<>1<1<=1>1<1'
    const address = simpleCellAddress(0, 0, 0)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash cell ref between strings', () => {
    const formula = '="A5"+A4+"A6"'
    const address = simpleCellAddress(0, 0, 0)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })

  it('#computeHash cell ref in string with escape', () => {
    const formula = '="fdsaf\\"A5"'
    const address = simpleCellAddress(0, 0, 0)
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHash(lexerResult.tokens, address)

    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual(hashFromTokens)
  })
})
