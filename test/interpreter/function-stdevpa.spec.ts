import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEVPA', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate standard deviation (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA(2, 3)'],
      ['=STDEVPA(B2:I2, 2, 3, 4, TRUE(), FALSE(), "1",)', 2, 3, 4, true, false, 'a', '\'1', null],
      ['=STDEVPA(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.45160010235011, 6)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })
})
