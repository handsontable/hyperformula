import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LOGNORM.DIST', () => {
  //in product #1, this function takes 3 arguments
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.DIST(1, 2, 3)'],
      ['=LOGNORM.DIST(1, 2, 3, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  //in product #1, this function takes 3 arguments
  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.DIST("foo", 2, 3, TRUE())'],
      ['=LOGNORM.DIST(1, "baz", 3, TRUE())'],
      ['=LOGNORM.DIST(1, 2, "baz", TRUE())'],
      ['=LOGNORM.DIST(1, 2, 3, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  //in product #1, this function takes 3 arguments
  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.DIST(0.1, 1, 2, TRUE())'],
      ['=LOGNORM.DIST(0.5, 2, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0493394267528022, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.250382425968177, 6)
  })

  //in product #1, this function takes 3 arguments
  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.DIST(0.1, 1, 2, FALSE())'],
      ['=LOGNORM.DIST(0.5, 2, 4, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.510234855730895, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.159017142514074, 6)
  })

  //in product #1, this function takes 3 arguments
  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOGNORM.DIST(0.01, 0, 0.01, FALSE())'],
      ['=LOGNORM.DIST(0, 0, 0.01, FALSE())'],
      ['=LOGNORM.DIST(0.01, 0, 0, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
