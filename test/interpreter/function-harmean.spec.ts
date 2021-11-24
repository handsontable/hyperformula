import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HARMEAN', () => {
  it('single number', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('two numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(1, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.6)
  })

  it('more numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(8, 1, 2, 4, 16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.58064516129032, 6)
  })

  it('validates input', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(8, 0, 2, 4, 16)'],
      ['=HARMEAN(8, -1, -2, 4, 16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('works with ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '9', '3'],
      ['=HARMEAN(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(2.07692307692308, 6)
  })

  it('propagates error from regular argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3/0', '=HARMEAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3/0', '=FOO(', '=HARMEAN(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('returns error for empty ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(A2:A3)'],
      [null],
      [null],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.OneValue))
  })

  /**
   * product #1 does not coerce the input
   */
  it('does coercions of nonnumeric explicit arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(TRUE(),"4")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.6)
  })

  it('ignores nonnumeric values in ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HARMEAN(A2:D2)'],
      [1, 1, false, null, '\'0']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })
})
