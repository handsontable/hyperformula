import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SMALL', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(1)'],
      ['=SMALL(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(1, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(A2:D2,0)', '=SMALL(A2:D2,1)', '=SMALL(A2:D2,2)', '=SMALL(A2:D2,3)', '=SMALL(A2:D2,4)', '=SMALL(A2:D2,5)'],
      [1, 4, 2, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(4)
    expect(engine.getCellValue(adr('E1'))).toEqual(4)
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('should ignore non-numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(A2:D2,0)', '=SMALL(A2:D2,1)', '=SMALL(A2:D2,2)', '=SMALL(A2:D2,3)'],
      [1, 4, true, 'abcd'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(4)
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(A2:D2,0)', '=SMALL(A2:D2,1)', '=SMALL(A2:D2,2)', '=SMALL(A2:D2,3)'],
      [1, 4, '=NA()', 'abcd'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('should truncate second arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(A2:D2,0.9)', '=SMALL(A2:D2,1.9)', '=SMALL(A2:D2,2.9)', '=SMALL(A2:D2,3.9)', '=SMALL(A2:D2,4.9)', '=SMALL(A2:D2,5.9)'],
      [1, 4, 2, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(4)
    expect(engine.getCellValue(adr('E1'))).toEqual(4)
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('should work for non-ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SMALL(1,0)', '=SMALL(1,1)', '=SMALL(1,2)', '=SMALL(TRUE(),1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
