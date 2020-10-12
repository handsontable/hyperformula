import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function VARA', () => {
  it('should take at least two arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VARA()'],
      ['=VARA(1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate variance (sample)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VARA(2, 3)'],
      ['=VARA(2, 3, 4, TRUE(), FALSE(), "1",)'],
      ['=VARA(B3:I3)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(2.28571428571429)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2.61904761904762)
  })
})
