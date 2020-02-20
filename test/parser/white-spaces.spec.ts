import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB} from '../../src/i18n'
import {buildLexerConfig, FormulaLexer, ParserWithCaching} from '../../src/parser'
import {WhiteSpace} from '../../src/parser/LexerConfig'
import {processWhitespaces} from '../../src/parser/ParserWithCaching'
import {adr} from '../testUtils'

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
