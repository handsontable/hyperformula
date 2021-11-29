import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function BESSELJ', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELJ(1)'],
      ['=BESSELJ(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELJ("foo", 1)'],
      ['=BESSELJ(2, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELJ(-1,0)'],
      ['=BESSELJ(0,0)'],
      ['=BESSELJ(5,0)'],
      ['=BESSELJ(-1,1)'],
      ['=BESSELJ(0,1)'],
      ['=BESSELJ(5,1)'],
      ['=BESSELJ(-1,3)'],
      ['=BESSELJ(0,3)'],
      ['=BESSELJ(5,3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.765197683754859, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.00000000283141, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.177596774112343, 6)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(-0.44005058567713, 6)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(-0.327579138566363, 6)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(-0.019563353982688, 6)
    expect(engine.getCellValue(adr('A8'))).toEqual(0)
    expect(engine.getCellValue(adr('A9'))).toBeCloseTo(0.364831233515002, 6)
  })

  it('should check bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELJ(1, -0.001)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))

  })

  it('should truncate second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELJ(-1,0.9)'],
      ['=BESSELJ(0,0.9)'],
      ['=BESSELJ(5,0.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.765197683754859, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.00000000283141, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.177596774112343, 6)
  })
})
