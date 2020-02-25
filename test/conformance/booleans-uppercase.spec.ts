import { Config, HyperFormula } from '../../src'
import '../testConfig'
import { adr } from '../testUtils'

function createEngine(sheetData: any[][], config?: Config) {
  const engine = HyperFormula.buildFromArray(sheetData, config)

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress))
    },
    getCellFormula(cellAddress: string) {
      return engine.getCellFormula(adr(cellAddress))
    },
  }
}

xdescribe('Conversion to logical', () => {
  it('simple TRUE() should return TRUE', () => {
    const engine = createEngine([
      ['=TRUE()'],
    ])
    expect(engine.getCellValue('A1')).toBe('TRUE')
  })

  it('simple FALSE() should return FALSE', () => {
    const engine = createEngine([
      ['=FALSE()']
    ])
    expect(engine.getCellValue('A1')).toBe('FALSE')
  })

  it('string concat with logical function TRUE', () => {
    const engine = createEngine([
      ['="foo"&TRUE()']
    ])
    expect(engine.getCellValue('A1')).toBe('fooTRUE')
  })

  it('string concat with logical function FALSE', () => {
    const engine = createEngine([
      ['="foo"&TRUE()']

    ])
    expect(engine.getCellValue('A2')).toBe('fooTRUE')
  })

  it('string concat with logical function FALSE', () => {
    const engine = createEngine([
      ['=FALSE()'],
      ['="foo"&A1'],
    ])
    expect(engine.getCellValue('A2')).toBe('fooFALSE')
  })



})
