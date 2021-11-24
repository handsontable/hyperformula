import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IF', () => {
  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(TRUE(), "no", 1, 2)', '=IF(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
  it('when value is true', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(TRUE(), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when value is false', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(FALSE(), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('no')
  })

  it('coercing empty string', async() => {
const engine = await HyperFormula.buildFromArray([['', '=IF(A1, "yes", "no")']])
    expect(engine.getCellValue(adr('B1'))).toEqual('no')
  })

  it('when condition is weird type', async() => {
const engine = await HyperFormula.buildFromArray([['=IF("foo", "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('use coercion', async() => {
const engine = await HyperFormula.buildFromArray([['=IF("TRUE", "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('returns error if condition is an error', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(4/0, "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('passes errors', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(TRUE(), 4/0, "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('passes subtypes of second arg', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(TRUE(),B1,C1)', '1%', '1']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('passes subtypes of third arg', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(FALSE(),B1,C1)', '1', '1%']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('passes correct value when other arg is an error', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(FALSE(), 4/0, "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('no')
  })

  it('when condition is number', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(1, "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when condition is logic function', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(OR(1, FALSE()), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('works when only first part is given', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(TRUE(), "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('works when only first part is given and condition is false', async() => {
const engine = await HyperFormula.buildFromArray([['=IF(FALSE(), "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('range value results in VALUE error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['3'],
      ['=IF(A1:A3,"yes","no")'],
      ['=IF(A1:A3,"yes","no")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
