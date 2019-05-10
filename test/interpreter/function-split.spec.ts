import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter', () => {
  it('function SPLIT happy path', async () => {
    const engine = await HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1, 0)']])

    expect(engine.getCellValue('B1')).toEqual('some')
  })

  it('function SPLIT bigger index', async () => {
    const engine = await HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1, 1)']])

    expect(engine.getCellValue('B1')).toEqual('words')
  })

  it('function SPLIT when continuous delimeters', async () => {
    const engine = await HandsOnEngine.buildFromArray([['some  words', '=SPLIT(A1, 1)', '=SPLIT(A1, 2)']])

    expect(engine.getCellValue('B1')).toEqual('')
    expect(engine.getCellValue('C1')).toEqual('words')
  })

  it('function SPLIT when 1st arg not a string', async () => {
    const engine = await HandsOnEngine.buildFromArray([['42', '=SPLIT(A1, 1)']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function SPLIT when 2nd arg not a number', async () => {
    const engine = await HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1, "foo")']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function SPLIT when index arg is not value within bounds', async () => {
    const engine = await HandsOnEngine.buildFromArray([['some words', '=SPLIT(A1, 17)', '=SPLIT(A1, -1)']])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.VALUE))
  })
})
