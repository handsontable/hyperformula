import {ErrorType, HyperFormula} from '../src'
import {adr, detailedErrorWithOrigin} from './testUtils'

describe('OPs', () => {
  it('unary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=SUM(-A1:C1)']], {arrays: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('binary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],[4,5,6],['=SUM(2*A1:C1+A2:C2)']], {arrays: true})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('index', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=INDEX(2*A1:C1+3,1,1)']], {arrays: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })

  it('binary op + index', () => {
    const engine = HyperFormula.buildFromArray([
      [1,2,3],
      [4,5,6],
      [7,8,9],
      ['=INDEX(A1:C2+A1:B3,1,1)', '=INDEX(A1:C2+A1:B3,1,2)', '=INDEX(A1:C2+A1:B3,1,3)'],
      ['=INDEX(A1:C2+A1:B3,2,1)', '=INDEX(A1:C2+A1:B3,2,2)', '=INDEX(A1:C2+A1:B3,2,3)'],
      ['=INDEX(A1:C2+A1:B3,3,1)', '=INDEX(A1:C2+A1:B3,3,2)', '=INDEX(A1:C2+A1:B3,3,3)'],
    ], {arrays: true})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1,2,3],
        [4,5,6],
        [7,8,9],
      [2,4,detailedErrorWithOrigin(ErrorType.NA, "Sheet1!C4")],
      [8,10,detailedErrorWithOrigin(ErrorType.NA, "Sheet1!C5")],
      [detailedErrorWithOrigin(ErrorType.NA, "Sheet1!A6"),detailedErrorWithOrigin(ErrorType.NA, "Sheet1!B6"),detailedErrorWithOrigin(ErrorType.NA, "Sheet1!C6")]])
  })
})
