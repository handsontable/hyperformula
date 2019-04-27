import { CellAddress, simpleCellAddress } from '../src/Cell'
import { Config } from '../src/Config'
import { FormulaLexer } from '../src/parser/FormulaParser'
import { buildLexerConfig } from '../src/parser/LexerConfig'
import { ParserWithCaching } from '../src/parser/ParserWithCaching'
import { SheetMapping } from '../src/SheetMapping'

describe('computeHash', () => {
  const computeFunc = (code: string, address: CellAddress): string => {
    const config = new Config()
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(config, sheetMapping)
    const tokens = new FormulaLexer(buildLexerConfig(config)).tokenizeFormula(code).tokens
    return parser.computeHash(tokens, address)
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
    const code = '=$Sheet2.A5'

    expect(computeFunc(code, CellAddress.absolute(0, 1, 1))).toEqual('=#1#3R-1')
  })
})
