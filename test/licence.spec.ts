import {ErrorType, HyperFormula} from '../src'
import {CellError} from '../src/Cell'
import {adr, detailedError} from './testUtils'

describe( 'Wrong licence', () => {
  it('eval', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()', null, 1, '=A(']], {licenseKey: ''})
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.LIC, 'License key is missing.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.LIC, 'License key is missing.'))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.LIC, 'License key is missing.'))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.LIC, 'License key is missing.'))
  })

  it('serialization', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()', null, 1, '=A(']], {licenseKey: ''})
    expect(engine.getSheetSerialized(0)).toEqual([['#LIC!', '#LIC!', '#LIC!', '#LIC!']])
  })
})
