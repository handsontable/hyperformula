import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB, plPL, TranslationPackage} from '../../src/i18n'
import {buildLexerConfig, FormulaLexer, ParserWithCaching} from '../../src/parser'
import {CellAddress} from '../../src/parser'

describe('computeHashFromTokens', () => {
  const computeFunc = (code: string, address: CellAddress, language: TranslationPackage = enGB): string => {
    const config = new Config({ language})
    const sheetMapping = new SheetMapping(language)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(config, sheetMapping.get)
    const tokens = new FormulaLexer(buildLexerConfig(config)).tokenizeFormula(code).tokens
    return parser.computeHashFromTokens(tokens, address)
  }

  it('simple case', () => {
    const code = '=42'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=42')
  })

  it('cell relative reference', () => {
    const code = '=A5'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#0#3R-1')
  })

  it('cell absolute reference', () => {
    const code = '=$A$5'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#0#4A0')
  })

  it('cell absolute col reference', () => {
    const code = '=$A5'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#0#3AC0')
  })

  it('cell absolute row reference', () => {
    const code = '=A$5'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#0#4AR-1')
  })

  it('more addresses', () => {
    const code = '=A5+A7'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#0#3R-1+#0#5R-1')
  })

  it('cell ref in string', () => {
    const code = '="A5"'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('="A5"')
  })

  it('cell ref between strings', () => {
    const code = '="A5"+A4+"A6"'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('="A5"+#0#2R-1+"A6"')
  })

  it('cell ref in string with escape', () => {
    const code = '="fdsaf\\"A5"'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('="fdsaf\\"A5"')
  })

  it('cell range', () => {
    const code = '=A5:B16'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#0#3R-1:#0#14R0')
  })

  it('ignores whitespace', () => {
    const code = '= 42'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=42')
  })

  it('same hash for formulas with different namespace', () => {
    const code1 = '= 42 '
    const code2 = '   =42'

    const result1 = computeFunc(code1, CellAddress.absolute(0, 1, 1))
    const result2 = computeFunc(code2, CellAddress.absolute(0, 1, 1))
    expect(result1).toEqual(result2)
  })

  it('support sheets', () => {
    const code = '=Sheet2!A5'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#1#3R-1')
  })

  it('function call names are normalized', () => {
    const code = '=rAnd()'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=RAND()')
  })

  it('function call in canonical form', () => {
    const code = '=SUMA()'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1), plPL)).toEqual('=SUM()')
  })

  it('function call when missing translation', () => {
    const code = '=fooBAR()'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1), plPL)).toEqual('=FOOBAR()')
  })
})
