import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ERF', () => {

  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ERF()'],
      ['=ERF(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ERF("foo")'],
      ['=ERF(1, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work for single argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ERF(0)'],
      ['=ERF(1)'],
      ['=ERF(3.14)'],
      ['=ERF(-2.56)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.9999910304344467, 6)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(-0.999705836979508, 6)
  })

  it('should work with second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ERF(-2.3, -0.7)'],
      ['=ERF(-2.3, 2)'],
      ['=ERF(5.6, -3.1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.32105562956522493, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.9941790884215962, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-1.9999883513426304, 6)
  })
})
