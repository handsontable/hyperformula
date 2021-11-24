import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SUBTOTAL', () => {
  it('should calculate AVERAGE', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(1, A2:A4, A5)', '=SUBTOTAL(101, A2:A4, A5)'],
      [2],
      [3],
      [4],
      [5]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3.5)
    expect(engine.getCellValue(adr('B1'))).toEqual(3.5)
  })

  it('should calculate COUNT', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(2, A2:A4, A5)', '=SUBTOTAL(102, A2:A4, A5)'],
      [2],
      ['foo'],
      [4],
      [5]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })


  it('should calculate COUNTA', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(3, A2:A4, A5)', '=SUBTOTAL(103, A2:A4, A5)'],
      [2],
      ['foo'],
      [4],
      [5]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
  })

  it('should calcuate MAX', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(4, A2:A4, A5)', '=SUBTOTAL(104, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(5)
    expect(engine.getCellValue(adr('B1'))).toEqual(5)
  })

  it('should calculate MIN', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(5, A2:A4, A5)', '=SUBTOTAL(105, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('should calculate PRODUCT', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(6, A2:A4, A5)', '=SUBTOTAL(106, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(120)
    expect(engine.getCellValue(adr('B1'))).toEqual(120)
  })

  it('should calculate STDEV.S', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(7, A2:A4, A5)', '=SUBTOTAL(107, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.29099444873581, 6)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.29099444873581, 6)
  })

  it('should calculate STDEV.P', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(8, A2:A4, A5)', '=SUBTOTAL(108, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.11803398875, 6)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.11803398875, 6)
  })

  it('should calculate SUM', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(9, A2:A4, A5)', '=SUBTOTAL(109, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(14)
    expect(engine.getCellValue(adr('B1'))).toEqual(14)
  })

  it('should calculate VAR.S', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(10, A2:A4, A5)', '=SUBTOTAL(110, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(5/3, 6)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(5/3, 6)
  })

  it('should calculate VAR.P', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(11, A2:A4, A5)', '=SUBTOTAL(111, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(5/4)
    expect(engine.getCellValue(adr('B1'))).toEqual(5/4)
  })

  it('should return correct error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUBTOTAL(12345, A2:A4, A5)'],
      [3],
      [5],
      [2],
      [4]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
  })

  /**
   * Inconsistency with ODFF standard.
   */
  it('does not ignore other SUBTOTALS', async() => {
const engine = await HyperFormula.buildFromArray( [
      ['=SUBTOTAL(9, A2:A4)'],
      ['=SUBTOTAL(9, B2:C2)', 1, 1],
      ['=SUBTOTAL(9, B3:C3)', 1, 1],
      ['=SUBTOTAL(9, B4:C4)', 1, 1],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(6)
  })
})
