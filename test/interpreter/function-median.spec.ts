import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Function MEDIAN', () => {
  it('single number', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=MEDIAN(1)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('two numbers', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=MEDIAN(1, 2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1.5)
  })

  it('more numbers (odd)', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=MEDIAN(3, 1, 2, 5, 7)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(3)
  })

  it('more numbers (even)', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=MEDIAN(3, 4, 1, 2, 5, 7)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(3.5)
  })

  it('works with ranges', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['3', '5', '1'],
      ['=MEDIAN(A1:C1)'],
    ])

    expect(engine.getCellValue('A2')).toEqual(3)
  })

  it('propagates error from regular argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=3/0', '=MEDIAN(A1)'],
    ])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=3/0', '=FOO', '=MEDIAN(A1:B1)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error when an argument is not a number', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['foo', '=MEDIAN(A1)'],
    ])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.NA))
  })

  it('return error when range argument contains not a number', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['5', 'foo', '=MEDIAN(A1:B1)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.NA))
  })

  it('return error when no arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=MEDIAN()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })
})
