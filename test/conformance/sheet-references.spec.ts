import { HyperFormula, DetailedCellError, CellError } from '../../src'
import '../testConfig'
import { adr, detailedError } from '../testUtils'
import { ErrorType } from '../../src/Cell'

function createEngine(data: any[][]) {
  const engine = HyperFormula.buildFromArray(data)

  return {
    getCellValue(cellAddress: string) {
      return engine.getCellValue(adr(cellAddress))
    }
  }
}

describe('Quality assurance of cell, sheet and range references', () => {
  it('nested references, engine with multiple sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['0', '1'],
        ['2', '3'],
      ],
      Sheet2: [
        ['=Sheet1!A1', '=Sheet1!A2'],
        ['=Sheet1!B1', '=Sheet1!B2'],
      ],
      Sheet3: [
        ['=SUM(Sheet2!A1:Sheet2!B2)'],
      ],
    })
    expect(engine.getCellValue(adr('A1', 2))).toEqual(6)
  })

  xit('column nested references, engine with multiple sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        [1],
        [2],
        [3],
        ['=SUM(A1:A3)']
      ],
      Sheet2: [
        [10, 20],
        [30, 50],
        ['=SUM(A1:B2)']
      ],
      Sheet3: [
        ['=SUM(Sheet1!A:A)'],
        ['=SUM(Sheet2!A:B)'],
      ],
    })
    expect(engine.getCellValue(adr('A4', 0))).toEqual(6)
    expect(engine.getCellValue(adr('A3', 1))).toEqual(110)
    expect(engine.getCellValue(adr('A1', 2))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellValue(adr('A2', 2))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))

  })
})