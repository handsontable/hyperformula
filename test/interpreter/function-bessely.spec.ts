import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function BESSELY', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELY(1)'],
      ['=BESSELY(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELY("foo", 1)'],
      ['=BESSELY(2, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELY(0.1,0)'],
      ['=BESSELY(1,0)'],
      ['=BESSELY(5,0)'],
      ['=BESSELY(0.1,1)'],
      ['=BESSELY(1,1)'],
      ['=BESSELY(5,1)'],
      ['=BESSELY(0.1,3)'],
      ['=BESSELY(1,3)'],
      ['=BESSELY(5,3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-1.53423866134966, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0882569713977081, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.308517623032057, 6)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(-6.45895109099111, 6)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(-0.78121282095312, 6)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(0.147863139887343, 6)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(-5099.33237524791, 6)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(-5.82151763226267, 6)
    expect(engine.getCellValue(adr('A9'))).toBeCloseTo(0.146267163302253, 6)
  })

  it('should check bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELY(1, -0.001)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))

  })

  it('should truncate second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BESSELY(0.1,0.9)'],
      ['=BESSELY(1,0.9)'],
      ['=BESSELY(5,0.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-1.53423866134966, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0882569713977081, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.308517623032057, 6)
  })
})
