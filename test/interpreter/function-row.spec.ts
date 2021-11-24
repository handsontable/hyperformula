import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ROW', () => {
  it('should take one or zero arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ROW(B1, B2)'],
      ['=ROW(B1, B2, B3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should take only reference', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ROW(42)'],
      ['=ROW("foo")'],
      ['=ROW(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
  })

  it('should propagate errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ROW(1/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return row of a reference', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ROW(B1)'],
      ['=ROW(B7)'],
      ['=ROW(F$5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(7)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
  })

  it('should work for itself', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ROW(A1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should return row of a cell in which formula is', async() => {
const engine = await HyperFormula.buildFromArray([
      [null, '=ROW()'],
      ['=ROW()'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
  })

  it('should return row of range start', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ROW(A3:A4)'],
      ['=ROW(B1:B2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
  })

  it('should be dependent on sheet structure changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['=ROW(A1)']
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(1)

    await engine.addRows(0, [0, 1])

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })
})
