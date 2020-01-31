import {HyperFormula} from "../../src"
import {ErrorType} from "../../src/Cell"
import {adr, detailedError} from "../testUtils"

describe('Function CEILING', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CEILING()'],
      ['=CEILING(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CEILING("foo")'],
      ['=CEILING(1, "bar")'],
      ['=CEILING(1, 2, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should ensure that value and significance have same sign', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CEILING(1, -5)'],
      ['=CEILING(-2, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
        ['=CEILING(4.43, 0.3)'],
        ['=CEILING(4.43, 0.6)'],
        ['=CEILING(4.43, 2)'],
        ['=CEILING(4.43)'],
        ['=CEILING(-4.43)'],
        ['=CEILING(-3.14, -1.8)'],
        ['=CEILING(-3.14, 0)'],
        ['=CEILING(3.14, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(4.8)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
    expect(engine.getCellValue(adr('A5'))).toEqual(-4)
    expect(engine.getCellValue(adr('A6'))).toEqual(-1.8)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
    expect(engine.getCellValue(adr('A8'))).toEqual(0)
  })

  it('should work with mode for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CEILING(-11, -2)'],
      ['=CEILING(-11, -2, 0)'],
      ['=CEILING(-11, -2, 1)'],
      ['=CEILING(-11, 0, 1)'],
      ['=CEILING(-11, 0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-10)
    expect(engine.getCellValue(adr('A2'))).toEqual(-10)
    expect(engine.getCellValue(adr('A3'))).toEqual(-12)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
  })

  it('mode should make no difference for positive arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CEILING(11, 2, 0)'],
      ['=CEILING(11, 2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(12)
  })

  /* Inconsisitency with Product 1*/
  it('should work as described in ODDF', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CEILING(-11, -2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-10)
  })
})
