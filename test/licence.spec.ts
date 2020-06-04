import {ErrorType, HyperFormula} from '../src'
import {CellError} from '../src/Cell'
import {adr, detailedError} from './testUtils'

describe( 'Wrong licence', () => {
  it('eval', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()']], {licenseKey: ''})
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.LIC))
  })

  it('serialization', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()', null, 1]], {licenseKey: ''})
    expect(engine.getSheetSerialized(0)).toEqual([['#LIC!', '#LIC!', '#LIC!']])
  })
})
