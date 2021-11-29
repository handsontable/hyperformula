import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TDIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TDIST(1, 1)'],
      ['=TDIST(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TDIST("foo", 2, 3)'],
      ['=TDIST(1, "baz", 3)'],
      ['=TDIST(1, 2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work as T.DIST.RT', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TDIST(1, 1, 1)'],
      ['=TDIST(3, 2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.25, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0477329831333546, 6)
  })

  it('should work as T.DIST.2T', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TDIST(1, 1, 2)'],
      ['=TDIST(3, 2, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0954659662667092, 6)
  })

  it('should truncate input', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TDIST(1, 1.9, 2)'],
      ['=TDIST(3, 2.9, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0954659662667092, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TDIST(0, 1, 1)'],
      ['=TDIST(0, 1, 2)'],
      ['=TDIST(-0.01, 1, 1)'],
      ['=TDIST(-0.01, 1, 2)'],
      ['=TDIST(1, 0.9, 1)'],
      ['=TDIST(1, 0.9, 2)'],
      ['=TDIST(0, 1, 1.5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1, 6)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //product #2 returns value
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.IntegerExpected))
  })
})
