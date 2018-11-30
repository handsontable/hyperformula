import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Interpreter', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it('function SPLIT happy path', () => {
    engine.loadSheet([['some words', '=SPLIT(A1; 0)']])

    expect(engine.getCellValue('B1')).toEqual('some')
  })

  it('function SPLIT bigger index', () => {
    engine.loadSheet([['some words', '=SPLIT(A1; 1)']])

    expect(engine.getCellValue('B1')).toEqual('words')
  })

  it('function SPLIT when 1st arg not a string', () => {
    engine.loadSheet([['42', '=SPLIT(A1; 1)']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SPLIT when 2nd arg not a number', () => {
    engine.loadSheet([['some words', '=SPLIT(A1; "foo")']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('function SPLIT when index arg is not value within bounds', () => {
    engine.loadSheet([['some words', '=SPLIT(A1; 17)', '=SPLIT(A1; -1)']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.VALUE))
  })
})
