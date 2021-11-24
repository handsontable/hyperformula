import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LARGE', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(1)'],
      ['=LARGE(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(1, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(A2:D2,0)', '=LARGE(A2:D2,1)', '=LARGE(A2:D2,2)', '=LARGE(A2:D2,3)', '=LARGE(A2:D2,4)', '=LARGE(A2:D2,5)'],
      [1, 4, 2, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('C1'))).toEqual(4)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('E1'))).toEqual(1)
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('should ignore non-numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(A2:D2,0)', '=LARGE(A2:D2,1)', '=LARGE(A2:D2,2)', '=LARGE(A2:D2,3)'],
      [1, 4, true, 'abcd'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('should propagate errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(A2:D2,0)', '=LARGE(A2:D2,1)', '=LARGE(A2:D2,2)', '=LARGE(A2:D2,3)'],
      [1, 4, '=NA()', 'abcd'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('should truncate second arg', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(A2:D2,0.9)', '=LARGE(A2:D2,1.9)', '=LARGE(A2:D2,2.9)', '=LARGE(A2:D2,3.9)', '=LARGE(A2:D2,4.9)', '=LARGE(A2:D2,5.9)'],
      [1, 4, 2, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('C1'))).toEqual(4)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('E1'))).toEqual(1)
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })

  it('should work for non-ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LARGE(1,0)', '=LARGE(1,1)', '=LARGE(1,2)', '=LARGE(TRUE(),1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    //inconsistency with product #2
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
