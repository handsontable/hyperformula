import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('AVERAGE', () => {
  it('AVERAGE with empty args', async() => {
const engine = await HyperFormula.buildFromArray([['=AVERAGE()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('AVERAGE with args', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=AVERAGE(1, B1)', '4']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2.5)
  })

  it('AVERAGE with range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['4'],
      ['=AVERAGE(A1:A3)']
    ])

    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(2.333333333)
  })

  it('AVERAGE ignores all nonnumeric arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
      ['foo'],
      [null],
      ['=TRUE()'],
      ['=AVERAGE(A1:A4)']
    ])

    expect(engine.getCellValue(adr('A5'))).toEqual(42)
  })

  it('error when no meaningful arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['foo'],
      [null],
      ['=AVERAGE(A1:A2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('over a range value', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=AVERAGE(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(13.5)
  })

  it('does propagate errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=AVERAGE(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
