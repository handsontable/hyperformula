import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('Function SUBTOTAL', () => {
  it('should calculate AVERAGE', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBTOTAL(1, A2:A4, A5)', '=SUBTOTAL(101, A2:A4, A5)'],
      [2],
      [3],
      [4],
      [5]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3.5)
    expect(engine.getCellValue(adr('B1'))).toEqual(3.5)
  })

  it('should calculate COUNT', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBTOTAL(2, A2:A4, A5)', '=SUBTOTAL(102, A2:A4, A5)'],
      [2],
      ['foo'],
      [4],
      [5]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })


  it('should calculate COUNTA', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBTOTAL(3, A2:A4, A5)', '=SUBTOTAL(103, A2:A4, A5)'],
      [2],
      ['foo'],
      [4],
      [5]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
  })

  it('should calcuate MAX', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBTOTAL(4, A2:A4, A5)', '=SUBTOTAL(104, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(5)
    expect(engine.getCellValue(adr('B1'))).toEqual(5)
  })

  it('should calculate MIN', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBTOTAL(5, A2:A4, A5)', '=SUBTOTAL(105, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('should calculate SUM', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUBTOTAL(9, A2:A4, A5)', '=SUBTOTAL(109, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(14)
    expect(engine.getCellValue(adr('B1'))).toEqual(14)
  })
})
