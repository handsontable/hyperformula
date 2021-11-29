import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NORM.S.DIST', () => {
  //in product #1, this function takes 1 argument
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.DIST(2)'],
      ['=NORM.S.DIST(1, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  //in product #1, this function takes 1 argument
  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.DIST("foo", TRUE())'],
      ['=NORM.S.DIST(1, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  //in product #1, this function takes 1 argument
  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.DIST(-1, TRUE())'],
      ['=NORM.S.DIST(0.5, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.158655253931457, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.691462461274013, 6)
  })

  //in product #1, this function takes 1 argument
  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NORM.S.DIST(-1, FALSE())'],
      ['=NORM.S.DIST(0.5, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.241970724519143, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.3520653267643, 6)
  })
})
