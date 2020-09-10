import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe( 'decimal parsing', () => {
  it('parsing decimal without leading zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['.1', '=.1'],
      ['-.1', '=-.1'],
      ['+.1', '=+.1'],
      ['+.1', '=+.1+.2'],
      ['=SUM(A1:A4, 0.3, .3)', '=SUM(B1:B4)'],
      ['.1.4', '=..1']
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0.1)
    expect(engine.getCellValue(adr('B1'))).toBe(0.1)
    expect(engine.getCellValue(adr('A2'))).toBe(-0.1)
    expect(engine.getCellValue(adr('B2'))).toBe(-0.1)
    expect(engine.getCellValue(adr('A3'))).toBe(0.1)
    expect(engine.getCellValue(adr('B3'))).toBe(0.1)
    expect(engine.getCellValue(adr('A4'))).toBe(0.1)
    expect(engine.getCellValue(adr('B4'))).toBe(0.3)
    expect(engine.getCellValue(adr('A5'))).toBe(0.8)
    expect(engine.getCellValue(adr('B5'))).toBe(0.4)
    expect(engine.getCellValue(adr('A6'))).toBe('.1.4')
    expect(engine.getCellValue(adr('B6'))).toEqual(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })
})
