import {ErrorType, HyperFormula} from '../src'
import {adr, detailedErrorWithOrigin} from './testUtils'

describe('Address preservation.', () => {
  it('Should work in the basic case.', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NA()', '=A1']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })

  it('Should work with named expressions.', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NAMEDEXPRESSION', '=A1']
    ])
    engine.addNamedExpression('NAMEDEXPRESSION', '=NA()')
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })

  it('Should work with operators.', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NA()', '=NA()', '=A1+B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })

  it('Should work between sheets.', () => {
    const engine = HyperFormula.buildFromSheets({
      sheet1: [['=NA()']],
      sheet2: [['=sheet1!A1']]
    })
    expect(engine.getCellValue(adr('A1', 0))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'sheet1!A1'))
    expect(engine.getCellValue(adr('A1', 1))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'sheet1!A1'))
  })

  it('Should work with function calls.', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NA()', '=DATE(1,1,A1)']
    ])
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })
})
