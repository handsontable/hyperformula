import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('Imprecise comparisons', () => {

  it('less-than', () => {
    const chunk1 = '.0000000001'
    const chunk2 = '.00000000000005'
    const [engine] = HyperFormula.buildFromArray([
      ['=1<1' + chunk1, '=1<1' + chunk2],
      ['=1' + chunk1 + '<1', '=1' + chunk2 + '<1'],
      ['=-1' + chunk1 + '<-1', '=-1' + chunk2 + '<-1'],
      ['=-1<-1' + chunk1, '=-1<-1' + chunk2],
      ['=0<0' + chunk1, '=0<0' + chunk2],
      ['=0' + chunk1 + '<0', '=0' + chunk2 + '<0'],
      ['=-0' + chunk1 + '<0', '=-0' + chunk2 + '<0'],
      ['=0<-0' + chunk1, '=0<-0' + chunk2],
    ], {smartRounding: true})

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
    const [engine] = HyperFormula.buildFromArray([
      ['=1>1' + chunk1, '=1>1' + chunk2],
      ['=1' + chunk1 + '>1', '=1' + chunk2 + '>1'],
      ['=-1' + chunk1 + '>-1', '=-1' + chunk2 + '>-1'],
      ['=-1>-1' + chunk1, '=-1>-1' + chunk2],
      ['=0>0' + chunk1, '=0>0' + chunk2],
      ['=0' + chunk1 + '>0', '=0' + chunk2 + '>0'],
      ['=-0' + chunk1 + '>0', '=-0' + chunk2 + '>0'],
      ['=0>-0' + chunk1, '=0>-0' + chunk2],
    ], {smartRounding: true})

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
    const [engine] = HyperFormula.buildFromArray([
      ['=1>=1' + chunk1, '=1>=1' + chunk2],
      ['=1' + chunk1 + '>=1', '=1' + chunk2 + '>=1'],
      ['=-1' + chunk1 + '>=-1', '=-1' + chunk2 + '>=-1'],
      ['=-1>=-1' + chunk1, '=-1>=-1' + chunk2],
      ['=0>=0' + chunk1, '=0>=0' + chunk2],
      ['=0' + chunk1 + '>=0', '=0' + chunk2 + '>=0'],
      ['=-0' + chunk1 + '>=0', '=-0' + chunk2 + '>=0'],
      ['=0>=-0' + chunk1, '=0>=-0' + chunk2],
    ], {smartRounding: true})

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
    const [engine] = HyperFormula.buildFromArray([
      ['=1<=1' + chunk1, '=1<=1' + chunk2],
      ['=1' + chunk1 + '<=1', '=1' + chunk2 + '<=1'],
      ['=-1' + chunk1 + '<=-1', '=-1' + chunk2 + '<=-1'],
      ['=-1<=-1' + chunk1, '=-1<=-1' + chunk2],
      ['=0<=0' + chunk1, '=0<=0' + chunk2],
      ['=0' + chunk1 + '<=0', '=0' + chunk2 + '<=0'],
      ['=-0' + chunk1 + '<=0', '=-0' + chunk2 + '<=0'],
      ['=0<=-0' + chunk1, '=0<=-0' + chunk2],
    ], {smartRounding: true})

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
    const [engine] = HyperFormula.buildFromArray([
      ['=1-1' + chunk1, '=1-1' + chunk2],
      ['=1' + chunk1 + '-1', '=1' + chunk2 + '-1'],
      ['=-1' + chunk1 + '--1', '=-1' + chunk2 + '--1'],
      ['=-1--1' + chunk1, '=-1--1' + chunk2],
      ['=0-0' + chunk1, '=0-0' + chunk2],
      ['=0' + chunk1 + '-0', '=0' + chunk2 + '-0'],
      ['=-0' + chunk1 + '-0', '=-0' + chunk2 + '-0'],
      ['=0--0' + chunk1, '=0--0' + chunk2],
    ], {smartRounding: true})

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
    const [engine] = HyperFormula.buildFromArray([
      ['=1+-1' + chunk1, '=1+-1' + chunk2],
      ['=1' + chunk1 + '+-1', '=1' + chunk2 + '+-1'],
      ['=-1' + chunk1 + '+1', '=-1' + chunk2 + '+1'],
      ['=-1+1' + chunk1, '=-1+1' + chunk2],
      ['=0+-0' + chunk1, '=0+-0' + chunk2],
      ['=0' + chunk1 + '+-0', '=0' + chunk2 + '+-0'],
      ['=-0' + chunk1 + '+-0', '=-0' + chunk2 + '+-0'],
      ['=0+0' + chunk1, '=0+0' + chunk2],
    ], {smartRounding: true})

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

describe('Value-fixed', () => {
  it('should correctly calculate 0.2 + 0.1 as 0.3', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=0.2+0.1'],
    ], {smartRounding: true})

    expect(engine.getCellValue(adr('A1'))).toBe(0.3)
  })
})

describe('tests', () => {
  it('addition of small numbers with smartRounding #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], {smartRounding: true})

    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123456789)
  })

  it('addition of small numbers with smartRounding #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0.000123456789', '1', '=A1+B1'],
    ], {smartRounding: true, precisionRounding: 9})

    expect(engine.getCellValue(adr('C1'))).toEqual(1.000123457) //as GS and E
  })
})

