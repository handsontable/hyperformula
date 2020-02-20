import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB} from '../../src/i18n'
import {buildLexerConfig, FormulaLexer} from '../../src/parser'
import {EqualsOp, RangeSeparator, WhiteSpace} from '../../src/parser/LexerConfig'
import {processWhitespaces} from '../../src/parser/ParserWithCaching'
import {expect_array_with_same_content} from '../testUtils'

describe('tokenizeFormula', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping(enGB)
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
    expect_array_with_same_content(tokenTypes, ['EqualsOp', 'RelativeCell', 'RangeSeparator', 'RelativeCell'])
  })

  it('should skip whitespace inside range 2', () => {
    const tokens = lexer.tokenizeFormula('=A1 :A1').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)
    expect_array_with_same_content(tokenTypes, ['EqualsOp', 'RelativeCell', 'RangeSeparator', 'RelativeCell'])
  })

  it('should skip whitespace inside range 3', () => {
    const tokens = lexer.tokenizeFormula('=A1 : A1').tokens
    const tokenTypes = tokens.map(token => token.tokenType.name)
    expect_array_with_same_content(tokenTypes, ['EqualsOp', 'RelativeCell', 'RangeSeparator', 'RelativeCell'])
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
  const sheetMapping = new SheetMapping(enGB)
  sheetMapping.addSheet('Sheet1')
  const lexer = new FormulaLexer(buildLexerConfig(config))

  it('should do nothing when no whitespaces', () => {
    const tokens = lexer.tokenizeFormula('=SUM(A1:A2)').tokens
    const processed = processWhitespaces(tokens)
    expect(processed.length).toBe(6)
    expect(processed.map(processed => processed.leadingWhitespace).every(processed => processed === undefined)).toBe(true)
  })

  it('should add leading whitespace to token', () => {
    const tokens = lexer.tokenizeFormula('= SUM(A1:A2)').tokens
    const processed = processWhitespaces(tokens)
    expect(processed.length).toBe(6)
    expect(processed[1].leadingWhitespace!!.image).toBe(' ')
  })

  it('should work for multiple whitespaces', () => {
    const tokens = lexer.tokenizeFormula('=    SUM(A1:A2)').tokens
    const processed = processWhitespaces(tokens)
    expect(processed.length).toBe(6)
    expect(processed[1].leadingWhitespace!!.image).toBe('    ')
  })

  it('should work for whitespace at the beginning', () => {
    const tokens = lexer.tokenizeFormula(' =SUM(A1:A2)').tokens
    const processed = processWhitespaces(tokens)
    expect(processed.length).toBe(6)
    expect(processed[0].leadingWhitespace!!.image).toBe(' ')
  })

  it('should not include whitespaces directly on the list', () => {
    const tokens = lexer.tokenizeFormula('=   SUM   (   A1:A2)   ').tokens
    const processed = processWhitespaces(tokens)
    expect(processed.length).toBe(6)
    expect(processed.map(token => token.tokenType).find(tokenType => tokenType === WhiteSpace)).toBe(undefined)
  })
})
