import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function BESSELK', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELK(1)'],
      ['=BESSELK(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELK("foo", 1)'],
      ['=BESSELK(2, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELK(0.1,0)'],
      ['=BESSELK(1,0)'],
      ['=BESSELK(5,0)'],
      ['=BESSELK(0.1,1)'],
      ['=BESSELK(1,1)'],
      ['=BESSELK(5,1)'],
      ['=BESSELK(0.1,3)'],
      ['=BESSELK(1,3)'],
      ['=BESSELK(5,3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.42706902485802, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.421024421083418, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.00369109838196031, 6)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(9.85384478360091, 6)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(0.601907231666906, 6)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(0.00404461338320827, 6)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(7990.01243265865, 6)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(7.10126276933582, 6)
    expect(engine.getCellValue(adr('A9'))).toBeCloseTo(0.00829176837140317, 6)
  })

  it('should check bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELK(1, -0.001)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))

  })

  it('should truncate second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELK(0.1,0.9)'],
      ['=BESSELK(1,0.9)'],
      ['=BESSELK(5,0.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.42706902485802, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.421024421083418, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.00369109838196031, 6)
  })
})
