import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'
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
    expect(engine.getCellValue('A2')).toEqual(cellError(ErrorType.VALUE))
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
})

describe('MAX', () => {
  it('MAX with empty args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=MAX()']])
    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('MAX with args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=MAX(1, B1)', '3.14']])
    expect(engine.getCellValue('A1')).toBeCloseTo(3.14)
  })

  it('MAX with range', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['2'], ['=MAX(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('MAX with mixed arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['2'], ['=MAX(4,A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(4)
  })

  it('MAX with string', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['2'], ['=MAX(A1:A3,"foo")']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('MAX with string in range', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['foo'], ['=MAX(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('MAX of strings', async () => {
    const engine = await HandsOnEngine.buildFromArray([['foo'], ['bar'], ['=MAX(A1:A2)']])
    expect(engine.getCellValue('A3')).toEqual(0)
  })

  it('MAX of strings and -1', async () => {
    const engine = await HandsOnEngine.buildFromArray([['foo'], ['bar'], ['-1'], ['=MAX(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(-1)
  })
})

describe('MIN', () => {
  it('MIN with empty args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=MIN()']])
    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('MIN with args', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=MIN(1, B1)', '3.14']])
    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('MIN with range', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['2'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN with mixed arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['2'], ['=MIN(4,A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN with string', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['2'], ['=MIN(A1:A3,"foo")']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN with string in range', async () => {
    const engine = await HandsOnEngine.buildFromArray([['1'], ['3'], ['foo'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(1)
  })

  it('MIN of strings', async () => {
    const engine = await HandsOnEngine.buildFromArray([['foo'], ['bar'], ['=MIN(A1:A2)']])
    expect(engine.getCellValue('A3')).toEqual(0)
  })

  it('MIN of strings and number', async () => {
    const engine = await HandsOnEngine.buildFromArray([['foo'], ['bar'], ['5'], ['=MIN(A1:A3)']])
    expect(engine.getCellValue('A4')).toEqual(5)
  })
})
