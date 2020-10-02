import {ErrorType, HyperFormula} from '../src'
import {adr, detailedErrorWithOrigin} from './testUtils'

describe('Address preservation.', () => {
  it('Should work in the basic case.', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NA()', '=A1']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })
})
