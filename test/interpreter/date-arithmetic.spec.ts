import {Config} from '../../src'
import {HyperFormula} from '../../src'
import {CellError, EmptyValue, ErrorType} from '../../src/Cell'
import {coerceScalarToNumber} from '../../src/interpreter/coerce'
import '../testConfig'
import {adr} from '../testUtils'

describe('Date arithmetic', () => {
  it('subtract two dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '02/06/2019', '=A1-B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(361)
  })
  it('compare two dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '02/06/2019', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })
  it('compare two datestrings', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '="02/06/2019"', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })
  it('compare date with datestring', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '02/06/2019', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })
  it('compare date with bool', () => {
    const engine = HyperFormula.buildFromArray([
      ['="02/02/2020"', '=TRUE()', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
    expect(engine.getCellValue(adr('E1'))).toBe(false)
    expect(engine.getCellValue(adr('F1'))).toBe(true)
  })
  it('compare date with number', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '2', '=A1>B1', '=A1<B1', '=A1>=B1', '=A1<=B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
    expect(engine.getCellValue(adr('F1'))).toBe(false)
  })
  it('sum date with number', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '2', '=A1+B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(43865)
  })
  it('sum date with boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['02/02/2020', '=TRUE()', '=A1+B1'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(43864)
  })
  it('functions on dates', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISEVEN("02/02/2020")', '=COS("02/02/2020")', '=BITOR("02/02/2020","08/16/1985")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(0.9965266857693633)
    expect(engine.getCellValue(adr('C1'))).toBe(64383)
  })
})
