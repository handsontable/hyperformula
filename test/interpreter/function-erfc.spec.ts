import {HyperFormula} from "../../src"
import {ErrorType} from "../../src/Cell"
import {adr, detailedError, expectCloseTo} from "../testUtils"

describe('Function ERFC', () => {
  const precision = 0.0000003

  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
        ['=ERFC()'],
        ['=ERFC(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ERFC("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ERFC(0)'],
      ['=ERFC(2)'],
      ['=ERFC(0.5)'],
    ])

    expectCloseTo(engine.getCellValue(adr('A1')), 1, precision)
    expectCloseTo(engine.getCellValue(adr('A2')), 0.004677734981047288, precision)
    expectCloseTo(engine.getCellValue(adr('A3')), 0.4795001221869535, precision)
  })

  it('should work for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ERFC(-10.123)'],
      ['=ERFC(-14.8)'],
    ])

    expectCloseTo(engine.getCellValue(adr('A1')), 2, precision)
    expectCloseTo(engine.getCellValue(adr('A2')), 2, precision)
  })
})
