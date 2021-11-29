import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IMSUM', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSUM()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should coerce explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSUM(0)'],
      ['=IMSUM("i", "-1.5")'],
      ['=IMSUM("-3+4i", "1+i", 1, 2, "3")'],
      ['=IMSUM("i",)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('0')
    expect(engine.getCellValue(adr('A2'))).toEqual('-1.5+i')
    expect(engine.getCellValue(adr('A3'))).toEqual('4+5i')
    expect(engine.getCellValue(adr('A4'))).toEqual('i')
  })

  it('should fail for non-coercible explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSUM(1, TRUE())'],
      ['=IMSUM(2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should not coerce range arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSUM(B1:C1)', 1, '2+i'],
      ['=IMSUM(B2:D2)', 1, null, null],
      ['=IMSUM(B3:D3)', 'i', 'abcd', true],
      ['=IMSUM(B4:D4,)', 'i', '=NA()', 1],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('3+i')
    expect(engine.getCellValue(adr('A2'))).toEqual('1')
    expect(engine.getCellValue(adr('A3'))).toEqual('i')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })
})
