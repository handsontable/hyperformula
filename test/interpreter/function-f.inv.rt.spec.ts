import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function F.INV.RT', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=F.INV.RT(1, 2)'],
      ['=F.INV.RT(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=F.INV.RT("foo", 2, 3)'],
      ['=F.INV.RT(1, "baz", 3)'],
      ['=F.INV.RT(1, 2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=F.INV.RT(0.1, 1, 1)'],
      ['=F.INV.RT(0.9, 2, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(39.8634581890474, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.111111111111111, 6)
  })

  it('truncates second and third arg', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=F.INV.RT(0.1, 1.9, 1)'],
      ['=F.INV.RT(0.9, 2, 2.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(39.8634581890474, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.111111111111111, 6)
  })

  it('checks bounds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=F.INV.RT(0.5, 0.999, 1)'],
      ['=F.INV.RT(0.5, 1, 0.999)'],
      ['=F.INV.RT(-0.0001, 2, 1)'],
      ['=F.INV.RT(1.0001, 2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
