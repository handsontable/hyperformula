import {Config} from '../../src'
import {HyperFormula} from '../../src'
import {CellError, EmptyValue, ErrorType} from '../../src/Cell'
import {coerceDateToNumber} from '../../src/interpreter/coerce'
import '../testConfig'
import {adr} from '../testUtils'

describe('Date arithmetic', () => {
  it('subtract two dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '02/06/2019', '=A1-B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(245)
  })
  it('compare two dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '02/06/2019', '=A1>B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })
  it('sum date with number', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '2', '=A1+B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe('04/02/2020',)
  })
  it('sum date with boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '=TRUE()', '=A1+B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe('03/02/2020',)
  })
})
