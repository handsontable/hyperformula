import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function F.DIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST(1, 2, 3)'],
      ['=F.DIST(1, 2, 3, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST("foo", 2, 3, TRUE())'],
      ['=F.DIST(1, "baz", 3, TRUE())'],
      ['=F.DIST(1, 2, "abcd", TRUE())'],
      ['=F.DIST(1, 2, 3, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST(1, 1, 1, TRUE())'],
      ['=F.DIST(3, 2, 2, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.75, 6)
  })

  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST(1, 1, 1, FALSE())'],
      ['=F.DIST(3, 2, 2, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.159154942198517, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0625, 6)
  })

  it('truncates second and third arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST(1, 1.9, 1, FALSE())'],
      ['=F.DIST(3, 2, 2.9, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.159154942198517, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0625, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST(0, 1, 1, FALSE())'],
      ['=F.DIST(-0.001, 1, 1, FALSE())'],
      ['=F.DIST(0, 0.999, 1, FALSE())'],
      ['=F.DIST(0, 1, 0.999, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
