import {Config} from '../../src/Config'
import {simpleCellAddress} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB, plPL} from '../../src/i18n'
import {buildLexerConfig, FormulaLexer, ParserWithCaching} from '../../src/parser'
import {adr} from '../testUtils'

describe('Compute hash from ast', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping(enGB)
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  const lexer = new FormulaLexer(buildLexerConfig(config))
  const parser = new ParserWithCaching(config, sheetMapping.get)

  function expectHashFromAstMatchHashFromTokens(formula: string) {
    const baseAddress = adr('A1')
    const ast = parser.parse(formula, baseAddress).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, baseAddress)

    const hashFromAst = parser.computeHashFromAst(ast)

    expect(hashFromAst).toEqual(hashFromTokens)
  }

  it('literals',  () => {
    const formula = '=CONCATENATE("foo", 42.34)'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('function call',  () => {
    const formula = '=SUM(1,2,3)'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('function call - case insensitive', () => {
    const formula = '=SuM(1,2,3)'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('simple addreess',  () => {
    const formula = '=Sheet1!A1'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('absolute col',  () => {
    const formula = '=Sheet1!$A1'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('absolute row addreess',  () => {
    const formula = '=Sheet1!A$1'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('absolute address',  () => {
    const formula = '=Sheet1!$A$1'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('cell range',  () => {
    const formula = '=$A$1:B$2'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('cell range with sheet on the left', () => {
    const formula = '=Sheet1!A5:B16'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('cell range with sheet on both sides', () => {
    const formula = '=Sheet1!A5:Sheet2!B16'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('column range',  () => {
    const formula = '=$A:B'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('column range with sheet on the left', () => {
    const formula = '=Sheet1!A:B'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('column range with sheet on both sides', () => {
    const formula = '=Sheet1!A:Sheet2!B'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('ops',  () => {
    const formula = '=-1+1-1*1/1^1&1=1<>1<1<=1>1<1%'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('parenthesis',  () => {
    const formula = '=-1*(-2)*(3+4)+5'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('nested parenthesis',  () => {
    const formula = '=-(-(3+4))'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('cell ref between strings', () => {
    const formula = '="A5"+A4+"A6"'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('cell ref in string with escape', () => {
    const formula = '="fdsaf\\"A5"'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('procedure with error literal', () => {
    const formula = '=#DIV/0!'
    expectHashFromAstMatchHashFromTokens(formula)
  })

  it('procedure hash using canonical name', () => {
    const config = new Config({ language: plPL })
    const sheetMapping = new SheetMapping(plPL)
    sheetMapping.addSheet('Sheet1')
    const lexer = new FormulaLexer(buildLexerConfig(config))
    const parser = new ParserWithCaching(config, sheetMapping.get)

    const formula = '=SUMA(A1)'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)
    const hash = parser.computeHashFromAst(ast)

    expect(hash).toEqual(hashFromTokens)
  })

  it('procedure name with missing translation', () => {
    const config = new Config({ language: plPL })
    const sheetMapping = new SheetMapping(plPL)
    sheetMapping.addSheet('Sheet1')
    const lexer = new FormulaLexer(buildLexerConfig(config))
    const parser = new ParserWithCaching(config, sheetMapping.get)

    const formula = '=FooBAR(A1)'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)
    const hash = parser.computeHashFromAst(ast)

    expect(hash).toEqual(hashFromTokens)
  })

  it('should work with whitespaces', () => {
    const formula = '= - 1 + 2 / 3 - 4 % * (1 + 2 ) + SUM( A1, A1 : A2 ) + #DIV/0!'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual('= - 1 + 2 / 3 - 4 % * (1 + 2 ) + SUM( #0R0, #0R0:#1R0 ) + #DIV/0!')
  })

  it('should skip whitespaces before function args separators', () => {
    const formula = '=SUM(A1 , A2)'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast
    const hash = parser.computeHashFromAst(ast)
    expect(hash).toEqual('=SUM(#0R0, #1R0)')
  })

  it('should work with decimal separator', () => {
    const config = new Config({ decimalSeparator: ',', functionArgSeparator: ';' })
    const sheetMapping = new SheetMapping(plPL)
    sheetMapping.addSheet('Sheet1')
    const lexer = new FormulaLexer(buildLexerConfig(config))
    const parser = new ParserWithCaching(config, sheetMapping.get)


    const formula = '=1+123,456'
    const address = adr('A1')
    const ast = parser.parse(formula, address).ast

    const lexerResult = lexer.tokenizeFormula(formula)
    const hashFromTokens = parser.computeHashFromTokens(lexerResult.tokens, address)
    const hash = parser.computeHashFromAst(ast)

    expect(hash).toEqual(formula)
    expect(hash).toEqual(hashFromTokens)
  })
})
