import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function VARPA', () => {
  it('should take at least one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARPA()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate variance (population)', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARPA(2, 3)'],
      ['=VARPA(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.25)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('should coerce explicit argument to numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARPA(2, 3, 4, TRUE(), FALSE(), "1",)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.95918367346939, 6)
  })

  it('should evaluate TRUE to 1, FALSE to 0 and text to 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARPA(B1:I1)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.24489795918367, 6)
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARPA(B1:I1)', 2, 3, 4, '=NA()', false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
