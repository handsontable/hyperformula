import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PHI', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=PHI()'],
      ['=PHI(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=PHI("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=PHI(-0.5)'],
      ['=PHI(0)'],
      ['=PHI(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.3520653267643, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.398942280401433, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.241970724519143, 6)
  })
})
