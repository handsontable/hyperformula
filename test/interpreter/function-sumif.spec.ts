import {HandsOnEngine} from '../../src'
import {cellError, ErrorType} from '../../src/Cell'

describe('Function SUMIF', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it('error when 1st arg is not a range', () => {
    engine.loadSheet([
      ['=SUMIF(42; ">0"; B1:B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('error when 2nd arg is not a string', () => {
    engine.loadSheet([
      ['=SUMIF(C1:C2; 78; B1:B2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('error when 3rd arg is not a range', () => {
    engine.loadSheet([
      ['=SUMIF(C1:C2; ">0"; 42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('error when criterion unparsable', () => {
    engine.loadSheet([
      ['=SUMIF(B1:B2; "%"; C1:C2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.VALUE))
  })

  it('usage of greater than operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; ">1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(7)
  })

  it('usage of greater than or equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; ">=1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(12)
  })

  it('usage of less than operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A2; "<1"; B1:B2)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(3)
  })

  it('usage of less than or equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; "<=1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(8)
  })

  it('usage of equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; "=1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })

  it('usage of not equal operator', () => {
    engine.loadSheet([
      ['0', '3'],
      ['1', '5'],
      ['2', '7'],
      ['=SUMIF(A1:A3; "<>1"; B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(10)
  })
})
