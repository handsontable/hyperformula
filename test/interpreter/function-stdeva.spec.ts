import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEVA', () => {
  it('should take at least two arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVA()'],
      ['=STDEVA(1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate standard deviation (sample)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVA(2, 3)'],
      ['=STDEVA(2, 3, 4, TRUE(), FALSE(), "1",)'],
      ['=STDEVA(B3:I3)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.707106781186548, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.51185789203691, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(1.61834718742537, 6)
  })
})
