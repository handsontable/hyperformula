import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Function COUNTUNIQUE', () => {
  it('error when no arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTUNIQUE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NA))
  })

  it('errors in arguments are propagated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTUNIQUE(5/0)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it('single number', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTUNIQUE(1)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1)
  })

  it('two numbers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTUNIQUE(1, 2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(2)
  })

  it('three numbers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTUNIQUE(2, 1, 2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(2)
  })

  it('three numbers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=COUNTUNIQUE(2, 1, 1)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(2)
  })
})
