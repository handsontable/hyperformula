import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SPLIT', () => {
  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=SPLIT(1)', '=SPLIT("a","b","c")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['some words', '=SPLIT(A1, 0)']])

    expect(engine.getCellValue(adr('B1'))).toEqual('some')
  })

  it('bigger index', async() => {
const engine = await HyperFormula.buildFromArray([['some words', '=SPLIT(A1, 1)']])

    expect(engine.getCellValue(adr('B1'))).toEqual('words')
  })

  it('when continuous delimeters', async() => {
const engine = await HyperFormula.buildFromArray([['some  words', '=SPLIT(A1, 1)', '=SPLIT(A1, 2)']])

    expect(engine.getCellValue(adr('B1'))).toEqual('')
    expect(engine.getCellValue(adr('C1'))).toEqual('words')
  })

  it('coerce first argument to string', async() => {
const engine = await HyperFormula.buildFromArray([['42', '=SPLIT(A1, 1)']])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IndexBounds))
  })

  it('when 2nd arg not a number', async() => {
const engine = await HyperFormula.buildFromArray([['some words', '=SPLIT(A1, "foo")']])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('when index arg is not value within bounds', async() => {
const engine = await HyperFormula.buildFromArray([['some words', '=SPLIT(A1, 17)', '=SPLIT(A1, -1)']])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IndexBounds))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IndexBounds))
  })
})
