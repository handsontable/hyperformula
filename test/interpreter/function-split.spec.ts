import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Interpreter', () => {
  it('function SPLIT happy path', () => {
    const engine = HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1; 0)']])

    expect(engine.getCellValue('B1')).toEqual('some')
  })

  it('function SPLIT bigger index', () => {
    const engine = HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1; 1)']])

    expect(engine.getCellValue('B1')).toEqual('words')
  })

  it('function SPLIT when continuous delimeters', () => {
    const engine = HandsOnEngine.buildFromArray([['some  words', '=SPLIT(A1; 1)', '=SPLIT(A1; 2)']])

    expect(engine.getCellValue('B1')).toEqual('')
    expect(engine.getCellValue('C1')).toEqual('words')
  })

  it('function SPLIT when 1st arg not a string', () => {
    const engine = HandsOnEngine.buildFromArray([['42', '=SPLIT(A1; 1)']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SPLIT when 2nd arg not a number', () => {
    const engine = HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1; "foo")']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SPLIT when index arg is not value within bounds', () => {
    const engine = HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1; 17)', '=SPLIT(A1; -1)']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.VALUE))
  })
})
