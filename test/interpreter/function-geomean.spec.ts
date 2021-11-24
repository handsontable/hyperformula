import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function GEOMEAN', () => {
  it('single number', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=GEOMEAN(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('two numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=GEOMEAN(1, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('more numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=GEOMEAN(8, 1, 2, 4, 16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('validates input', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=GEOMEAN(8, 0, 2, 4, 16)'],
      ['=GEOMEAN(8, -1, -2, 4, 16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('works with ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '9', '3'],
      ['=GEOMEAN(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('propagates error from regular argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3/0', '=GEOMEAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3/0', '=FOO(', '=GEOMEAN(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('returns error for empty ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=GEOMEAN(A2:A3)'],
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
      ['=GEOMEAN(TRUE(),"4")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('ignores nonnumeric values in ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=GEOMEAN(A2:D2)'],
      [1, 1, false, null, '\'0']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })
})
