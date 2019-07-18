import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('SUM', () => {
  it('SUM without args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=SUM()']])

    expect(engine.getCellValue('A1')).toEqual(0)
  })

  it('SUM with args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=SUM(1, B1)', '3.14']])

    expect(engine.getCellValue('A1')).toBeCloseTo(4.14)
  })

  it('SUM with range args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1', '2', '5'],
      ['3', '4', '=SUM(A1:B2)']])
    expect(engine.getCellValue('C2')).toEqual(10)
  })

  it('SUM with using previously cached value', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['3', '=SUM(A1:A1)'],
      ['4', '=SUM(A1:A2)'],
    ])
    expect(engine.getCellValue('B2')).toEqual(7)
  })

  it('SUM with bool', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=SUM(1,TRUE())']])
    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('SUM with string', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=SUM(1,"foo")']])
    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('SUM and + of 1 with "foo"', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', 'foo'],
      ['=A1+B1', '=SUM(A1:B1)'],
    ])
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('B2')).toEqual(1)
  })

  it('SUM range with string values', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['2'], ['foo'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('SUM range with bool values', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['2'], ['=TRUE()'], ['=SUM(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  xit('a bug', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
      ['=MAX(A1:A2)'],
      ['=SUM(A1:A3)'], // it does assume, that since Range(A1:A2) exists, it MUST have already computed value for SUM(A1:A2). Which is simply not true.
    ])
    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('range only with empty value', () => {
    const engine = HandsOnEngine.buildFromArray([['', '=SUM(A1:A1)']])
    expect(engine.getCellValue('B1')).toEqual(0)
  })

  it('range only with some empty values', () => {
    const engine = HandsOnEngine.buildFromArray([['42', '', '13', '=SUM(A1:C1)']])
    expect(engine.getCellValue('D1')).toEqual(55)
  })
})
