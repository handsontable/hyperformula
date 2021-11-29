import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function T.DIST.RT', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.DIST.RT(1)'],
      ['=T.DIST.RT(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.DIST.RT("foo", 2)'],
      ['=T.DIST.RT(1, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.DIST.RT(1, 1)'],
      ['=T.DIST.RT(3, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.25, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0477329831333546, 6)
  })

  it('should truncate input', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.DIST.RT(1, 1.9)'],
      ['=T.DIST.RT(3, 2.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.25, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0477329831333546, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T.DIST.RT(0, 1)'],
      ['=T.DIST.RT(-0.01, 1)'],
      ['=T.DIST.RT(1, 0.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.50318300828035, 6)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
