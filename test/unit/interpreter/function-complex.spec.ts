import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COMPLEX', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COMPLEX(1)'],
      ['=COMPLEX(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COMPLEX("foo", 2)'],
      ['=COMPLEX(1, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COMPLEX(0, 0)'],
      ['=COMPLEX(0, 1)'],
      ['=COMPLEX(0, -1)'],
      ['=COMPLEX(0, 2)'],
      ['=COMPLEX(0, -2)'],
      ['=COMPLEX(1, 0)'],
      ['=COMPLEX(1, 1)'],
      ['=COMPLEX(1, -1)'],
      ['=COMPLEX(1, 2)'],
      ['=COMPLEX(1, -2)'],
      ['=COMPLEX(-1, 0)'],
      ['=COMPLEX(-1, 1)'],
      ['=COMPLEX(-1, -1)'],
      ['=COMPLEX(-1, 2)'],
      ['=COMPLEX(-1, -2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('0')
    expect(engine.getCellValue(adr('A2'))).toBe('i')
    expect(engine.getCellValue(adr('A3'))).toBe('-i')
    expect(engine.getCellValue(adr('A4'))).toBe('2i')
    expect(engine.getCellValue(adr('A5'))).toBe('-2i')
    expect(engine.getCellValue(adr('A6'))).toBe('1')
    expect(engine.getCellValue(adr('A7'))).toBe('1+i')
    expect(engine.getCellValue(adr('A8'))).toBe('1-i')
    expect(engine.getCellValue(adr('A9'))).toBe('1+2i')
    expect(engine.getCellValue(adr('A10'))).toBe('1-2i')
    expect(engine.getCellValue(adr('A11'))).toBe('-1')
    expect(engine.getCellValue(adr('A12'))).toBe('-1+i')
    expect(engine.getCellValue(adr('A13'))).toBe('-1-i')
    expect(engine.getCellValue(adr('A14'))).toBe('-1+2i')
    expect(engine.getCellValue(adr('A15'))).toBe('-1-2i')
  })

  it('should work with third argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COMPLEX(1, 1, "i")'],
      ['=COMPLEX(1, 1, "j")'],
      ['=COMPLEX(1, 1, "k")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('1+i')
    expect(engine.getCellValue(adr('A2'))).toBe('1+j')
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ShouldBeIorJ))
  })
})
