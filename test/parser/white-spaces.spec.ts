import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB} from '../../src/i18n'
import {buildLexerConfig, FormulaLexer, ParserWithCaching, Unparser} from '../../src/parser'
import {adr} from '../testUtils'


describe('Whitespace tokens', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping(enGB)
  sheetMapping.addSheet('Sheet1')
  const lexer = new FormulaLexer(buildLexerConfig(config))
  const parser = new ParserWithCaching(config, sheetMapping.get)

  it('should ', () => {
    const tokens = lexer.tokenizeFormula("=1 +2")

    console.log(tokens)
  })
})
describe('Keep white spaces', () => {
  it('should ', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse("=1 +2", adr('A1'))

    console.log(parseResult)
  })
})