describe('internal rounding', () => {
  it('Precision accumulates', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['', 'Revenue', '', '1000', '=D1*(1+E2)', '=E1*(1+F2)', '=F1*(1+G2)', '=G1*(1+H2)', '=H1*(1+I2)', '=I1*(1+J2)', '=J1*(1+K2)', '=K1*(1+L2)', '=L1*(1+M2)', '=M1*(1+N2)'],
      ['', '% Growth', '', '', '.100000000000000', '=E2', '=F2', '=G2', '=H2', '=I2', '=J2', '=K2', '=L2', '=M2']
    ])
    expect(engine.getSheetValues(0)).toEqual([
      ['', 'Revenue', '', 1000.000000000000000, 1100.000000000000000, 1210.000000000000000, 1331.000000000000000, 1464.100000000000000, 1610.510000000000000, 1771.561000000000000, 1948.717100000000000, 2143.588810000000000, 2357.947691000000000, 2593.742460100000000],
      ['', '% Growth', '', '', .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000, .100000000000000]
    ])
  })
})

describe('number of leading digits', () => {
  it('rounding extensive test', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '0.33333333333333300000', '=A1/3'],
      ['10', '3.33333333333333000000', '=A2/3'],
      ['100', '33.33333333333330000000', '=A3/3'],
      ['1000', '333.33333333333300000000', '=A4/3'],
      ['10000', '3333.33333333333000000000', '=A5/3'],
      ['100000', '33333.33333333330000000000', '=A6/3'],
      ['1000000', '333333.33333333300000000000', '=A7/3'],
      ['10000000', '3333333.33333333000000000000', '=A8/3'],
      ['100000000', '33333333.33333330000000000000', '=A9/3'],
      ['1000000000', '333333333.33333300000000000000', '=A10/3'],
      ['10000000000', '3333333333.33333000000000000000', '=A11/3'],
      ['100000000000', '33333333333.33330000000000000000', '=A12/3'],
      ['1000000000000', '333333333333.33300000000000000000', '=A13/3'],
      ['10000000000000', '3333333333333.33000000000000000000', '=A14/3'],
      ['100000000000000', '33333333333333.30000000000000000000', '=A15/3'],
      ['1000000000000000', '333333333333333.00000000000000000000', '=A16/3'],
      ['10000000000000000', '3333333333333330.00000000000000000000', '=A17/3'],
      ['100000000000000000', '33333333333333300.00000000000000000000', '=A18/3'],
      ['1000000000000000000', '333333333333333000.00000000000000000000', '=A19/3'],
      ['10000000000000000000', '3333333333333330000.00000000000000000000', '=A20/3'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(engine.getCellValue(adr('B1')))
    expect(engine.getCellValue(adr('C2'))).toEqual(engine.getCellValue(adr('B2')))
    expect(engine.getCellValue(adr('C3'))).toEqual(engine.getCellValue(adr('B3')))
    expect(engine.getCellValue(adr('C4'))).toEqual(engine.getCellValue(adr('B4')))
    expect(engine.getCellValue(adr('C5'))).toEqual(engine.getCellValue(adr('B5')))
    expect(engine.getCellValue(adr('C6'))).toEqual(engine.getCellValue(adr('B6')))
    expect(engine.getCellValue(adr('C7'))).toEqual(engine.getCellValue(adr('B7')))
    expect(engine.getCellValue(adr('C8'))).toEqual(engine.getCellValue(adr('B8')))
    expect(engine.getCellValue(adr('C9'))).toEqual(engine.getCellValue(adr('B9')))
    expect(engine.getCellValue(adr('C10'))).toEqual(engine.getCellValue(adr('B10')))
    expect(engine.getCellValue(adr('C11'))).toEqual(engine.getCellValue(adr('B11')))
    expect(engine.getCellValue(adr('C12'))).toEqual(engine.getCellValue(adr('B12')))
    expect(engine.getCellValue(adr('C13'))).toEqual(engine.getCellValue(adr('B13')))
    expect(engine.getCellValue(adr('C14'))).toEqual(engine.getCellValue(adr('B14')))
    expect(engine.getCellValue(adr('C15'))).toEqual(engine.getCellValue(adr('B15')))
    expect(engine.getCellValue(adr('C16'))).toEqual(engine.getCellValue(adr('B16')))
    expect(engine.getCellValue(adr('C17'))).toEqual(engine.getCellValue(adr('B17')))
    expect(engine.getCellValue(adr('C18'))).toEqual(engine.getCellValue(adr('B18')))
    expect(engine.getCellValue(adr('C19'))).toEqual(engine.getCellValue(adr('B19')))
    expect(engine.getCellValue(adr('C20'))).toEqual(engine.getCellValue(adr('B20')))
  })
})
