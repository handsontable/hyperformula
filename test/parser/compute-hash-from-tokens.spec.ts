import {HyperFormula} from '../../src'
import {simpleCellAddress, SimpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB, plPL} from '../../src/i18n/languages'
import {buildLexerConfig, FormulaLexer} from '../../src/parser'
import {unregisterAllLanguages} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('computeHashFromTokens', () => {
  const computeFunc = (code: string, address: SimpleCellAddress, language: string = 'enGB'): string => {
    const config = new Config({language})
    const sheetMapping = new SheetMapping(HyperFormula.getLanguage(language))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(config, sheetMapping)
    const tokens = new FormulaLexer(buildLexerConfig(config)).tokenizeFormula(code).tokens
    return parser.computeHashFromTokens(tokens, address)
  }
  beforeEach(() => {
    unregisterAllLanguages()
    HyperFormula.registerLanguage(plPL.langCode, plPL)
    HyperFormula.registerLanguage(enGB.langCode, enGB)
  })

  it('simple case', () => {
    const code = '=42'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=42')
  })

  it('cell relative reference', () => {
    const code = '=A5'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#3R-1')
  })

  it('cell absolute reference', () => {
    const code = '=$A$5'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#4A0')
  })

  it('cell absolute col reference', () => {
    const code = '=$A5'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#3AC0')
  })

  it('cell absolute row reference', () => {
    const code = '=A$5'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#4AR-1')
  })

  it('more addresses', () => {
    const code = '=A5+A7'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#3R-1+#5R-1')
  })

  it('cell ref in string', () => {
    const code = '="A5"'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('="A5"')
  })

  it('cell ref between strings', () => {
    const code = '="A5"+A4+"A6"'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('="A5"+#2R-1+"A6"')
  })

  it('cell ref in string with escape', () => {
    const code = '="fdsaf\\"A5"'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('="fdsaf\\"A5"')
  })

  it('cell ref to not exsiting sheet', () => {
    const code = '=Sheet3!A1'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=Sheet3!A1')
  })

  it('cell range', () => {
    const code = '=A5:B16'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#3R-1:#14R0')
  })

  it('cell range with sheet on the left', () => {
    const code = '=Sheet1!A5:B16'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#0#3R-1:#14R0')
  })

  it('cell range with sheet on both sides', () => {
    const code = '=Sheet1!A5:Sheet2!B16'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#0#3R-1:#1#14R0')
  })

  it('column range', () => {
    const code = '=A:$B'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#COLR-1:#COLA1')
  })

  it('column range with sheet on the left', () => {
    const code = '=Sheet1!A:B'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#0#COLR-1:#COLR0')
  })

  it('column range with sheet on both sides', () => {
    const code = '=Sheet1!A:Sheet2!B'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#0#COLR-1:#1#COLR0')
  })

  it('row range', () => {
    const code = '=1:$2'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#ROWR-1:#ROWA1')
  })

  it('row range with sheet on the left', () => {
    const code = '=Sheet1!1:2'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#0#ROWR-1:#ROWR0')
  })

  it('row range with sheet on both sides', () => {
    const code = '=Sheet1!1:Sheet2!2'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#0#ROWR-1:#1#ROWR0')
  })

  it('do not ignores whitespace', () => {
    const code = '= 42'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('= 42')
  })

  it('different hash for formulas with different namespace', () => {
    const code1 = '= 42 '
    const code2 = '=42'

    const result1 = computeFunc(code1, simpleCellAddress(0, 1, 1))
    const result2 = computeFunc(code2, simpleCellAddress(0, 1, 1))
    expect(result1).not.toEqual(result2)
  })

  it('support sheets', () => {
    const code = '=Sheet2!A5'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=#1#3R-1')
  })

  it('function call names are normalized', () => {
    const code = '=rAnd()'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1))).toEqual('=RAND()')
  })

  it('function call in canonical form', () => {
    const code = '=SUMA()'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1), 'plPL')).toEqual('=SUM()')
  })

  it('function call when missing translation', () => {
    const code = '=fooBAR()'

    expect(computeFunc(code, simpleCellAddress(0, 1, 1), 'plPL')).toEqual('=FOOBAR()')
  })

  it('should work with whitespaces', () => {
    const formula = '= - 1 + 2 / 3 - 4 % * (1 + 2 ) + SUM( Sheet1!A1, A1:A2 )'
    const hash = computeFunc(formula, simpleCellAddress(0, 0, 0))
    expect(hash).toEqual('= - 1 + 2 / 3 - 4 % * (1 + 2 ) + SUM( #0#0R0, #0R0:#1R0 )')
  })

  it('should skip whitespaces inside range ', () => {
    const formula = '=SUM( A1 : A2 )'
    const hash = computeFunc(formula, simpleCellAddress(0, 0, 0))
    expect(hash).toEqual('=SUM( #0R0:#1R0 )')
  })

  it('should skip trailing whitespace', () => {
    const formula = '=1 '
    const hash = computeFunc(formula, simpleCellAddress(0, 0, 0))
    expect(hash).toEqual('=1')
  })

  it('should skip whitespaces before function args separators', () => {
    const formula = '=SUM(A1 , A2)'
    const hash = computeFunc(formula, simpleCellAddress(0, 0, 0))
    expect(hash).toEqual('=SUM(#0R0, #1R0)')
  })

  it('should not skip whitespaces when there is empty arg', () => {
    const formula = '=PV(A1 ,2,3,   ,A2)'
    const hash = computeFunc(formula, simpleCellAddress(0, 0, 0))
    expect(hash).toEqual('=PV(#0R0,2,3,   ,#1R0)')
  })
})
