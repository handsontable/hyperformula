import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Function MEDIAN', () => {
  it('single number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('two numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.5)
  })

  it('more numbers (odd)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(3, 1, 2, 5, 7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('more numbers (even)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(3, 4, 1, 2, 5, 7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3.5)
  })

  it('works with ranges', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '5', '1'],
      ['=MEDIAN(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('propagates error from regular argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3/0', '=MEDIAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3/0', '=FOO', '=MEDIAN(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('return error when an argument is not a number', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo', '=MEDIAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('return error when range argument contains not a number', () => {
    const engine = HyperFormula.buildFromArray([
      ['5', 'foo', '=MEDIAN(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('return error when no arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })
})
