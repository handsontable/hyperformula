import {HyperFormula} from '../../src'
import '../testConfig'
import {adr} from '../testUtils'

describe('Imprecise comparisons', () => {

  it('less-than', () => {
    const chunk1 = '.0000000001'
    const chunk2 = '.00000000000005'
    const engine = HyperFormula.buildFromArray([
      ['=1<1'+chunk1, '=1<1'+chunk2],
      ['=1'+chunk1+'<1', '=1'+chunk2+'<1'],
      ['=-1'+chunk1+'<-1', '=-1'+chunk2+'<-1'],
      ['=-1<-1'+chunk1, '=-1<-1'+chunk2],
      ['=0<0'+chunk1, '=0<0'+chunk2],
      ['=0'+chunk1+'<0', '=0'+chunk2+'<0'],
      ['=-0'+chunk1+'<0', '=-0'+chunk2+'<0'],
      ['=0<-0'+chunk1, '=0<-0'+chunk2],
    ], { smartRounding : true})

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
    const chunk1 = '.0000000001'
    const chunk2 = '.0000000000001'
    const engine = HyperFormula.buildFromArray([
      ['=1>1'+chunk1, '=1>1'+chunk2],
      ['=1'+chunk1+'>1', '=1'+chunk2+'>1'],
      ['=-1'+chunk1+'>-1', '=-1'+chunk2+'>-1'],
      ['=-1>-1'+chunk1, '=-1>-1'+chunk2],
      ['=0>0'+chunk1, '=0>0'+chunk2],
      ['=0'+chunk1+'>0', '=0'+chunk2+'>0'],
      ['=-0'+chunk1+'>0', '=-0'+chunk2+'>0'],
      ['=0>-0'+chunk1, '=0>-0'+chunk2],
    ], { smartRounding : true})

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
    const chunk1 = '.0000000001'
    const chunk2 = '.0000000000001'
    const engine = HyperFormula.buildFromArray([
      ['=1>=1'+chunk1, '=1>=1'+chunk2],
      ['=1'+chunk1+'>=1', '=1'+chunk2+'>=1'],
      ['=-1'+chunk1+'>=-1', '=-1'+chunk2+'>=-1'],
      ['=-1>=-1'+chunk1, '=-1>=-1'+chunk2],
      ['=0>=0'+chunk1, '=0>=0'+chunk2],
      ['=0'+chunk1+'>=0', '=0'+chunk2+'>=0'],
      ['=-0'+chunk1+'>=0', '=-0'+chunk2+'>=0'],
      ['=0>=-0'+chunk1, '=0>=-0'+chunk2],
    ], { smartRounding : true})

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
    const chunk1 = '.0000000001'
    const chunk2 = '.0000000000001'
    const engine = HyperFormula.buildFromArray([
      ['=1<=1'+chunk1, '=1<=1'+chunk2],
      ['=1'+chunk1+'<=1', '=1'+chunk2+'<=1'],
      ['=-1'+chunk1+'<=-1', '=-1'+chunk2+'<=-1'],
      ['=-1<=-1'+chunk1, '=-1<=-1'+chunk2],
      ['=0<=0'+chunk1, '=0<=0'+chunk2],
      ['=0'+chunk1+'<=0', '=0'+chunk2+'<=0'],
      ['=-0'+chunk1+'<=0', '=-0'+chunk2+'<=0'],
      ['=0<=-0'+chunk1, '=0<=-0'+chunk2],
    ], { smartRounding : true})

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
    const chunk1 = '.0000000001'
    const chunk2 = '.0000000000001'
    const engine = HyperFormula.buildFromArray([
      ['=1-1'+chunk1, '=1-1'+chunk2],
      ['=1'+chunk1+'-1', '=1'+chunk2+'-1'],
      ['=-1'+chunk1+'--1', '=-1'+chunk2+'--1'],
      ['=-1--1'+chunk1, '=-1--1'+chunk2],
      ['=0-0'+chunk1, '=0-0'+chunk2],
      ['=0'+chunk1+'-0', '=0'+chunk2+'-0'],
      ['=-0'+chunk1+'-0', '=-0'+chunk2+'-0'],
      ['=0--0'+chunk1, '=0--0'+chunk2],
    ], { smartRounding : true})

    expect(engine.dependencyGraph.getCellValue(adr('A1'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A2'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B2'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A3'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A4'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B4'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A5'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B5'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('A6'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B6'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('A7'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B7'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('A8'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B8'))).toBeCloseTo(0.0000000000001, 5)
  })

  it('plus', () => {
    const chunk1 = '.0000000001'
    const chunk2 = '.0000000000001'
    const engine = HyperFormula.buildFromArray([
      ['=1+-1'+chunk1, '=1+-1'+chunk2],
      ['=1'+chunk1+'+-1', '=1'+chunk2+'+-1'],
      ['=-1'+chunk1+'+1', '=-1'+chunk2+'+1'],
      ['=-1+1'+chunk1, '=-1+1'+chunk2],
      ['=0+-0'+chunk1, '=0+-0'+chunk2],
      ['=0'+chunk1+'+-0', '=0'+chunk2+'+-0'],
      ['=-0'+chunk1+'+-0', '=-0'+chunk2+'+-0'],
      ['=0+0'+chunk1, '=0+0'+chunk2],
    ], { smartRounding : true})

    expect(engine.dependencyGraph.getCellValue(adr('A1'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A2'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B2'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A3'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A4'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B4'))).toEqual(0)
    expect(engine.dependencyGraph.getCellValue(adr('A5'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B5'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('A6'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B6'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('A7'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B7'))).toBeCloseTo(0.0000000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('A8'))).toBeCloseTo(0.0000000001, 5)
    expect(engine.dependencyGraph.getCellValue(adr('B8'))).toBeCloseTo(0.0000000000001, 5)
  })
})

describe( 'Value-fixed', () => {
  it('should correctly calculate 0.2 + 0.1 as 0.3', () => {
    const engine = HyperFormula.buildFromArray([
      ['=0.2+0.1'],
    ], { smartRounding : true})

    expect(engine.getCellValue(adr('A1'))).toBe(0.3)
  })
})
