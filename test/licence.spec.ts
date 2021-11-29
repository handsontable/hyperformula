import {ErrorType, HyperFormula} from '../src'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError} from './testUtils'

describe('Wrong licence', () => {
  it('eval', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRUE()', null, 1, '=A(']], {licenseKey: ''})
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.LIC, ErrorMessage.LicenseKey('missing')))
    expect(engine.getCellValue(adr('B1'))).toEqual(null)
    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('serialization', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRUE()', null, 1, '=A(']], {licenseKey: ''})
    expect(engine.getSheetSerialized(0)).toEqual([['=TRUE()', null, 1, '=A(']])
  })
})
