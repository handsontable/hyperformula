import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB} from '../../src/i18n/languages'
import {buildLexerConfig, FormulaLexer} from '../../src/parser'
import {CellReference, EqualsOp, ProcedureName, RangeSeparator, RParen, WhiteSpace} from '../../src/parser/LexerConfig'
import {bindWhitespacesToTokens} from '../../src/parser/ParserWithCaching'
import {expectArrayWithSameContent} from '../testUtils'

describe('tokenizeFormula', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  const lexer = new FormulaLexer(buildLexerConfig(config))

  it('should not skip whitespaces', () => {
    const tokens = lexer.tokenizeFormula('= A1 + 2').tokens
    expect(tokens.length).toBe(7)
  })

  it('should forget about trailing whitespaces', () => {
    const tokens = lexer.tokenizeFormula('=SUM(A1:A2)   ').tokens
    expect(tokens.length).toBe(6)
    expect(tokens.map(token => token.tokenType).find(tokenType => tokenType === WhiteSpace)).toBe(undefined)
  })

  it('should skip whitespace inside range', () => {
    const tokens = lexer.tokenizeFormula('=A1: A1').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)
    expectArrayWithSameContent(tokenTypes, ['EqualsOp', 'CellReference', 'RangeSeparator', 'CellReference'])
  })

  it('should skip whitespace inside range 2', () => {
    const tokens = lexer.tokenizeFormula('=A1 :A1').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)
    expectArrayWithSameContent(tokenTypes, ['EqualsOp', 'CellReference', 'RangeSeparator', 'CellReference'])
  })

  it('should skip whitespace inside range 3', () => {
    const tokens = lexer.tokenizeFormula('=A1 : A1').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)
    expectArrayWithSameContent(tokenTypes, ['EqualsOp', 'CellReference', 'RangeSeparator', 'CellReference'])
  })

  it('should not skip whitespaces before named expression', () => {
    const tokens = lexer.tokenizeFormula('= A1 + TRUE').tokens

    const tokenTypes = tokens.map(token => token.tokenType.name)
    expectArrayWithSameContent(tokenTypes, ['EqualsOp', 'WhiteSpace', 'CellReference', 'WhiteSpace', 'PlusOp', 'WhiteSpace', 'NamedExpression'])
  })

  it('should skip whitespace before function args separator', () => {
    const tokens = lexer.tokenizeFormula('=SUM(A1 , A2)').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)

    expectArrayWithSameContent(tokenTypes, ['EqualsOp', 'ProcedureName', 'CellReference', 'ArrayColSep', 'WhiteSpace', 'CellReference', 'RParen'])
  })

  it('should not skip whitespace when there is empty argument ', () => {
    const tokens = lexer.tokenizeFormula('=PV(A1 ,   ,A2)').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)

    expectArrayWithSameContent(tokenTypes, ['EqualsOp', 'ProcedureName', 'CellReference', 'ArrayColSep', 'WhiteSpace', 'ArgSeparator', 'CellReference', 'RParen'])
  })

  it('should treat space as whitespace', () => {
    const tokens = lexer.tokenizeFormula('= 1').tokens
    expect(tokens[1].tokenType).toEqual(WhiteSpace)
  })

  it('should treat tabulator (U+0009) as whitespace', () => {
    const tokens = lexer.tokenizeFormula('=\t1').tokens
    expect(tokens[1].tokenType).toEqual(WhiteSpace)
  })

  it('should treat carriage return (U+000D) as whitespace', () => {
    const tokens = lexer.tokenizeFormula('=\r1').tokens
    expect(tokens[1].tokenType).toEqual(WhiteSpace)
  })

  it('should treat non-breaking space as a whitespace', () => {
    const tokens = lexer.tokenizeFormula('=\u00A01').tokens
    expect(tokens[1].tokenType).toEqual(WhiteSpace)
  })

  it('should treat line feed (U+000A) as whitespace ', () => {
    const tokens = lexer.tokenizeFormula('=\n1').tokens
    expect(tokens[1].tokenType).toEqual(WhiteSpace)
  })

  it('should treat multiple whitespaces as one token', () => {
    const tokens = lexer.tokenizeFormula('=\n\t\r 1').tokens
    expect(tokens.length).toEqual(3)
    expect(tokens[1].tokenType).toEqual(WhiteSpace)
    expect(tokens[1].image).toEqual('\n\t\r ')
  })
})

describe('processWhitespaces', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  const lexer = new FormulaLexer(buildLexerConfig(config))

  it('should do nothing when no whitespaces', () => {
    const tokens = lexer.tokenizeFormula('=SUM(A1:A2)').tokens
    const processed = bindWhitespacesToTokens(tokens)
    expect(processed.length).toBe(6)
    expect(processed.map(processed => processed.leadingWhitespace).every(processed => processed === undefined)).toBe(true)
    expectArrayWithSameContent(
      [EqualsOp, ProcedureName, CellReference, RangeSeparator, CellReference, RParen],
      processed.map(token => token.tokenType)
    )
  })

  it('should add leading whitespace to token', () => {
    const tokens = lexer.tokenizeFormula('= SUM(A1:A2)').tokens
    const processed = bindWhitespacesToTokens(tokens)
    expect(processed.length).toBe(6)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(processed[1].leadingWhitespace!.image).toBe(' ')
    expectArrayWithSameContent(
      [EqualsOp, ProcedureName, CellReference, RangeSeparator, CellReference, RParen],
      processed.map(token => token.tokenType)
    )
  })

  it('should work for multiple whitespaces', () => {
    const tokens = lexer.tokenizeFormula('=    SUM(A1:A2)').tokens
    const processed = bindWhitespacesToTokens(tokens)
    expect(processed.length).toBe(6)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(processed[1].leadingWhitespace!.image).toBe('    ')
    expectArrayWithSameContent(
      [EqualsOp, ProcedureName, CellReference, RangeSeparator, CellReference, RParen],
      processed.map(token => token.tokenType)
    )
  })

  it('should work for whitespace at the beginning', () => {
    const tokens = lexer.tokenizeFormula(' =SUM(A1:A2)').tokens
    const processed = bindWhitespacesToTokens(tokens)
    expect(processed.length).toBe(6)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(processed[0].leadingWhitespace!.image).toBe(' ')
    expectArrayWithSameContent(
      [EqualsOp, ProcedureName, CellReference, RangeSeparator, CellReference, RParen],
      processed.map(token => token.tokenType)
    )
  })

  it('should not include whitespaces directly on the list', () => {
    const tokens = lexer.tokenizeFormula('=   SUM(   A1:A2)   ').tokens
    const processed = bindWhitespacesToTokens(tokens)
    expect(processed.length).toBe(6)
    expectArrayWithSameContent(
      [EqualsOp, ProcedureName, CellReference, RangeSeparator, CellReference, RParen],
      processed.map(token => token.tokenType)
    )
  })
})
