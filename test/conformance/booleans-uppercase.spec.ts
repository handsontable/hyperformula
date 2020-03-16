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

describe('Conversion to logical', () => {
  it('simple TRUE() should return TRUE', () => {
    const engine = createEngine([
      ['=TRUE()']
    ])
    
    expect(engine.getCellValue('A1')).toBe(true)
  })

  it('simple FALSE() should return FALSE', () => {
    const engine = createEngine([
      ['=FALSE()']
    ])
    
    expect(engine.getCellValue('A1')).toBe(false)
  })

  it('simple TRUE() should return TRUE with caseSensetive', () => {
    const engine = createEngine([
      ['=TRUE()']],
    new Config({ caseSensitive: true }))
    
    expect(engine.getCellValue('A1')).toBe(true)
  })

  it('simple FALSE() should return FALSE with caseSensetive', () => {
    const engine = createEngine([
      ['=FALSE()']],
    new Config({ caseSensitive: true }))
    
    expect(engine.getCellValue('A1')).toBe(false)
  })

  it('string concat with logical function TRUE', () => {
    const engine = createEngine([
      ['="foo"&TRUE()']
    ])
    expect(engine.getCellValue('A1')).toBe('footrue')
  })

  xit('string concat with logical function FALSE', () => {
    const engine = createEngine([
      ['="foo"&FALSE()']

    ])
    expect(engine.getCellValue('A2')).toBe('foofalse') //return Symbol()
  })

  it('string concat with logical function FALSE', () => {
    const engine = createEngine([
      ['=FALSE()'],
      ['="foo"&A1'],
    ])
    expect(engine.getCellValue('A2')).toBe('foofalse')
  })



})
