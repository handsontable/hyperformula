import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IMPRODUCT', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMPRODUCT()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should coerce explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMPRODUCT(0)'],
      ['=IMPRODUCT("i", "-1.5")'],
      ['=IMPRODUCT("-3+4i", "1+i", 1, 2, "3")'],
      ['=IMPRODUCT("i",)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('0')
    expect(engine.getCellValue(adr('A2'))).toEqual('-1.5i')
    expect(engine.getCellValue(adr('A3'))).toEqual('-42+6i')
    expect(engine.getCellValue(adr('A4'))).toEqual('i')
  })

  it('should fail for non-coercible explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMPRODUCT(1, TRUE())'],
      ['=IMPRODUCT(2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should not coerce range arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMPRODUCT(B1:C1)', 1, '2+i'],
      ['=IMPRODUCT(B2:D2)', 1, null, null],
      ['=IMPRODUCT(B3:D3)', 'i', 'abcd', true],
      ['=IMPRODUCT(B4:D4,)', 'i', '=NA()', 1],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('2+i')
    expect(engine.getCellValue(adr('A2'))).toEqual('1')
    expect(engine.getCellValue(adr('A3'))).toEqual('i')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })
})
