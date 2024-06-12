import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('AVERAGE', () => {
  it('AVERAGE with empty args', () => {
    const engine = HyperFormula.buildFromArray([['=AVERAGE()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('AVERAGE with args', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AVERAGE(1, B1)', '4']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2.5)
  })

  it('AVERAGE with range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['4'],
      ['=AVERAGE(A1:A3)']
    ])

    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(2.333333333)
  })

  it('AVERAGE ignores all nonnumeric arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
      ['foo'],
      [null],
      ['=TRUE()'],
      ['=X100'],
      ['=AVERAGE(A1:A5)']
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(42)
  })

  it('AVERAGE ignores all nonnumeric named expression arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AVERAGE(A, B, F)'],
    ], {}, [
      { name: 'A', expression: '42' },
      { name: 'B', expression: '=42' },
      { name: 'C', expression: 'foo' },
      { name: 'D', expression: '="foo"' },
      { name: 'E', expression: null },
      { name: 'F', expression: '' },
      { name: 'G', expression: '=""' },
      { name: 'H', expression: '=TRUE()' },
      { name: 'I', expression: '=Sheet1!$X$100' },
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })

  it('error when no meaningful arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo'],
      [null],
      ['=AVERAGE(A1:A2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('over a range value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=AVERAGE(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(13.5)
  })

  it('does propagate errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=AVERAGE(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
