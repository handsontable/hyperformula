import {HyperFormula} from '../src'

describe('should properly build', () => {
  it('for this test', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet()
    engine.setSheetContent('Sheet1', [
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
    ])
  })

  it('and for this', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
      ['=MAX(B1:B2)', '=MAX(A1:A2)'],
    ])
  })
})
