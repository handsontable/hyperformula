import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Function SUMPRODUCT', () => {
  it('works',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['=SUMPRODUCT(A1:A3,B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(14)
  })

  it('works with wider ranges',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '3', '1', '3'],
      ['2', '4', '2', '4'],
      ['=SUMPRODUCT(A1:B2,C1:D2)'],
    ])

    expect(engine.getCellValue('A3')).toEqual(30)
  })

  it('works with cached smaller range',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '1', '=SUMPRODUCT(A1:A1, B1:B1)'],
      ['2', '2', '=SUMPRODUCT(A1:A2, B1:B2)'],
      ['3', '3', '=SUMPRODUCT(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(1)
    expect(engine.getCellValue('C2')).toEqual(5)
    expect(engine.getCellValue('C3')).toEqual(14)
  })

  it('sumproduct from scalars',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['=SUMPRODUCT(42, 78)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(3276)
  })

  it('use cached value if the same formula used',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(5)
  })

  xit('works even if garbage in data',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '1'],
      ['asdf', '2'],
      ['3', '3'],
      ['=SUMPRODUCT(A1:A3,B1:B3)'],
    ])

    expect(engine.getCellValue('A4')).toEqual(10)
  })

  it('error when different size',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '3', '1', '3'],
      ['2', '4', '2', '4'],
      ['=SUMPRODUCT(A1:B2,C1:C2)'],
      ['=SUMPRODUCT(A1:B2,C1:D1)'],
    ])

    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A4')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('error when not supported types',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['=SUMPRODUCT(1, B1:B2)'],
      ['=SUMPRODUCT(B1:B2, "a")'],
      ['=SUMPRODUCT(A1, B1:B2)'],
    ])
    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
  })

  xit('works with matrices',  () => {
    const engine =  HandsOnEngine.buildFromArray([
        ['1', '2'],
        ['3'],
        ['=SUMPRODUCT(A1:B1, TRANSPOSE(A1:A2))'],
    ])
    expect(engine.getCellValue('A3')).toEqual(7)
  })

  it('works if same number of elements in ranges',  () => {
    const engine =  HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['2'],
      ['3'],
      ['=SUMPRODUCT(A1:C1,A1:A3)'],
    ])
    expect(engine.getCellValue('A4')).toEqual(14)
  })
})
