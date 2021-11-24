import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IFERROR', () => {
  it('Should not work for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IFERROR(1)', '=IFERROR(2,3,4)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
  it('when no error', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR("abcd", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('abcd')
  })

  it('preserves types of first arg', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR(B1, 1)', '1%' ]])

    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('preserves types of second arg', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR(NA(), B1)', '1%' ]])

    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('when left-error', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR(1/0, "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when right-error', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR("yes", 1/0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when both-error', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR(#VALUE!, 1/0)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when range', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR("yes", A2:A3)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('when cycle', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR(B1, 1)', '=B1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('when left-parsing error', async() => {
const engine = await HyperFormula.buildFromArray([['=IFERROR(B1, 1/0)', '=SUM(']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
