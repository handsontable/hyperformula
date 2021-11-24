import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function VAR.P', () => {
  it('should take at least one argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=VAR.P()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate variance (population)', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=VAR.P(2, 3)'],
      ['=VAR.P(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.25)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('should coerce explicit argument to numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=VAR.P(2, 3, 4, TRUE(), FALSE(), "1",)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.95918367346939, 6) //inconsistency with product #1
  })

  it('should ignore non-numeric values in ranges, including ignoring logical values and text representation of numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=VAR.P(B1:I1)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.666666666666667, 6)
  })

  it('should propagate errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=VAR.P(B1:I1)', 2, 3, 4, '=NA()', false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
