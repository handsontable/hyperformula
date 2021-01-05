import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function TODAY', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TODAY()'],
    ])
    expect(engine.getCellValue(adr('A1'))).not.toBeNull()
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATE)
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TODAY(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
