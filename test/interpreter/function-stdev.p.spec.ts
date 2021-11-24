import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function STDEV.P', () => {
  it('should take at least one argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STDEV.P()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate standard deviation (population)', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STDEV.P(2, 3)'],
      ['=STDEV.P(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('should coerce explicit argument to numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STDEV.P(2, 3, 4, TRUE(), FALSE(), "1",)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.39970842444753, 6) //inconsistency with product #1
  })

  it('should ignore non-numeric values in ranges, including ignoring logical values and text representation of numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STDEV.P(B1:I1)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.816496580927726, 6)
  })

  it('should propagate errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=STDEV.P(B1:I1)', 2, 3, 4, '=NA()', false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
