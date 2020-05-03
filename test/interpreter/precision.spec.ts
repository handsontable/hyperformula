import {HyperFormula} from '../../src'
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

describe( 'tests', () => {
  it('addition of small numbers with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ],  { smartRounding: true })

    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123456789)
  })

  it('addition of small numbers with smartRounding', () => {
    const engine = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], { smartRounding: true, precisionRounding: 9 })

    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123457) //as GS and E
  })
})

describe( 'internal rounding', () => {
  it('Precision accumulates', () => {
    const engine = HyperFormula.buildFromArray([
      ['', 'Revenue', '', '1000', '=D1*(1+E2)', '=E1*(1+F2)', '=F1*(1+G2)', '=G1*(1+H2)', '=H1*(1+I2)', '=I1*(1+J2)', '=J1*(1+K2)', '=K1*(1+L2)', '=L1*(1+M2)', '=M1*(1+N2)'],
      ['', '% Growth', '', '', '.100000000000000', '=E2', '=F2', '=G2', '=H2', '=I2', '=J2', '=K2', '=L2', '=M2']
    ], {
      functionArgSeparator: ',',
      decimalSeparator: '.',
      smartRounding: true,
      // internalRounding: true,
    })
    expect(engine.getSheetValues(0)).toEqual([
      ['', 'Revenue', '', 1000.000000000000000, 1100.000000000000000, 1210.000000000000000, 1331.000000000000000, 1464.100000000000000, 1610.510000000000000, 1771.561000000000000, 1948.717100000000000, 2143.588810000000000, 2357.947691000000000, 2593.742460100000000],
      ['', '% Growth', '', '', .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000]
    ])
  })
})
