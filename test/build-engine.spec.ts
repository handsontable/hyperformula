import {HyperFormula} from '../src'
import {plPL} from '../src/i18n'
import {adr} from './testUtils'

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('accepts config params', () => {
    const config = {dateFormats: ['MM']}
    const engine = HyperFormula.buildEmpty(config)
    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })
})

describe('Building engine from arrays', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('#buildFromSheet adds default sheet Sheet1', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.getAllSheetsDimensions()).toEqual({'Sheet1': {'height': 0, 'width': 0}})
  })

  it('#buildFromSheet adds default sheet Sheet1, in different languages', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    const engine = HyperFormula.buildFromArray([], {language: 'plPL'})

    expect(engine.getAllSheetsDimensions()).toEqual({'Arkusz1': {'height': 0, 'width': 0}})
  })

  it('#buildFromSheets accepts config', () => {
    const config = {dateFormats: ['MM']}
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    }, config)

    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })

  it('#buildFromSheet accepts config', () => {
    const config = {dateFormats: ['MM']}
    const engine = HyperFormula.buildFromArray([], config)

    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })

  it('should allow to create sheets with a delay', () => {
    const engine1 = HyperFormula.buildFromArray([['=Sheet2!A1']])

    engine1.addSheet('Sheet2')
    engine1.setSheetContent('Sheet2', [['1']])
    engine1.rebuildAndRecalculate()

    expect(engine1.getCellValue(adr('A1', 1))).toBe(1)
    expect(engine1.getCellValue(adr('A1', 0))).toBe(1)
  })

  it('corrupted sheet definition', () => {
    expect(() => {
      HyperFormula.buildFromArray([
        [0, 1],
        [2, 3],
        null, // broken sheet
        [6, 7]
      ] as any)
    }).toThrowError('Invalid arguments, expected an array of arrays.')
  })
})
