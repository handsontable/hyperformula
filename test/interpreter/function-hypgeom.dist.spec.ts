import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HYPGEOM.DIST', () => {
  //In product #1, function takes 4 arguments.
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HYPGEOM.DIST(1, 2, 3, 4)'],
      ['=HYPGEOM.DIST(1, 2, 3, 4, 5, 6)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  //In product #1, function takes 4 arguments.
  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HYPGEOM.DIST("foo", 2, 3, 4, TRUE())'],
      ['=HYPGEOM.DIST(1, "baz", 3, 4, TRUE())'],
      ['=HYPGEOM.DIST(1, 2, "baz", 4, TRUE())'],
      ['=HYPGEOM.DIST(1, 2, 3, "baz", TRUE())'],
      ['=HYPGEOM.DIST(1, 1, 1, 1, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  //In product #1, function takes 4 arguments.
  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HYPGEOM.DIST(4, 12, 20, 40, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.150422391245528, 6)
  })

  //In product #1, function takes 4 arguments.
  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HYPGEOM.DIST(4, 12, 20, 40, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.109243002735772, 6)
  })

  //In product #1, function takes 4 arguments.
  it('truncation works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HYPGEOM.DIST(4.9, 12, 20, 40, TRUE())'],
      ['=HYPGEOM.DIST(4, 12.9, 20, 40, TRUE())'],
      ['=HYPGEOM.DIST(4, 12, 20.9, 40, TRUE())'],
      ['=HYPGEOM.DIST(4, 12, 20, 40.9, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.150422391245528, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.150422391245528, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.150422391245528, 6)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(0.150422391245528, 6)
  })

  //In product #1, function takes 4 arguments.
  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HYPGEOM.DIST(0, 12, 20, 40, TRUE())'],
      ['=HYPGEOM.DIST(-1, 12, 20, 40, TRUE())'],
      ['=HYPGEOM.DIST(12, 12, 20, 40, TRUE())'],
      ['=HYPGEOM.DIST(12.1, 12, 20, 40, TRUE())'],
      ['=HYPGEOM.DIST(12, 20, 12, 40, TRUE())'],
      ['=HYPGEOM.DIST(12.1, 20, 12, 40, TRUE())'],
      ['=HYPGEOM.DIST(4, 20, 4, 20, TRUE())'],
      ['=HYPGEOM.DIST(4, 20, 4, 19.9, TRUE())'],
      ['=HYPGEOM.DIST(4, 4, 20, 20, TRUE())'],
      ['=HYPGEOM.DIST(4, 4, 20, 19.9, TRUE())'],
      ['=HYPGEOM.DIST(10, 20, 20, 30, TRUE())'],
      ['=HYPGEOM.DIST(10, 20.1, 20, 30, TRUE())'],
      ['=HYPGEOM.DIST(0, 0.1, 0.1, 0.9, TRUE())'],
      ['=HYPGEOM.DIST(10.9, 21, 20, 30.9, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0000225475753840604, 6)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    //product #2 returns value here
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    //product #2 returns value here
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A9'))).toEqual(1)
    expect(engine.getCellValue(adr('A10'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A11'))).toBeCloseTo(0.00614930629923134, 6)
    //product #2 returns value here
    expect(engine.getCellValue(adr('A12'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A13'))).toEqual(1)
    //value should be 0 or Error, product #1 gives different answer
    expect(engine.getCellValue(adr('A14'))).toEqual(0)
  })
})
