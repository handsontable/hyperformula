import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function SPLIT', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['some words', '=SPLIT(A1, 0)']])

    expect(engine.getCellValue(adr('B1'))).toEqual('some')
  })

  it('bigger index', () => {
    const engine = HyperFormula.buildFromArray([['some words', '=SPLIT(A1, 1)']])

    expect(engine.getCellValue(adr('B1'))).toEqual('words')
  })

  it('when continuous delimeters', () => {
    const engine = HyperFormula.buildFromArray([['some  words', '=SPLIT(A1, 1)', '=SPLIT(A1, 2)']])

    expect(engine.getCellValue(adr('B1'))).toEqual('')
    expect(engine.getCellValue(adr('C1'))).toEqual('words')
  })

  it('coerce first argument to string', () => {
    const engine = HyperFormula.buildFromArray([['42', '=SPLIT(A1, 1)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('when 2nd arg not a number', () => {
    const engine = HyperFormula.buildFromArray([['some words', '=SPLIT(A1, "foo")']])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('when index arg is not value within bounds', () => {
    const engine = HyperFormula.buildFromArray([['some words', '=SPLIT(A1, 17)', '=SPLIT(A1, -1)']])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })
})
