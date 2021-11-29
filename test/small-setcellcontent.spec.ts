import {ErrorType, HyperFormula} from '../src'
import {detailedErrorWithOrigin} from './testUtils'

describe('should properly build', () => {
  it('for this test', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.addSheet()
    engine.setSheetContent(0, [
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
    ])
    expect(engine.getSheetValues(0)).toEqual(
      [
        [detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'), detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B1')],
        [detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A2'), detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B2')],
      ]
    )
  })

  it('and for this', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
    ])
    expect(engine.getSheetValues(0)).toEqual(
      [
        [detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'), detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B1')],
        [detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A2'), detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B2')],
      ]
    )
  })
})
