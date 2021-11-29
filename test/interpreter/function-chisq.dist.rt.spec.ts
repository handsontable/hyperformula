import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CHISQ.DIST.RT', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST.RT(1)'],
      ['=CHISQ.DIST.RT(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST.RT("foo", 2)'],
      ['=CHISQ.DIST.RT(1, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST.RT(1, 1)'],
      ['=CHISQ.DIST.RT(3, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.317310507862944, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.22313016014843, 6)
  })

  it('truncates second arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST.RT(1, 1.9)'],
      ['=CHISQ.DIST.RT(3, 2.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.317310507862944, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.22313016014843, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST.RT(10, 0.999)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
