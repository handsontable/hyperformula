import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function POISSON.DIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=POISSON.DIST(1, 2)'],
      ['=POISSON.DIST(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=POISSON.DIST("foo", 2, TRUE())'],
      ['=POISSON.DIST(1, "baz", TRUE())'],
      ['=POISSON.DIST(1, 2, "BCD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=POISSON.DIST(10, 1, TRUE())'],
      ['=POISSON.DIST(5, 2, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.999999989952234, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.983436391519386, 6)
  })

  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=POISSON.DIST(10, 1, FALSE())'],
      ['=POISSON.DIST(5, 2, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1')) as number / 1.0137771196303e-7).toBeCloseTo(1, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0360894088630967, 6)
  })

  it('should truncate first arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=POISSON.DIST(10.9, 1, TRUE())'],
      ['=POISSON.DIST(5.9, 2, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.999999989952234, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.983436391519386, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=POISSON.DIST(0, 0, FALSE())'],
      ['=POISSON.DIST(-0.01, 0, FALSE())'],
      ['=POISSON.DIST(0, -0.01, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    //product #1 returns value
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //product #2 returns value
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
