import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MROUND', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MROUND(101)'],
      ['=MROUND(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MROUND(1, "foo")'],
      ['=MROUND("bar", 4)'],
      ['=MROUND("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return 0 when dividing by 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MROUND(42, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('should return error for args of different signs', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MROUND(42, -1)'],
      ['=MROUND(-42, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.DistinctSigns))
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.DistinctSigns))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MROUND(5, 2)'],
      ['=MROUND(36, 6.5)'],
      ['=MROUND(10.5, 3)'],
      ['=MROUND(-5, -2)'],
      ['=MROUND(-36, -6.5)'],
      ['=MROUND(-10.5, -3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(39)
    expect(engine.getCellValue(adr('A3'))).toEqual(12)
    expect(engine.getCellValue(adr('A4'))).toEqual(-6)
    expect(engine.getCellValue(adr('A5'))).toEqual(-39)
    expect(engine.getCellValue(adr('A6'))).toEqual(-12)
  })

  /**
   * Tests below are results of how floating point arithmetic works.
   * This behavior is undefined, and this is test for consistency between platforms.
   * If this test starts throwing errors, it should be disabled.
   */
  it('known limitations', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MROUND(6.05, 0.1)'],
      ['=MROUND(7.05, 0.1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(7.1)
  })
})
