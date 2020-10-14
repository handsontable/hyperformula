import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEVPA', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate standard deviation (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA(2, 3)'],
      ['=STDEVPA(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('should coerce explicit argument to numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA(2, 3, 4, TRUE(), FALSE(), "1",)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.39970842444753, 6)
  })

  it('should ignore non-numeric values in ranges', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA(B1:I1)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.49829835452879, 6)
  })

  it('should propagate errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA(B1:I1)', 2, 3, 4, '=NA()', false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
