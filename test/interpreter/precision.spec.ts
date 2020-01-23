import {Config, HyperFormula} from '../../src'
import '../testConfig'
import {adr} from '../testUtils'

describe('Imprecise comparisons', () => {

  it('less-than', () => {
    const config = new Config({ ignoreEpsilon : false})
    const engine = HyperFormula.buildFromArray([
      ['=1<1.0000000001', '=1<1.0000000000001'],
      ['=1.0000000001<1', '=1.0000000000001<1'],
      ['=-1.0000000001<-1', '=-1.0000000000001<-1'],
      ['=-1<-1.0000000001', '=-1<-1.0000000000001'],
      ['=0<0.0000000001', '=0<0.0000000000001'],
      ['=0.0000000001<0', '=0.0000000000001<0'],
      ['=-0.0000000001<0', '=-0.0000000000001<0'],
      ['=0<-0.0000000001', '=0<-0.0000000000001'],
    ], config)

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
    expect(engine.getCellValue(adr('B2'))).toBe(false)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
    expect(engine.getCellValue(adr('B3'))).toBe(false)
    expect(engine.getCellValue(adr('A4'))).toBe(false)
    expect(engine.getCellValue(adr('B4'))).toBe(false)
    expect(engine.getCellValue(adr('A5'))).toBe(true)
    expect(engine.getCellValue(adr('B5'))).toBe(true)
    expect(engine.getCellValue(adr('A6'))).toBe(false)
    expect(engine.getCellValue(adr('B6'))).toBe(false)
    expect(engine.getCellValue(adr('A7'))).toBe(true)
    expect(engine.getCellValue(adr('B7'))).toBe(true)
    expect(engine.getCellValue(adr('A8'))).toBe(false)
    expect(engine.getCellValue(adr('B8'))).toBe(false)
  })

  it('greater-than', () => {
    const config = new Config({ ignoreEpsilon : false})
    const engine = HyperFormula.buildFromArray([
      ['=1>1.0000000001', '=1>1.0000000000001'],
      ['=1.0000000001>1', '=1.0000000000001>1'],
      ['=-1.0000000001>-1', '=-1.0000000000001>-1'],
      ['=-1>-1.0000000001', '=-1>-1.0000000000001'],
      ['=0>0.0000000001', '=0>0.0000000000001'],
      ['=0.0000000001>0', '=0.0000000000001>0'],
      ['=-0.0000000001>0', '=-0.0000000000001>0'],
      ['=0>-0.0000000001', '=0>-0.0000000000001'],
    ], config)

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('B2'))).toBe(false)
    expect(engine.getCellValue(adr('A3'))).toBe(false)
    expect(engine.getCellValue(adr('B3'))).toBe(false)
    expect(engine.getCellValue(adr('A4'))).toBe(true)
    expect(engine.getCellValue(adr('B4'))).toBe(false)
    expect(engine.getCellValue(adr('A5'))).toBe(false)
    expect(engine.getCellValue(adr('B5'))).toBe(false)
    expect(engine.getCellValue(adr('A6'))).toBe(true)
    expect(engine.getCellValue(adr('B6'))).toBe(true)
    expect(engine.getCellValue(adr('A7'))).toBe(false)
    expect(engine.getCellValue(adr('B7'))).toBe(false)
    expect(engine.getCellValue(adr('A8'))).toBe(true)
    expect(engine.getCellValue(adr('B8'))).toBe(true)
  })

  it('greater-equal', () => {
    const config = new Config({ ignoreEpsilon : false})
    const engine = HyperFormula.buildFromArray([
      ['=1>=1.0000000001', '=1>=1.0000000000001'],
      ['=1.0000000001>=1', '=1.0000000000001>=1'],
      ['=-1.0000000001>=-1', '=-1.0000000000001>=-1'],
      ['=-1>=-1.0000000001', '=-1>=-1.0000000000001'],
      ['=0>=0.0000000001', '=0>=0.0000000000001'],
      ['=0.0000000001>=0', '=0.0000000000001>=0'],
      ['=-0.0000000001>=0', '=-0.0000000000001>=0'],
      ['=0>=-0.0000000001', '=0>=-0.0000000000001'],
    ], config)

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('B2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(false)
    expect(engine.getCellValue(adr('B3'))).toBe(true)
    expect(engine.getCellValue(adr('A4'))).toBe(true)
    expect(engine.getCellValue(adr('B4'))).toBe(true)
    expect(engine.getCellValue(adr('A5'))).toBe(false)
    expect(engine.getCellValue(adr('B5'))).toBe(false)
    expect(engine.getCellValue(adr('A6'))).toBe(true)
    expect(engine.getCellValue(adr('B6'))).toBe(true)
    expect(engine.getCellValue(adr('A7'))).toBe(false)
    expect(engine.getCellValue(adr('B7'))).toBe(false)
    expect(engine.getCellValue(adr('A8'))).toBe(true)
    expect(engine.getCellValue(adr('B8'))).toBe(true)
  })

  it('less-equal', () => {
    const config = new Config({ ignoreEpsilon : false})
    const engine = HyperFormula.buildFromArray([
      ['=1<=1.0000000001', '=1<=1.0000000000001'],
      ['=1.0000000001<=1', '=1.0000000000001<=1'],
      ['=-1.0000000001<=-1', '=-1.0000000000001<=-1'],
      ['=-1<=-1.0000000001', '=-1<=-1.0000000000001'],
      ['=0<=0.0000000001', '=0<=0.0000000000001'],
      ['=0.0000000001<=0', '=0.0000000000001<=0'],
      ['=-0.0000000001<=0', '=-0.0000000000001<=0'],
      ['=0<=-0.0000000001', '=0<=-0.0000000000001'],
    ], config)

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
    expect(engine.getCellValue(adr('B2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
    expect(engine.getCellValue(adr('B3'))).toBe(true)
    expect(engine.getCellValue(adr('A4'))).toBe(false)
    expect(engine.getCellValue(adr('B4'))).toBe(true)
    expect(engine.getCellValue(adr('A5'))).toBe(true)
    expect(engine.getCellValue(adr('B5'))).toBe(true)
    expect(engine.getCellValue(adr('A6'))).toBe(false)
    expect(engine.getCellValue(adr('B6'))).toBe(false)
    expect(engine.getCellValue(adr('A7'))).toBe(true)
    expect(engine.getCellValue(adr('B7'))).toBe(true)
    expect(engine.getCellValue(adr('A8'))).toBe(false)
    expect(engine.getCellValue(adr('B8'))).toBe(false)
  })
})


describe('Snap to zero', () => {

  it('minus', () => {
    const config = new Config({ignoreEpsilon: false})
    const engine = HyperFormula.buildFromArray([
      ['=1-1.0000000001', '=1-1.0000000000001'],
      ['=1.0000000001-1', '=1.0000000000001-1'],
      ['=-1.0000000001--1', '=-1.0000000000001--1'],
      ['=-1--1.0000000001', '=-1--1.0000000000001'],
      ['=0-0.0000000001', '=0-0.0000000000001'],
      ['=0.0000000001-0', '=0.0000000000001-0'],
      ['=-0.0000000001-0', '=-0.0000000000001-0'],
      ['=0--0.0000000001', '=0--0.0000000000001'],
    ], config)

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B5'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B7'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B8'))).toBeCloseTo(0.0000000000001, 5)
  })

  it('plus', () => {
    const config = new Config({ignoreEpsilon: false})
    const engine = HyperFormula.buildFromArray([
      ['=1+-1.0000000001', '=1+-1.0000000000001'],
      ['=1.0000000001+-1', '=1.0000000000001+-1'],
      ['=-1.0000000001+1', '=-1.0000000000001+1'],
      ['=-1+1.0000000001', '=-1+1.0000000000001'],
      ['=0+-0.0000000001', '=0+-0.0000000000001'],
      ['=0.0000000001+-0', '=0.0000000000001+-0'],
      ['=-0.0000000001+-0', '=-0.0000000000001+-0'],
      ['=0+0.0000000001', '=0+0.0000000000001'],
    ], config)

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B5'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B7'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.getCellValue(adr('B8'))).toBeCloseTo(0.0000000000001, 5)
  })
})

