import {HyperFormula} from '../src'
import {plPL} from '../src/i18n/languages'
import {adr} from './testUtils'

describe('Building empty engine', () => {
  it('works', async() => {
const engine = await HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('accepts config params', async() => {
    const config = {dateFormats: ['MM']}
    const engine = await HyperFormula.buildEmpty(config)
    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })
})

describe('Building engine from arrays', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    })

    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('#buildFromSheet adds default sheet Sheet1', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(engine.getAllSheetsDimensions()).toEqual({'Sheet1': {'height': 0, 'width': 0}})
  })

  it('#buildFromSheet adds default sheet Sheet1, in different languages', async() => {
    HyperFormula.registerLanguage('plPL', plPL)
    const engine = await HyperFormula.buildFromArray([], {language: 'plPL'})

    expect(engine.getAllSheetsDimensions()).toEqual({'Arkusz1': {'height': 0, 'width': 0}})
  })

  it('#buildFromSheets accepts config', async() => {
    const config = {dateFormats: ['MM']}
    const engine = await HyperFormula.buildFromSheets({
      Sheet1: [],
      Sheet2: [],
    }, config)

    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })

  it('#buildFromSheet accepts config', async() => {
    const config = {dateFormats: ['MM']}
    const engine = await HyperFormula.buildFromArray([], config)

    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })

  it('should allow to create sheets with a delay', async() => {
    const engine = await HyperFormula.buildFromArray([['=Sheet2!A1']])

    engine.addSheet('Sheet2')
    await engine.setSheetContent(1, [['1']])
    engine.rebuildAndRecalculate()

    expect(engine.getCellValue(adr('A1', 1))).toBe(1)
    expect(engine.getCellValue(adr('A1', 0))).toBe(1)
  })

  it('corrupted sheet definition', () => {
    expect(async() => {
      await HyperFormula.buildFromArray([
        [0, 1],
        [2, 3],
        null, // broken sheet
        [6, 7]
      ] as any)
    }).toThrowError('Invalid arguments, expected an array of arrays.')
  })
})

describe('named expressions', () => {
  it('buildEmpty', async() => {
const engine = await HyperFormula.buildEmpty({}, [{name: 'FALSE', expression: false}])
    engine.addSheet('sheet')
    await engine.setSheetContent(0, [['=FALSE']])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('buildFromArray', async() => {
const engine = await HyperFormula.buildFromArray([['=FALSE']], {}, [{name: 'FALSE', expression: false}])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('buildFromSheets', async() => {
const engine = await HyperFormula.buildFromSheets({sheet: [['=FALSE']]}, {}, [{name: 'FALSE', expression: false}])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('buildFromArray + scope', async() => {
const engine = await HyperFormula.buildFromArray([['=FALSE']], {}, [{name: 'FALSE', expression: false, scope: 0}])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('buildFromSheets + scope', async() => {
const engine = await HyperFormula.buildFromSheets({sheet: [['=FALSE']]}, {}, [{name: 'FALSE', expression: false, scope: 0}])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })
})
