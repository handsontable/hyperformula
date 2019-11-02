import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function COUNTUNIQUE', () => {
  it('error when no arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTUNIQUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('errors in arguments are propagated', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(5/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('single number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('two numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('three numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(2, 1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('three numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(2, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })
})
