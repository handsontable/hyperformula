import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HYPERLINK', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HYPERLINK()', '=HYPERLINK("s1","s2","s3")']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with only url argument', () => {
    const url = 'https://hyperformula.handsontable.com/'
    const engine = HyperFormula.buildFromArray([[`=HYPERLINK("${url}")`]])
    expect(engine.getCellValue(adr('A1'))).toEqual(url)
  })

  it('with url and label arguments', () => {
    const url = 'https://hyperformula.handsontable.com/'
    const linkLabel = 'HyperFormula'
    const engine = HyperFormula.buildFromArray([[`=HYPERLINK("${url}","${linkLabel}")`]])
    expect(engine.getCellValue(adr('A1'))).toEqual(linkLabel)
  })

  it('when not the root expression', () => {
    const url = 'https://hyperformula.handsontable.com/'
    const linkLabel = 'HyperFormula'
    const prefix = 'Prefix: '
    const engine = HyperFormula.buildFromArray([[`=CONCATENATE("${prefix}",HYPERLINK("${url}","${linkLabel}"))`]])
    expect(engine.getCellValue(adr('A1'))).toEqual(prefix + linkLabel)
  })
})
