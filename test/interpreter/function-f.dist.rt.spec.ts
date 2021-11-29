import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function F.DIST.RT', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST.RT(1, 2)'],
      ['=F.DIST.RT(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST.RT("foo", 2, 3)'],
      ['=F.DIST.RT(1, "baz", 3)'],
      ['=F.DIST.RT(1, 2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST.RT(1, 1, 1)'],
      ['=F.DIST.RT(3, 2, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.25, 6)
  })

  it('truncates second and third args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST.RT(1, 1.9, 1)'],
      ['=F.DIST.RT(3, 2, 2.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.25, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=F.DIST.RT(0, 1, 1)'],
      ['=F.DIST.RT(-0.001, 1, 1)'],
      ['=F.DIST.RT(0, 0.999, 1)'],
      ['=F.DIST.RT(0, 1, 0.999)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
