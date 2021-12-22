import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function NOW', () => {
  let originalNow: () => number

  beforeEach(() => {
    originalNow = Date.now
    let cnt = 20
    Date.now = () => {
      cnt += 1
      return Date.parse(`1985-08-16T03:45:${cnt}`)
    }
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NOW()'],
    ])
    const t1 = engine.getCellValue(adr('A1')) as number
    expect(t1).toBeCloseTo(31275.1565856481)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    engine.setCellContents(adr('A2'), null)
    const delta = engine.getCellValue(adr('A1')) as number - t1
    expect(delta * 24 * 60 * 60).toBeGreaterThanOrEqual(1) //internals of the engine are also using Date.now(), so the value should be actually 4 or even more
  })

  it('works #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEAR(NOW())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1985)
  })

  it('works #3', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MONTH(NOW())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(8)
  })

  it('works #4', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(NOW())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(16)
  })

  it('works #5', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HOUR(NOW())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works #6', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MINUTE(NOW())'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(45)
  })

  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NOW(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  afterEach(() => {
    Date.now = originalNow
  })
})
